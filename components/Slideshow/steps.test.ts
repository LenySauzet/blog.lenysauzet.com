import { describe, expect, it } from 'vitest';

import { isEdge, isNear, MAX_STEPS, stepTarget, stepWindow } from './steps';

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

describe('stepTarget', () => {
  it('holds a move at the ends when the slideshow does not loop', () => {
    expect(stepTarget(-1, 4, false)).toBe(0);
    expect(stepTarget(4, 4, false)).toBe(3);
    for (let index = 0; index < 4; index++) expect(stepTarget(index, 4, false)).toBe(index);
  });

  it('goes round the ends when it loops', () => {
    expect(stepTarget(-1, 4, true)).toBe(3);
    expect(stepTarget(4, 4, true)).toBe(0);
    expect(stepTarget(-5, 4, true)).toBe(3);
  });
});

describe('isNear', () => {
  it('marks the selected slide and its neighbours', () => {
    expect([0, 1, 2, 3, 4].map((index) => isNear(index, 2, 5, false))).toEqual([false, true, true, true, false]);
  });

  it('counts round the ends only when it loops', () => {
    expect(isNear(4, 0, 5, true)).toBe(true);
    expect(isNear(4, 0, 5, false)).toBe(false);
    expect(isNear(2, 0, 5, true)).toBe(false);
  });
});
