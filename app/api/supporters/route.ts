import {
  normaliseSupporters,
  readTotal,
  type SupportersResponse,
} from '@/lib/supporters';

const ENDPOINT = 'https://developers.buymeacoffee.com/api/v1/supporters';

// Long enough that traffic to the blog does not become traffic to Buy Me a Coffee,
// short enough that a new supporter sees their name the same day.
const REVALIDATE_SECONDS = 3600;

const EMPTY: SupportersResponse = { supporters: [], total: 0 };

/**
 * Answers in our own shape rather than passing Buy Me a Coffee's through, so the token
 * stays on this side and the component never learns their payload.
 *
 * Every failure answers 200 with an empty list. The band treats empty as "do not
 * mount", so a missing token or an outage costs the reader nothing: the card keeps its
 * copy and its buttons.
 */
export async function GET() {
  const token = process.env.BMC_TOKEN;
  if (!token) return Response.json(EMPTY);

  try {
    const response = await fetch(ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return Response.json(EMPTY);

    const payload = await response.json();
    const supporters = normaliseSupporters(payload);

    return Response.json({
      supporters,
      total: readTotal(payload, supporters.length),
    } satisfies SupportersResponse);
  } catch {
    return Response.json(EMPTY);
  }
}
