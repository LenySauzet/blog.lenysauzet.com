import { describe, expect, it } from 'vitest';

import { afterRegion, dividerPath, labelOpacity, MAX_PULL, pullFor } from './divider';

const points = (path: string) => path.match(/-?\d+(\.\d+)?/g)!.map(Number);
const ends = (path: string) => {
  const n = points(path);
  return { top: n[0], middle: n[6], bottom: n.at(-2)! };
};

describe('dividerPath', () => {
  it('is a straight line through the centre at rest', () => {
    expect(ends(dividerPath(300, 0, 600, 400))).toEqual({ top: 300, middle: 300, bottom: 300 });
  });

  it('bows its ends behind its middle, never past MAX_PULL', () => {
    for (let pull = -40; pull <= 40; pull += 0.5) {
      const { top, middle, bottom } = ends(dividerPath(300, pull, 600, 400));
      expect(middle).toBe(300);
      expect(top).toBe(bottom);
      expect(Math.abs(middle - top)).toBeLessThanOrEqual(MAX_PULL);
      expect(Math.sign(middle - top)).toBe(Math.sign(pull));
    }
  });

  it('keeps its ends inside the image at either edge', () => {
    for (let center = 0; center <= 600; center += 1)
      for (const pull of [-MAX_PULL, MAX_PULL]) {
        const { top } = ends(dividerPath(center, pull, 600, 400));
        expect(top).toBeGreaterThanOrEqual(0);
        expect(top).toBeLessThanOrEqual(600);
      }
  });
});

describe('afterRegion', () => {
  it('closes the divider along the right edge', () => {
    expect(afterRegion('M 1 0', 600, 400)).toBe('M 1 0 L 600 400 L 600 0 Z');
  });
});

describe('pullFor', () => {
  it('is still at no speed, saturates fast, and follows the direction', () => {
    expect(pullFor(0, 100)).toBe(0);
    expect(pullFor(50, 100)).toBeCloseTo(MAX_PULL);
    expect(pullFor(-50, 100)).toBeCloseTo(-MAX_PULL);
  });

  it('barely flexes on a slow drag', () => {
    expect(pullFor(0.1, 100)).toBeGreaterThan(0);
    expect(pullFor(0.1, 100)).toBeLessThan(1);
  });

  it('grows with the distance dragged, up to 48px', () => {
    expect(Math.abs(pullFor(50, 12))).toBeCloseTo(MAX_PULL / 4);
    expect(pullFor(50, 48)).toBeCloseTo(pullFor(50, 480));
  });
});

describe('labelOpacity', () => {
  const label = { center: 40, half: 24 };

  it('fades the before label out as the divider comes left onto it', () => {
    expect(labelOpacity('before', 600, label)).toBe(1);
    expect(labelOpacity('before', 40 + 40, label)).toBe(1);
    expect(labelOpacity('before', 40 + 20, label)).toBeCloseTo(0.5);
    expect(labelOpacity('before', 40, label)).toBe(0);
    expect(labelOpacity('before', 0, label)).toBe(0);
  });

  it('fades the after label out as the divider comes right onto it', () => {
    const after = { center: 560, half: 20 };
    expect(labelOpacity('after', 0, after)).toBe(1);
    expect(labelOpacity('after', 560 - 18, after)).toBeCloseTo(0.5);
    expect(labelOpacity('after', 560, after)).toBe(0);
  });

  it('never leaves [0, 1] across the whole travel', () => {
    for (let x = -50; x <= 650; x += 0.5) {
      const opacity = labelOpacity('before', x, label);
      expect(opacity).toBeGreaterThanOrEqual(0);
      expect(opacity).toBeLessThanOrEqual(1);
    }
  });
});
