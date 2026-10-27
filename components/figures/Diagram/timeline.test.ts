import { describe, expect, it } from 'vitest';

import { advance } from './timeline';

describe('advance', () => {
  it('moves the phase by the share of a period that has passed', () => {
    expect(advance(0.25, 0.05, 2)).toBeCloseTo(0.275);
  });

  it('loops back to the start once a period is over', () => {
    expect(advance(0.99, 0.05, 1)).toBeCloseTo(0.04);
  });

  it('takes one short step after a long pause, rather than leaping', () => {
    expect(advance(0, 30, 1)).toBeCloseTo(0.1);
  });
});
