import { describe, expect, it } from 'vitest';

import {
  formatAmount,
  mergeRecent,
  normaliseMembers,
  normaliseSupporters,
  readTotal,
} from './supporters';

// Lifted from the live /v1/supporters response, trimmed to the fields this reads and
// with the personal ones replaced. Their published reference omits `support_hidden`
// entirely and shows `supporter_name` null on every row, so a real payload is the only
// trustworthy fixture.
const COFFEE = {
  support_id: 10030855,
  support_coffees: 1,
  support_coffee_price: '5.0000',
  support_currency: 'EUR',
  support_visibility: 1,
  support_hidden: 0,
  is_refunded: null,
  support_created_on: '2025-03-31 10:18:36',
  supporter_name: 'Louis Yvelin',
  payer_name: 'Louis Yvelin',
};

// Shaped from their reference, since no member exists yet to read one from.
const MEMBER = {
  subscription_id: 10647,
  subscription_coffee_price: '5.000',
  subscription_coffee_num: 1,
  subscription_currency: 'EUR',
  subscription_is_cancelled: null,
  subscription_is_cancelled_at_period_end: null,
  subscription_created_on: '2026-08-22 12:40:00',
  payer_name: 'Ingrid Holm',
};

describe('normaliseSupporters', () => {
  it('reads the live payload', () => {
    expect(normaliseSupporters({ current_page: 1, data: [COFFEE] })).toEqual([
      {
        name: 'Louis Yvelin',
        amount: 5,
        currency: 'EUR',
        recurring: false,
        at: '2025-03-31 10:18:36',
      },
    ]);
  });

  // The whole reason two fields are read instead of one.
  it('multiplies the coffees by their price', () => {
    const [row] = normaliseSupporters([
      { ...COFFEE, support_coffees: 3, support_coffee_price: '5.0000' },
    ]);
    expect(row.amount).toBe(15);
  });

  // Their reference shows `supporter_name` null on every row of its own example, with
  // the name in `payer_name`, so neither field alone is enough.
  it('falls back to the payer when the supporter did not name themselves', () => {
    const [row] = normaliseSupporters([
      { ...COFFEE, supporter_name: null, payer_name: 'Yuki Tanaka' },
    ]);
    expect(row.name).toBe('Yuki Tanaka');
  });

  it('prefers the chosen name over the billing one', () => {
    const [row] = normaliseSupporters([
      { ...COFFEE, supporter_name: 'Ella', payer_name: 'Eleanor Novak' },
    ]);
    expect(row.name).toBe('Ella');
  });

  it.each([null, '', '   '])('names a supporter with %p as Anonymous', (name) => {
    const [row] = normaliseSupporters([
      { ...COFFEE, supporter_name: name, payer_name: name },
    ]);
    expect(row.name).toBe('Anonymous');
  });

  // Publishing a name against someone's wishes is the one failure here that cannot be
  // undone, so each of these errs towards showing nobody.
  it.each([
    ['refunded', { is_refunded: 1 }],
    ['marked not visible', { support_visibility: 0 }],
    ['hidden', { support_hidden: 1 }],
  ])('drops a support that is %s', (_label, override) => {
    expect(normaliseSupporters([{ ...COFFEE, ...override }])).toEqual([]);
  });

  it('drops a row with no price rather than showing a free coffee', () => {
    expect(normaliseSupporters([{ ...COFFEE, support_coffee_price: null }])).toEqual([]);
  });

  // Every one of these is a real answer from their API, all of them served as HTTP 200.
  it.each([
    ['no supporters', { error: 'No supporters' }],
    ['a page past the end', { error: 'No supporters' }],
    ['a failed content-type check', null],
    ['nonsense', 42],
    ['a string', 'nope'],
    ['a bad data key', { data: 'nope' }],
  ])('returns nothing for %s rather than throwing', (_label, payload) => {
    expect(normaliseSupporters(payload)).toEqual([]);
  });
});

describe('normaliseMembers', () => {
  it('reads a member and marks them recurring', () => {
    expect(normaliseMembers({ data: [MEMBER] })).toEqual([
      {
        name: 'Ingrid Holm',
        amount: 5,
        currency: 'EUR',
        recurring: true,
        at: '2026-08-22 12:40:00',
      },
    ]);
  });

  it('multiplies the coffee count by its price', () => {
    const [row] = normaliseMembers([{ ...MEMBER, subscription_coffee_num: 3 }]);
    expect(row.amount).toBe(15);
  });

  // A cancelled membership is paid to the end of its period, so it is still support.
  it('keeps a membership cancelled at period end', () => {
    const rows = normaliseMembers([
      {
        ...MEMBER,
        subscription_is_cancelled: 1,
        subscription_is_cancelled_at_period_end: 1,
      },
    ]);
    expect(rows).toHaveLength(1);
  });

  it('drops one cancelled outright', () => {
    expect(
      normaliseMembers([{ ...MEMBER, subscription_is_cancelled: 1 }])
    ).toEqual([]);
  });

  // Their reference lists no privacy field for a member, but it also omitted
  // `support_hidden` on the endpoint it does document, so these are honoured if present.
  it.each(['support_hidden', 'is_refunded'])('honours %s if it is present', (field) => {
    expect(normaliseMembers([{ ...MEMBER, [field]: 1 }])).toEqual([]);
  });

  it('returns nothing for the "No subscriptions" answer', () => {
    expect(normaliseMembers({ error: 'No subscriptions' })).toEqual([]);
  });
});

describe('mergeRecent', () => {
  it('orders newest first, whichever endpoint it came from', () => {
    const merged = mergeRecent(
      normaliseMembers([MEMBER]),
      normaliseSupporters([COFFEE])
    );
    expect(merged.map((s) => s.name)).toEqual(['Ingrid Holm', 'Louis Yvelin']);
  });

  // The timestamp is a sorting key, not something the browser needs.
  it('does not leak the timestamp to the client', () => {
    const [row] = mergeRecent(normaliseSupporters([COFFEE]));
    expect(row).not.toHaveProperty('at');
  });

  it('survives both lists being empty', () => {
    expect(mergeRecent([], [])).toEqual([]);
  });
});

describe('readTotal', () => {
  it('prefers the count the API reports', () => {
    expect(readTotal({ total: 1284, data: [COFFEE] }, 1)).toBe(1284);
  });

  it('falls back to what actually arrived', () => {
    expect(readTotal({ data: [COFFEE, COFFEE] }, 2)).toBe(2);
  });

  it('survives a payload that is not an object', () => {
    expect(readTotal('nope', 7)).toBe(7);
  });
});

describe('formatAmount', () => {
  it('renders the row in the currency it was given', () => {
    expect(formatAmount({ amount: 5, currency: 'EUR' })).toBe('€5');
  });

  // An unrecognised code would make Intl throw and take the whole band down.
  it.each(['nope', '', 'E€R'])('falls back rather than throwing on %p', (currency) => {
    expect(formatAmount({ amount: 5, currency })).toBe('$5');
  });
});
