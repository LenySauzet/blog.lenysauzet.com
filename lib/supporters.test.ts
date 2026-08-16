import { describe, expect, it } from 'vitest';

import { normaliseSupporters, readTotal } from './supporters';

// This layer exists because Buy Me a Coffee's payload is not documented publicly, so
// these cases are the contract: whatever shape arrives, the band gets rows it can draw
// or nothing at all. Never a crash, and never a half-built row.
describe('normaliseSupporters', () => {
  it('reads a paged payload', () => {
    const rows = normaliseSupporters({
      data: [{ supporter_name: 'Mateo Rossi', support_coffees: 33 }],
    });

    expect(rows).toEqual([{ name: 'Mateo Rossi', amount: 33 }]);
  });

  it('reads a bare array just as well', () => {
    const rows = normaliseSupporters([
      { supporter_name: 'Ingrid Holm', support_coffees: 18 },
    ]);

    expect(rows).toEqual([{ name: 'Ingrid Holm', amount: 18 }]);
  });

  it('accepts an amount that arrived as a string', () => {
    const [row] = normaliseSupporters([
      { supporter_name: 'Amara Okafor', support_coffees: '48' },
    ]);

    expect(row.amount).toBe(48);
  });

  // Buy Me a Coffee lets people give without naming themselves.
  it('names an unnamed supporter rather than dropping them', () => {
    const [row] = normaliseSupporters([{ support_coffees: 5 }]);

    expect(row).toEqual({ name: 'Anonymous', amount: 5 });
  });

  it('falls back to zero rather than rendering NaN', () => {
    const [row] = normaliseSupporters([
      { supporter_name: 'Leo Marchetti', support_coffees: 'nope' },
    ]);

    expect(row.amount).toBe(0);
  });

  it.each([null, undefined, {}, { data: 'nope' }, 42])(
    'returns nothing for %s rather than throwing',
    (payload) => {
      expect(normaliseSupporters(payload)).toEqual([]);
    }
  );
});

describe('readTotal', () => {
  it('prefers the count the API reports', () => {
    expect(readTotal({ total: 1284, data: [{}] }, 1)).toBe(1284);
  });

  // The endpoint pages, so the rows in hand are only ever the most recent few.
  it('falls back to what actually arrived', () => {
    expect(readTotal({ data: [{}, {}] }, 2)).toBe(2);
  });

  it('survives a payload that is not an object', () => {
    expect(readTotal('nope', 7)).toBe(7);
  });
});
