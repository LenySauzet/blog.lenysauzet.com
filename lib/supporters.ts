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

export type Dated<T> = T & { at: string };

const FALLBACK_CURRENCY = 'USD';

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

const isPrivate = (row: Record<string, unknown>) =>
  Boolean(row.support_hidden) || Boolean(row.is_refunded);

const readName = (row: Record<string, unknown>) =>
  readString(row.supporter_name) ?? readString(row.payer_name) ?? 'Anonymous';

export function normaliseSupporters(payload: unknown): Dated<Supporter>[] {
  return rowsOf(payload).flatMap((row) => {
    if (isPrivate(row)) return [];
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

// Fixed-width `YYYY-MM-DD HH:MM:SS` sorts as a string; parsing would invent a time zone.
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

export function readTotal(payload: unknown, fallback: number): number {
  if (typeof payload !== 'object' || payload === null) return fallback;
  return readNumber((payload as Record<string, unknown>).total) ?? fallback;
}

// `Intl` throws on a malformed currency code.
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

// `Number('')` is 0; `readTotal` reads a real 0, so only amounts go through here.
function readPositive(value: unknown) {
  const parsed = readNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function readNumber(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
}
