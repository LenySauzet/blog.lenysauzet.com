import type { IncomingMessage } from 'node:http';

import { readMetadata } from '@/lib/link-preview/metadata';
import { requestPinned } from '@/lib/link-preview/pinned-request';
import { resolvePublicAddress } from '@/lib/link-preview/safe-url';
import type { LinkMetadata } from '@/lib/link-preview/types';

const UPSTREAM_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

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
      'Cache-Control': `public, s-maxage=${A_DAY}, stale-while-revalidate=${A_WEEK}`,
    },
  });

/** Redirects are walked by hand so the address is checked again on every hop. */
async function reach(url: URL, accept: string) {
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const address = await resolvePublicAddress(url);
    if (!address) return undefined;

    const response = await requestPinned(
      url,
      address,
      { 'User-Agent': AGENT, Accept: accept },
      UPSTREAM_TIMEOUT_MS
    );

    const status = response.statusCode ?? 0;
    const redirected = status >= 300 && status < 400 && response.headers.location;

    if (!redirected) {
      if (status >= 200 && status < 300) return { response, url };

      response.destroy();
      return undefined;
    }

    response.destroy();
    if (!URL.canParse(redirected, url)) return undefined;
    url = new URL(redirected, url);
  }

  return undefined;
}

async function readBounded(response: IncomingMessage) {
  let text = '';

  try {
    response.setEncoding('utf8');

    for await (const chunk of response) {
      text += chunk;
      if (text.length >= MAX_BYTES || /<\/head>/i.test(text)) break;
    }
  } finally {
    response.destroy();
  }

  return text;
}

async function viaOembed(
  endpoint: string,
  target: URL
): Promise<LinkMetadata | undefined> {
  const url = new URL(endpoint);
  url.searchParams.set('url', target.href);
  url.searchParams.set('format', 'json');

  const reached = await reach(url, 'application/json');
  if (!reached) return undefined;

  const payload = JSON.parse(await readBounded(reached.response)) as Record<
    string,
    unknown
  >;
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

/** Answers in our own shape, and an empty one on every failure: the island then
    keeps what the URL alone told it, which is already a preview. */
export async function GET(request: Request) {
  const href = new URL(request.url).searchParams.get('url');
  if (!href || !URL.canParse(href)) return answer({});

  const target = new URL(href);

  try {
    // Richer than their own tags, and a video they refuse here still has a page.
    const endpoint = OEMBED[target.hostname];
    const embedded = endpoint && (await viaOembed(endpoint, target));
    if (embedded) return answer(embedded);

    const reached = await reach(target, 'text/html');
    if (!reached) return answer({});

    if (!(reached.response.headers['content-type'] ?? '').includes('html')) {
      reached.response.destroy();
      return answer({});
    }

    return answer(readMetadata(await readBounded(reached.response), reached.url.href));
  } catch {
    return answer({});
  }
}
