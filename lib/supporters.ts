export interface Supporter {
  name: string;
  amount: number;
  currency: string;
}

export interface SupportersResponse {
  supporters: Supporter[];
  total: number;
}

const FALLBACK_CURRENCY = 'USD';

/**
 * Reads Buy Me a Coffee's `/v1/supporters` page into the two facts the band draws.
 * Isolated here so adjusting to their payload is a change to one function, checkable
 * without a network.
 *
 * Their reference is the only description of this shape and it is marked no longer
 * maintained, so the reads stay tolerant: a row that cannot be understood is dropped
 * rather than rendered half-built.
 */
export function normaliseSupporters(payload: unknown): Supporter[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  return rows.flatMap((row) => {
    if (typeof row !== 'object' || row === null) return [];
    const record = row as Record<string, unknown>;

    if (record.is_refunded) return [];

    // Excluded on 0 rather than included on 1. If this field means the opposite of what
    // the reference implies, erring this way shows nobody, which is visible and
    // reversible; erring the other way publishes a name someone asked to keep private.
    if (readNumber(record.support_visibility) === 0) return [];

    // `supporter_name` is null on every row of their own example and the name lands in
    // `payer_name`, so neither alone is enough.
    const name =
      readString(record.supporter_name) ?? readString(record.payer_name);

    // Two fields, not one: `support_coffees` counts the coffees and
    // `support_coffee_price` prices one of them. Reading either alone turns a single
    // 5 EUR coffee into "1".
    const coffees = readNumber(record.support_coffees) ?? 1;
    const price = readNumber(record.support_coffee_price);
    if (price === undefined) return [];

    return [
      {
        // Buy Me a Coffee lets people give without naming themselves, and an unnamed
        // supporter still deserves a line.
        name: name ?? 'Anonymous',
        amount: coffees * price,
        currency: readString(record.support_currency) ?? FALLBACK_CURRENCY,
      },
    ];
  });
}

/**
 * The count of everyone who ever gave, which is not the length of what came back: the
 * endpoint pages five at a time and the band only shows the most recent handful. Falls
 * back to the page's own length, which is at least never a lie about the rows on screen.
 */
export function readTotal(payload: unknown, fallback: number): number {
  if (typeof payload !== 'object' || payload === null) return fallback;
  return readNumber((payload as Record<string, unknown>).total) ?? fallback;
}

/**
 * Whole units, because a supporter list is a wall of thanks, not an invoice.
 *
 * The currency is guarded here rather than at the normaliser, because this is where an
 * unusable code would actually bite: `Intl` throws on one, and the throw would take the
 * whole band down over a symbol. `Supporter.currency` is a `string`, so being total for
 * any string is this function keeping its own signature's promise.
 */
export function formatAmount({ amount, currency }: Supporter): string {
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
  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? parsed
    : undefined;
}
