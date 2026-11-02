import { describe, expect, it } from 'vitest';

import { afterRegion, dividerPath, labelOpacity, MAX_PULL, pullFor } from './divider';

const points = (path: string) => path.match(/-?\d+(\.\d+)?/g)!.map(Number);
// The divider is one quadratic, top to bottom; `at` is where it crosses height t.
const ends = (path: string) => {
  const [top, , control, , bottom] = points(path);
  const at = (t: number) => (1 - t) ** 2 * top + 2 * (1 - t) * t * control + t ** 2 * bottom;
  return { top, middle: at(0.5), bottom, at };
};

describe('dividerPath', () => {
  it('is a straight line through the centre at rest', () => {
    const { top, middle, bottom } = ends(dividerPath(300, 0, 600, 400));
    expect([top, middle, bottom]).toEqual([300, 300, 300]);
  });

  it('bows its ends behind its middle, never past MAX_PULL', () => {
    for (let pull = -40; pull <= 40; pull += 0.5) {
      const { top, middle, bottom } = ends(dividerPath(300, pull, 600, 400));
      expect(middle).toBeCloseTo(300);
      expect(top).toBe(bottom);
      expect(Math.abs(middle - top)).toBeLessThanOrEqual(MAX_PULL + 1e-9);
      if (pull !== 0) expect(Math.sign(middle - top)).toBe(Math.sign(pull));
    }
  });

  it('bows in one arc over the whole height, most at the middle', () => {
    const { top, at } = ends(dividerPath(300, MAX_PULL, 600, 400));
    for (let t = 0.05; t < 1; t += 0.05) {
      expect(at(t)).toBeGreaterThan(top);
      expect(at(t)).toBeLessThanOrEqual(at(0.5) + 1e-9);
    }
  });

  it('never leaves the image, whatever the pull and wherever the divider', () => {
    for (let center = 0; center <= 600; center += 2)
      for (const pull of [-MAX_PULL, MAX_PULL]) {
        const { at } = ends(dividerPath(center, pull, 600, 400));
        for (let t = 0; t <= 1; t += 0.1) {
          expect(at(t)).toBeGreaterThanOrEqual(-1e-9);
          expect(at(t)).toBeLessThanOrEqual(600 + 1e-9);
        }
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
    expect(pullFor(0, 1200)).toBe(0);
    expect(pullFor(5000, 1200)).toBeCloseTo(MAX_PULL);
    expect(pullFor(-5000, 1200)).toBeCloseTo(-MAX_PULL);
  });

  it('reads a speed in percent a second across the surface', () => {
    expect(pullFor(100, 1200)).toBeCloseTo(MAX_PULL * Math.tanh(1));
    expect(pullFor(100, 600)).toBeCloseTo(MAX_PULL * Math.tanh(0.5));
  });

  it('barely flexes when slow', () => {
    expect(pullFor(10, 1200)).toBeGreaterThan(0);
    expect(pullFor(10, 1200)).toBeLessThan(1);
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
