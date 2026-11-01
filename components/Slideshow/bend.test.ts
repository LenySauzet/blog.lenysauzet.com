import { describe, expect, it } from 'vitest';

import { bendFor, MAX_BEND, PARALLAX, parallaxShift, slidePath } from './bend';

const points = (path: string) => {
  const n = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return Array.from({ length: n.length / 2 }, (_, i) => [n[2 * i], n[2 * i + 1]]);
};
// A quadratic from (x0, y0) through control (cx, cy) to (x1, y1), at t.
const quadratic = (x0: number, cx: number, x1: number, t: number) => (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1;

describe('bendFor', () => {
  it('is straight at rest and follows the direction of travel', () => {
    expect(bendFor(0)).toBe(0);
    expect(bendFor(10)).toBeGreaterThan(0);
    expect(bendFor(-10)).toBeLessThan(0);
  });

  it('barely bends a slow glide and never passes MAX_BEND', () => {
    expect(Math.abs(bendFor(1))).toBeLessThan(1);
    for (let velocity = -500; velocity <= 500; velocity += 0.5) expect(Math.abs(bendFor(velocity))).toBeLessThanOrEqual(MAX_BEND);
    expect(bendFor(500)).toBeCloseTo(MAX_BEND);
  });
});

describe('slidePath', () => {
  it('is the slide itself at rest', () => {
    const xs = points(slidePath(600, 400, 0)).map(([x]) => x);
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(600);
  });

  it('bows each edge in one arc over the whole height, both alike, seam to seam', () => {
    for (let bend = -MAX_BEND; bend <= MAX_BEND; bend += 0.5) {
      const [, , [rightControl], , , [leftControl]] = points(slidePath(600, 400, bend));
      for (let t = 0; t <= 1; t += 0.05) {
        const right = quadratic(600, rightControl, 600, t) - 600;
        const left = quadratic(0, leftControl, 0, t);
        expect(right).toBeCloseTo(left);
        // An arc: bent everywhere between the corners, most at the middle.
        expect(Math.abs(left)).toBeLessThanOrEqual(Math.abs(bend) + 1e-9);
        if (bend !== 0 && t > 0.01 && t < 0.99) expect(Math.sign(left)).toBe(Math.sign(bend));
      }
      expect(quadratic(0, leftControl, 0, 0.5)).toBeCloseTo(bend);
    }
  });

  it('keeps every corner where it is', () => {
    const corners = points(slidePath(600, 400, MAX_BEND)).map(([x, y]) => `${x},${y}`);
    for (const corner of ['0,0', '600,0', '600,400', '0,400']) expect(corners).toContain(corner);
  });
});

describe('parallaxShift', () => {
  it('leaves the image in place at the middle and lags it either side', () => {
    expect(parallaxShift(0, 600)).toBeCloseTo(0);
    expect(parallaxShift(1, 600)).toBeCloseTo(-PARALLAX * 600);
    expect(parallaxShift(-1, 600)).toBeCloseTo(PARALLAX * 600);
  });

  it('opens a gap only on the side out of view, so the image needs no bleed for it', () => {
    for (let distance = -1; distance <= 1; distance += 0.01) {
      const shift = parallaxShift(distance, 600);
      // A slide `distance` from the middle hides |distance| of its width past the view,
      // on the side the image pulls away from.
      expect(Math.abs(shift)).toBeLessThanOrEqual(Math.abs(distance) * 600 + 1e-9);
      if (distance !== 0) expect(Math.sign(shift)).toBe(-Math.sign(distance));
    }
  });

  it('holds still once a slide is out of view', () => {
    expect(parallaxShift(3, 600)).toBe(parallaxShift(1, 600));
    expect(parallaxShift(-3, 600)).toBe(parallaxShift(-1, 600));
  });
});
