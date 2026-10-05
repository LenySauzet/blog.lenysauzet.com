import { describe, expect, it } from 'vitest';

import { passDuration, walkDuration } from './use-cascade';

/**
 * Anything waiting for the rail to empty waits on this. It is bounded rather
 * than fixed: a short post keeps a brisk beat, and a long one stops costing
 * more than a long one.
 */
describe('passDuration', () => {
  it('is one fade for a rail with nothing to walk', () => {
    expect(passDuration(0)).toBeCloseTo(0.3);
    expect(passDuration(1)).toBeCloseTo(0.3);
  });

  it('grows a beat per title while the walk has room', () => {
    expect(passDuration(3)).toBeCloseTo(0.375);
    expect(passDuration(5)).toBeCloseTo(0.45);
  });

  it('stops growing past the bound, however many sections arrive', () => {
    expect(passDuration(13)).toBeCloseTo(0.52);
    expect(passDuration(25)).toBeCloseTo(0.52);
    expect(passDuration(100)).toBeCloseTo(0.52);
  });

  it('never slows the beat below what a short post gets', () => {
    expect(passDuration(25)).toBeLessThan(passDuration(13) + 0.001);
    expect(passDuration(3)).toBeLessThan(passDuration(13));
  });
});

/**
 * The veil waits on this rather than on a figure of its own: held at a named
 * 450ms against a walk that had grown to 900, it outlasted the titles by twice
 * what it was set to.
 */
describe('walkDuration', () => {
  it('is the pass without the last title\'s fade', () => {
    expect(walkDuration(13)).toBeCloseTo(passDuration(13) - 0.3);
  });

  it('is nothing to walk when there is one section or none', () => {
    expect(walkDuration(0)).toBe(0);
    expect(walkDuration(1)).toBe(0);
  });

  it('is bounded like the pass it belongs to', () => {
    expect(walkDuration(25)).toBeCloseTo(0.22);
    expect(walkDuration(100)).toBeCloseTo(0.22);
    expect(walkDuration(3)).toBeCloseTo(0.075);
  });
});
