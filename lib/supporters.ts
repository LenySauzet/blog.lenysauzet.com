export interface Supporter {
  name: string;
  amount: number;
}

export interface SupportersResponse {
  supporters: Supporter[];
  total: number;
}

/**
 * Buy Me a Coffee's field names are not documented publicly — the developer portal sits
 * behind a login — so every guess about their payload is isolated here rather than
 * spread through the route and the component. Adjusting to a real response is a change
 * to this function alone, and it can be checked without a network.
 *
 * Anything it cannot read it drops. A supporter with no usable name or amount is worse
 * than one fewer name on the list.
 */
export function normaliseSupporters(payload: unknown): Supporter[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data as unknown[])
      : [];

  return rows.flatMap((row) => {
    if (typeof row !== 'object' || row === null) return [];
    const record = row as Record<string, unknown>;

    const name = firstString(record, [
      'supporter_name',
      'payer_name',
      'name',
    ]);
    const amount = firstNumber(record, [
      'support_coffees',
      'amount',
      'support_coffee_price',
    ]);

    // Buy Me a Coffee lets people give without naming themselves, and an unnamed
    // supporter still deserves a line.
    return [{ name: name ?? 'Anonymous', amount: amount ?? 0 }];
  });
}

/**
 * The count of everyone who ever gave, which is not the length of what came back: the
 * endpoint pages, and the band only ever shows the most recent handful. Falls back to
 * the page's own length, which is at least never a lie about the rows on screen.
 */
export function readTotal(payload: unknown, fallback: number): number {
  if (typeof payload !== 'object' || payload === null) return fallback;
  const total = firstNumber(payload as Record<string, unknown>, [
    'total',
    'total_count',
    'count',
  ]);
  return total ?? fallback;
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function firstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (typeof parsed === 'number' && Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
