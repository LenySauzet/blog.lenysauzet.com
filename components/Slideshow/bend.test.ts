import { describe, expect, it } from 'vitest';

import { bendFor, MAX_BEND, slidePath } from './bend';

const numbers = (path: string) => path.match(/-?\d+(\.\d+)?/g)!.map(Number);

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
    const n = numbers(slidePath(600, 400, 0));
    expect(Math.min(...n.filter((_, i) => i % 2 === 0))).toBe(0);
    expect(Math.max(...n.filter((_, i) => i % 2 === 0))).toBe(600);
  });

  it('bows both edges alike, so a slide meets its neighbour seam to seam', () => {
    for (let bend = -MAX_BEND; bend <= MAX_BEND; bend += 0.5) {
      const n = numbers(slidePath(600, 400, bend));
      const atMiddle = Array.from({ length: n.length / 2 }, (_, i) => [n[2 * i], n[2 * i + 1]]).filter(([, y]) => y === 200);
      const [left, right] = atMiddle.map(([x]) => x).sort((a, b) => a - b);
      expect(right - 600).toBeCloseTo(bend);
      expect(left).toBeCloseTo(bend);
    }
  });

  it('keeps every corner where it is', () => {
    const n = numbers(slidePath(600, 400, MAX_BEND));
    const points = Array.from({ length: n.length / 2 }, (_, i) => `${n[2 * i]},${n[2 * i + 1]}`);
    for (const corner of ['0,0', '600,0', '600,400', '0,400']) expect(points).toContain(corner);
  });
});
