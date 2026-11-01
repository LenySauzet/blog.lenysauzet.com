import { describe, expect, it } from 'vitest';

import { isEdge, MAX_STEPS, stepWindow } from './steps';

describe('stepWindow', () => {
  it('shows every step when they fit', () => {
    for (let count = 1; count <= MAX_STEPS; count++)
      for (let active = 0; active < count; active++) expect(stepWindow(count, active)).toEqual({ start: 0, end: count });
  });

  it('shows MAX_STEPS around the active one, always containing it, never past an end', () => {
    for (let count = MAX_STEPS + 1; count <= 20; count++)
      for (let active = 0; active < count; active++) {
        const { start, end } = stepWindow(count, active);
        expect(end - start).toBe(MAX_STEPS);
        expect(start).toBeGreaterThanOrEqual(0);
        expect(end).toBeLessThanOrEqual(count);
        expect(active).toBeGreaterThanOrEqual(start);
        expect(active).toBeLessThan(end);
      }
  });

  it('centres the active step away from the ends', () => {
    expect(stepWindow(9, 4)).toEqual({ start: 2, end: 7 });
    expect(stepWindow(9, 0)).toEqual({ start: 0, end: 5 });
    expect(stepWindow(9, 8)).toEqual({ start: 4, end: 9 });
  });
});

describe('isEdge', () => {
  it('shrinks only a window end with more beyond it, and never the active step', () => {
    for (let count = MAX_STEPS + 1; count <= 12; count++)
      for (let active = 0; active < count; active++) {
        const shown = stepWindow(count, active);
        expect(isEdge(active, count, shown)).toBe(false);
        for (let index = shown.start + 1; index < shown.end - 1; index++) expect(isEdge(index, count, shown)).toBe(false);
        expect(isEdge(shown.start, count, shown)).toBe(shown.start > 0);
        expect(isEdge(shown.end - 1, count, shown)).toBe(shown.end < count);
      }
  });

  it('shrinks nothing when every step fits', () => {
    const shown = stepWindow(4, 2);
    for (let index = 0; index < 4; index++) expect(isEdge(index, 4, shown)).toBe(false);
  });
});
