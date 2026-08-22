import {
  mergeRecent,
  normaliseMembers,
  normaliseSupporters,
  readTotal,
  type SupportersResponse,
} from '@/lib/supporters';

const API = 'https://developers.buymeacoffee.com/api/v1';

// Long enough that traffic to the blog does not become traffic to Buy Me a Coffee,
// short enough that a new supporter sees their name the same day.
const REVALIDATE_SECONDS = 3600;

// Their endpoint returns five rows a page and ignores `per_page`, so more than a
// handful of names means walking pages. Bounded because the band is a wall of thanks
// rather than an archive, and every page is a request they have to serve.
const MAX_PAGES = 4;

const EMPTY: SupportersResponse = { supporters: [], total: 0 };

/**
 * Answers in our own shape rather than passing Buy Me a Coffee's through, so the token
 * stays on this side and the component never learns their payload.
 *
 * Every failure answers 200 with an empty list. The band treats empty as "do not mount",
 * so a missing token or an outage costs the reader nothing: the card keeps its copy and
 * its buttons.
 */
export async function GET() {
  const token = process.env.BMC_TOKEN;
  if (!token) return Response.json(EMPTY);

  const get = async (path: string) => {
    const response = await fetch(`${API}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    // `response.ok` proves nothing here. Buy Me a Coffee answers 200 to everything: an
    // empty result is `{ error: "No supporters" }`, and an expired token is a 200
    // carrying their login page. Only the content type separates data from a redirect.
    if (!response.headers.get('content-type')?.includes('application/json')) {
      return null;
    }
    return response.json();
  };

  try {
    // Page 1 first, because its `last_page` is what says whether the rest exist.
    const first = await get('supporters');
    const pages = [first];

    const lastPage = Math.min(Number(first?.last_page) || 1, MAX_PAGES);
    if (lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) =>
          get(`supporters?page=${i + 2}`)
        )
      );
      pages.push(...rest);
    }

    const members = await get('subscriptions?status=active');

    const supporters = mergeRecent(
      normaliseMembers(members),
      ...pages.map(normaliseSupporters)
    );

    return Response.json({
      supporters,
      total: readTotal(first, 0) + readTotal(members, 0) || supporters.length,
    } satisfies SupportersResponse);
  } catch {
    return Response.json(EMPTY);
  }
}
