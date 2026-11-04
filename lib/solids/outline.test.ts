import { describe, expect, it } from 'vitest';

import { hull, signedArea } from '@/lib/polygon';
import { vec2, type Vec2 } from '@/lib/vec2';

import { circle, cornersOf, distinct, inset, rounded } from './outline';

const PLAN = { x: -10, z: -5, width: 40, depth: 20, radius: 4 };

const repeats = (ring: Vec2[]) =>
  ring.filter((point, index) => {
    const before = ring[(index + ring.length - 1) % ring.length];
    return point.x === before.x && point.y === before.y;
  }).length;

describe('a floor outline', () => {
  it('turns one way round, every corner point on its corner’s circle', () => {
    const ring = rounded(PLAN, 6);
    expect(ring).toHaveLength(4 * 7);
    expect(signedArea(ring)).toBeGreaterThan(0);
    const centre = vec2(PLAN.x + PLAN.width - PLAN.radius, PLAN.z + PLAN.radius);
    for (const { x, y } of ring.slice(0, 7)) {
      expect(Math.hypot(x - centre.x, y - centre.y)).toBeCloseTo(PLAN.radius, 9);
    }
  });

  it('keeps four sharp corners when it has no radius', () => {
    expect(rounded({ ...PLAN, radius: 0 })).toEqual([vec2(30, -5), vec2(30, 15), vec2(-10, 15), vec2(-10, -5)]);
  });

  // At half a side two corners meet; a point they share would be an edge of no length.
  it('never repeats a point where two corners meet', () => {
    const pill = rounded({ ...PLAN, radius: 10 }, 6);
    expect(repeats(pill)).toBe(0);
    expect(pill).toHaveLength(4 * 7 - 2);
  });

  it('stays inside its plan however large or small the radius asked', () => {
    for (const radius of [-3, 99, 12]) {
      const ring = rounded({ ...PLAN, radius }, 4);
      expect(signedArea(ring)).toBeCloseTo(signedArea(hull(ring)), 9);
      for (const { x, y } of ring) {
        expect(x).toBeGreaterThanOrEqual(PLAN.x - 1e-9);
        expect(x).toBeLessThanOrEqual(PLAN.x + PLAN.width + 1e-9);
        expect(y).toBeGreaterThanOrEqual(PLAN.z - 1e-9);
        expect(y).toBeLessThanOrEqual(PLAN.z + PLAN.depth + 1e-9);
      }
    }
    expect(rounded({ ...PLAN, radius: -3 })).toEqual(rounded({ ...PLAN, radius: 0 }));
  });

  it('shrinks by the same amount on every side, and its radius with it', () => {
    expect(inset(PLAN, 2)).toEqual({ x: -8, z: -3, width: 36, depth: 16, radius: 2 });
    expect(inset(PLAN, 6).radius).toBe(0);
  });

  it('drops a point repeating the one before it, by a hair or exactly, the first included', () => {
    const square = [vec2(0, 0), vec2(10, 0), vec2(10, 1e-12), vec2(10, 10), vec2(0, 10), vec2(0, 0)];
    expect(distinct(square)).toEqual([vec2(10, 0), vec2(10, 10), vec2(0, 10), vec2(0, 0)]);
  });

  it('refuses a corner or a circle of too few steps', () => {
    expect(() => rounded(PLAN, 0)).toThrow(/step/);
    expect(() => circle(vec2(0, 0), 1, 2)).toThrow(/steps/);
  });

  it('marks its corners and its circle where asked', () => {
    expect(cornersOf(PLAN, 3)).toEqual([vec2(-7, -2), vec2(27, -2), vec2(27, 12), vec2(-7, 12)]);
    expect(circle(vec2(1, 1), 2, 4)[1].y).toBeCloseTo(3, 9);
  });
});
