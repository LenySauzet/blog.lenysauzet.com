export interface Supporter {
  name: string;
  amount: number;
  currency: string;
  recurring: boolean;
}

export interface SupportersResponse {
  supporters: Supporter[];
  total: number;
}

/** Carries the sort key only as far as the merge. */
export type Dated<T> = T & { at: string };

const FALLBACK_CURRENCY = 'USD';

// Buy Me a Coffee answers 200 to everything: no rows is `{ error: "No supporters" }`,
// and a stale token is their login page. Only the body tells them apart.
function rowsOf(payload: unknown): Record<string, unknown>[] {
  const data = Array.isArray(payload)
    ? payload
    : (payload as { data?: unknown })?.data;
  return Array.isArray(data)
    ? (data.filter((row) => typeof row === 'object' && row !== null) as Record<
        string,
        unknown
      >[])
    : [];
}

// Excluded on a signal rather than included on one: guessing wrong this way shows
// nobody, guessing wrong the other way publishes a name someone hid. `support_hidden`
// is undocumented and came back on the live payload, so it is read here too.
const isPrivate = (row: Record<string, unknown>) =>
  Boolean(row.support_hidden) ||
  Boolean(row.is_refunded) ||
  readNumber(row.support_visibility) === 0;

/** `supporter_name` is null on plenty of real rows, the name being in `payer_name`. */
const readName = (row: Record<string, unknown>) =>
  readString(row.supporter_name) ?? readString(row.payer_name) ?? 'Anonymous';

export function normaliseSupporters(payload: unknown): Dated<Supporter>[] {
  return rowsOf(payload).flatMap((row) => {
    if (isPrivate(row)) return [];
    // `support_coffees` counts them, `support_coffee_price` prices one. Either alone
    // turns a 5 EUR coffee into "1".
    const price = readPositive(row.support_coffee_price);
    if (price === undefined) return [];

    return [
      {
        name: readName(row),
        amount: (readPositive(row.support_coffees) ?? 1) * price,
        currency: readString(row.support_currency) ?? FALLBACK_CURRENCY,
        recurring: false,
        at: readString(row.support_created_on) ?? '',
      },
    ];
  });
}

// Their reference lists no privacy field for a member, but it also omitted
// `support_hidden` where it does document one, so `isPrivate` runs here too.
export function normaliseMembers(payload: unknown): Dated<Supporter>[] {
  return rowsOf(payload).flatMap((row) => {
    if (isPrivate(row)) return [];
    // Cancelled at period end is paid up and still support; cancelled outright is not.
    if (row.subscription_is_cancelled && !row.subscription_is_cancelled_at_period_end)
      return [];

    const price = readPositive(row.subscription_coffee_price);
    if (price === undefined) return [];

    return [
      {
        name: readName(row),
        amount: (readPositive(row.subscription_coffee_num) ?? 1) * price,
        currency: readString(row.subscription_currency) ?? FALLBACK_CURRENCY,
        recurring: true,
        at: readString(row.subscription_created_on) ?? '',
      },
    ];
  });
}

// Sorted as strings: both endpoints stamp a fixed-width `YYYY-MM-DD HH:MM:SS`, which
// already orders chronologically. Parsing would mean inventing a timezone.
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

/** Everyone who ever gave, which is not the rows in hand: the endpoint pages by five. */
export function readTotal(payload: unknown, fallback: number): number {
  if (typeof payload !== 'object' || payload === null) return fallback;
  return readNumber((payload as Record<string, unknown>).total) ?? fallback;
}

// Guarded here rather than at the normaliser because this is where a bad code bites:
// `Intl` throws on one, taking the band down over a symbol.
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

// `Number('')` is 0, and a negative is finite, so a malformed row would otherwise
// publish "EUR 0" or a negative. Only amounts want this: `readTotal` reads a real 0.
function readPositive(value: unknown) {
  const parsed = readNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function readNumber(value: unknown) {
  // Prices arrive as strings ("5.0000"), counts as numbers.
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
}
