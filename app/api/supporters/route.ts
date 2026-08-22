import {
  mergeRecent,
  normaliseMembers,
  normaliseSupporters,
  readTotal,
  type SupportersResponse,
} from '@/lib/supporters';

const API = 'https://developers.buymeacoffee.com/api/v1';

const REVALIDATE_SECONDS = 3600;

// Their endpoint pages by five and ignores `per_page`. Bounded: this is a wall of
// thanks, not an archive.
const MAX_PAGES = 4;

// Without one, an upstream that accepts the connection but never answers holds this
// route open until the platform's own timeout.
const UPSTREAM_TIMEOUT_MS = 8000;

const EMPTY: SupportersResponse = { supporters: [], total: 0 };

function pagesToWalk(payload: unknown): number {
  const pages = Number((payload as { last_page?: unknown })?.last_page);
  return Number.isFinite(pages) ? Math.min(Math.max(pages, 1), MAX_PAGES) : 1;
}

/**
 * Answers in our own shape, so the token stays server-side. Every failure answers an
 * empty list, which the band renders as no band at all.
 */
export async function GET() {
  const token = process.env.BMC_TOKEN;
  if (!token) return Response.json(EMPTY);

  const get = async (path: string): Promise<unknown> => {
    const response = await fetch(`${API}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    // `response.ok` proves nothing: a stale token is a 200 carrying their login page.
    return response.headers.get('content-type')?.includes('application/json')
      ? response.json()
      : null;
  };

  try {
    const [first, members] = await Promise.all([
      get('supporters'),
      get('subscriptions?status=active'),
    ]);

    const rest = await Promise.all(
      Array.from({ length: pagesToWalk(first) - 1 }, (_, i) =>
        get(`supporters?page=${i + 2}`)
      )
    );

    const supporters = mergeRecent(
      normaliseMembers(members),
      ...[first, ...rest].map(normaliseSupporters)
    );

    return Response.json({
      supporters,
      // Floored at the names on screen: a smaller count would read as broken.
      total: Math.max(
        readTotal(first, 0) + readTotal(members, 0),
        supporters.length
      ),
    } satisfies SupportersResponse);
  } catch (error) {
    // The reader sees an empty band either way, but a dead token would otherwise fail
    // silently forever. Never log `error` wholesale: it can carry the request headers.
    console.error(
      '[supporters] Buy Me a Coffee request failed:',
      error instanceof Error ? error.message : 'unknown'
    );
    return Response.json(EMPTY);
  }
}
