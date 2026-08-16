import { describe, expect, it } from 'vitest';

import { formatAmount, normaliseSupporters, readTotal } from './supporters';

// Lifted from Buy Me a Coffee's own /v1/supporters example, trimmed to the fields this
// reads. Their reference is marked no longer maintained, so pinning a real row is what
// stops the reads drifting back to guesswork.
const ROW = {
  support_id: 245731,
  support_note: null,
  support_coffees: 1,
  support_visibility: 1,
  supporter_name: null,
  support_coffee_price: '3.0000',
  is_refunded: null,
  support_currency: 'GBP',
  payer_name: 'Quip Fora',
};

describe('normaliseSupporters', () => {
  it('reads their documented page', () => {
    expect(normaliseSupporters({ current_page: 1, data: [ROW] })).toEqual([
      { name: 'Quip Fora', amount: 3, currency: 'GBP' },
    ]);
  });

  // The whole reason two fields are read instead of one: coffees counts them, price
  // prices one. A single 5 EUR coffee is 5, not 1.
  it('multiplies the coffees by their price', () => {
    const [row] = normaliseSupporters([
      { ...ROW, support_coffees: 3, support_coffee_price: '5.0000' },
    ]);

    expect(row.amount).toBe(15);
  });

  it('assumes one coffee when the count is missing', () => {
    const [row] = normaliseSupporters([
      { ...ROW, support_coffees: null, support_coffee_price: '5.0000' },
    ]);

    expect(row.amount).toBe(5);
  });

  // `supporter_name` is null on every row of their own example.
  it('falls back to the payer when the supporter did not name themselves', () => {
    const [row] = normaliseSupporters([
      { ...ROW, supporter_name: 'Ingrid Holm' },
    ]);

    expect(row.name).toBe('Ingrid Holm');
  });

  it.each([null, '', '   '])(
    'names a supporter with %p as Anonymous',
    (name) => {
      const [row] = normaliseSupporters([
        { ...ROW, supporter_name: name, payer_name: name },
      ]);

      expect(row.name).toBe('Anonymous');
    }
  );

  it('drops a refunded support rather than thanking someone twice', () => {
    expect(normaliseSupporters([{ ...ROW, is_refunded: 1 }])).toEqual([]);
  });

  // Publishing a name against someone's wishes is the one failure that cannot be undone,
  // so this errs towards showing nobody.
  it('drops a support marked not visible', () => {
    expect(normaliseSupporters([{ ...ROW, support_visibility: 0 }])).toEqual(
      []
    );
  });

  it('drops a row with no price rather than showing a free coffee', () => {
    expect(
      normaliseSupporters([{ ...ROW, support_coffee_price: null }])
    ).toEqual([]);
  });

  it.each([null, undefined, {}, { data: 'nope' }, 42, 'nope'])(
    'returns nothing for %p rather than throwing',
    (payload) => {
      expect(normaliseSupporters(payload)).toEqual([]);
    }
  );
});

describe('readTotal', () => {
  it('prefers the count the API reports', () => {
    expect(readTotal({ total: 1284, data: [ROW] }, 1)).toBe(1284);
  });

  it('falls back to what actually arrived', () => {
    expect(readTotal({ data: [ROW, ROW] }, 2)).toBe(2);
  });

  it('survives a payload that is not an object', () => {
    expect(readTotal('nope', 7)).toBe(7);
  });
});

describe('formatAmount', () => {
  it('renders the row in the currency it was given', () => {
    expect(formatAmount({ name: 'x', amount: 5, currency: 'EUR' })).toBe('€5');
  });

  // An unrecognised code would make Intl throw and take the whole band down.
  it.each(['nope', '', 'E€R'])(
    'falls back rather than throwing on %p',
    (currency) => {
      expect(formatAmount({ name: 'x', amount: 5, currency })).toBe('$5');
    }
  );
});
