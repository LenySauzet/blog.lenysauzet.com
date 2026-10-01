import { readMetadata } from '@/lib/link-preview/metadata';
import { reachesTheOpenWeb } from '@/lib/link-preview/safe-url';
import type { LinkMetadata } from '@/lib/link-preview/types';

const UPSTREAM_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

// Everything read sits in the head; the rest of a page is of no interest, and a
// hostile one has no size at all.
const MAX_BYTES = 256 * 1024;

const A_DAY = 86400;
const A_WEEK = 604800;

// Plain curl is refused, or served something else, by enough sites to matter.
const AGENT =
  'Mozilla/5.0 (compatible; lenysauzet.com link preview; +https://blog.lenysauzet.com)';

const OEMBED: Record<string, string> = {
  'youtube.com': 'https://www.youtube.com/oembed',
  'www.youtube.com': 'https://www.youtube.com/oembed',
  'youtu.be': 'https://www.youtube.com/oembed',
};

const answer = (metadata: LinkMetadata) =>
  Response.json(metadata, {
    headers: {
      // What a page says about itself moves slowly, and the edge holding it is
      // what makes the next reader's hover instant.
      'Cache-Control': `public, s-maxage=${A_DAY}, stale-while-revalidate=${A_WEEK}`,
    },
  });

const get = (url: URL, accept: string) =>
  fetch(url, {
    headers: { 'User-Agent': AGENT, Accept: accept },
    redirect: 'manual',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

/** Redirects are followed by hand: the guard has to run again on every hop. */
async function reach(url: URL, accept: string) {
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!(await reachesTheOpenWeb(url))) return undefined;

    const response = await get(url, accept);
    const location = response.headers.get('location');

    if (response.status < 300 || response.status >= 400 || !location) {
      return response.ok ? { response, url } : undefined;
    }

    if (!URL.canParse(location, url)) return undefined;
    url = new URL(location, url);
  }

  return undefined;
}

async function readBounded(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let html = '';

  try {
    for (let read = 0; read < MAX_BYTES; ) {
      const { done, value } = await reader.read();
      if (done) break;

      read += value.byteLength;
      html += decoder.decode(value, { stream: true });

      if (/<\/head>/i.test(html)) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  return html;
}

async function viaOembed(endpoint: string, target: URL): Promise<LinkMetadata | undefined> {
  const url = new URL(endpoint);
  url.searchParams.set('url', target.href);
  url.searchParams.set('format', 'json');

  const reached = await reach(url, 'application/json');
  if (!reached) return undefined;

  const payload = (await reached.response.json()) as Record<string, unknown>;
  const text = (key: string) =>
    typeof payload[key] === 'string' ? (payload[key] as string) : undefined;

  if (!text('title')) return undefined;

  return {
    title: text('title'),
    description: text('author_name'),
    image: text('thumbnail_url'),
    site: text('provider_name'),
  };
}

/**
 * Answers in our own shape, so the browser never talks to the target site, and
 * answers an empty object on every failure: the island then keeps what the URL
 * alone told it, which is already a preview.
 */
export async function GET(request: Request) {
  const href = new URL(request.url).searchParams.get('url');
  if (!href || !URL.canParse(href)) return answer({});

  const target = new URL(href);

  try {
    // Richer than their own tags where it answers at all, and a video they will
    // not describe this way still has a page that describes itself.
    const endpoint = OEMBED[target.hostname];
    const embedded = endpoint && (await viaOembed(endpoint, target));
    if (embedded) return answer(embedded);

    const reached = await reach(target, 'text/html');
    if (!reached) return answer({});

    if (!(reached.response.headers.get('content-type') ?? '').includes('html')) {
      return answer({});
    }

    return answer(readMetadata(await readBounded(reached.response), reached.url.href));
  } catch {
    // Expected for anything slow, unreachable, or answering something other than
    // a page. The reader sees the preview the URL alone produced.
    return answer({});
  }
}
