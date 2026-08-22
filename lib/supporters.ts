export interface Supporter {
  name: string;
  amount: number;
  currency: string;
  /** A monthly member rather than a one-off coffee. The two must not read alike. */
  recurring: boolean;
}

export interface SupportersResponse {
  supporters: Supporter[];
  total: number;
}

const FALLBACK_CURRENCY = 'USD';

/**
 * Buy Me a Coffee answers 200 for everything, so the status line says nothing: an empty
 * result is `{ error: "No supporters" }` and an expired token is a redirect to their
 * login page. Only the body distinguishes them, which is why every read here starts by
 * asking whether rows arrived at all rather than by trusting the request.
 */
function rowsOf(payload: unknown): Record<string, unknown>[] {
  const data = Array.isArray(payload)
    ? payload
    : (payload as { data?: unknown })?.data;
  return Array.isArray(data)
    ? (data.filter(
        (row) => typeof row === 'object' && row !== null
      ) as Record<string, unknown>[])
    : [];
}

/**
 * Whether this supporter asked not to be shown.
 *
 * Excluded on an explicit signal rather than included on one: if a field means the
 * opposite of what it appears to, erring this way shows nobody, which is visible and
 * reversible, while erring the other way publishes a name someone asked to keep private.
 *
 * `support_hidden` is not in their reference at all. It came back on the real payload,
 * which is the measure of how far that reference can be trusted.
 */
const isPrivate = (row: Record<string, unknown>) =>
  Boolean(row.support_hidden) ||
  Boolean(row.is_refunded) ||
  readNumber(row.support_visibility) === 0;

/** `supporter_name` is null on plenty of real rows, with the name in `payer_name`. */
const readName = (row: Record<string, unknown>) =>
  readString(row.supporter_name) ?? readString(row.payer_name) ?? 'Anonymous';

/**
 * One-off coffees, from `/v1/supporters`.
 *
 * Two fields make the amount, not one: `support_coffees` counts the coffees and
 * `support_coffee_price` prices a single one. Reading either alone turns a real 5 EUR
 * coffee into "1".
 */
export function normaliseSupporters(payload: unknown): Dated<Supporter>[] {
  return rowsOf(payload).flatMap((row) => {
    if (isPrivate(row)) return [];
    const price = readNumber(row.support_coffee_price);
    if (price === undefined) return [];

    return [
      {
        name: readName(row),
        amount: (readNumber(row.support_coffees) ?? 1) * price,
        currency: readString(row.support_currency) ?? FALLBACK_CURRENCY,
        recurring: false,
        at: readString(row.support_created_on) ?? '',
      },
    ];
  });
}

/**
 * Monthly members, from `/v1/subscriptions`.
 *
 * Their reference lists no privacy field for a member at all, only `message_visibility`,
 * which governs the message rather than the name. It also failed to list `support_hidden`
 * on the endpoint it does document, so absence there is not evidence. `isPrivate` runs
 * over a member the same way, honouring those fields if the payload carries them.
 */
export function normaliseMembers(payload: unknown): Dated<Supporter>[] {
  return rowsOf(payload).flatMap((row) => {
    if (isPrivate(row)) return [];
    // A cancelled membership keeps running to the end of the period it was paid for, so
    // only a finished one is dropped.
    if (row.subscription_is_cancelled && !row.subscription_is_cancelled_at_period_end) {
      return [];
    }
    const price = readNumber(row.subscription_coffee_price);
    if (price === undefined) return [];

    return [
      {
        name: readName(row),
        amount: (readNumber(row.subscription_coffee_num) ?? 1) * price,
        currency: readString(row.subscription_currency) ?? FALLBACK_CURRENCY,
        recurring: true,
        at: readString(row.subscription_created_on) ?? '',
      },
    ];
  });
}

/** Carries the timestamp only as far as the merge, never to the browser. */
export type Dated<T> = T & { at: string };

/**
 * Newest first, which is what "Recent supporters" claims.
 *
 * Sorted as strings: both endpoints stamp `YYYY-MM-DD HH:MM:SS`, a fixed-width format
 * that already sorts chronologically, so this needs no date parsing. Parsing would mean
 * guessing a timezone the API never states.
 */
export function mergeRecent(...groups: Dated<Supporter>[][]): Supporter[] {
  return groups
    .flat()
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ name, amount, currency, recurring }) => ({
      name,
      amount,
      currency,
      recurring,
    }));
}

/**
 * The count of everyone who ever gave, which is not the number of rows in hand: the
 * endpoint pages five at a time, whatever `per_page` is asked for. Falls back to the
 * rows actually held, which is at least never a lie about what is on screen.
 */
export function readTotal(payload: unknown, fallback: number): number {
  if (typeof payload !== 'object' || payload === null) return fallback;
  return readNumber((payload as Record<string, unknown>).total) ?? fallback;
}

/**
 * Whole units, because a supporter list is a wall of thanks, not an invoice.
 *
 * The currency is guarded here rather than at the normaliser, because this is where an
 * unusable code would bite: `Intl` throws on one, and the throw would take the whole band
 * down over a symbol.
 */
export function formatAmount({
  amount,
  currency,
}: Pick<Supporter, 'amount' | 'currency'>): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: /^[A-Za-z]{3}$/.test(currency) ? currency : FALLBACK_CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown) {
  // Prices arrive as strings ("5.0000"), counts as numbers.
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
}
