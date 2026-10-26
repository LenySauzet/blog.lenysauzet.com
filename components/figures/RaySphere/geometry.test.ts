import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';

import {
  ANGLE,
  ATMOSPHERE,
  CENTRE,
  HEIGHT,
  ORIGIN,
  WIDTH,
  raySphere,
} from './geometry';

const GLYPH = { width: 8.5, height: 17 };
const FADE = { x: WIDTH * 0.06, y: HEIGHT * 0.06 };

const box = (name: string, at: Vec2) => ({
  name,
  left: at.x - (name.length * GLYPH.width) / 2,
  right: at.x + (name.length * GLYPH.width) / 2,
  top: at.y - GLYPH.height / 2,
  bottom: at.y + GLYPH.height / 2,
});
type Box = ReturnType<typeof box>;

const corners = ({ left, right, top, bottom }: Box) => [
  vec2(left, top),
  vec2(right, top),
  vec2(left, bottom),
  vec2(right, bottom),
];

const overlap = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const crossesLine = (b: Box, from: Vec2, to: Vec2) => {
  const sides = corners(b).map(
    ({ x, y }) => Math.sign((to.x - from.x) * (y - from.y) - (to.y - from.y) * (x - from.x)),
  );
  return sides.includes(1) && sides.includes(-1);
};

const sweep = Array.from(
  { length: (ANGLE.max - ANGLE.min) * 10 + 1 },
  (_, i) => ANGLE.min + i / 10,
);

const named = (degrees: number) =>
  Object.entries(raySphere(degrees).labels).flatMap(([name, at]) =>
    at ? [box(name, at)] : [],
  );

describe('the ray against the planet', () => {
  it('lights the air from p1 to the ground when it lands', () => {
    const { lit, crossings, landings } = raySphere(0);

    expect(lit).toEqual([crossings?.[0], landings?.[0]]);
  });

  it('lights the air from p1 to p2 when it misses the ground', () => {
    const { lit, crossings, landings } = raySphere(16);

    expect(landings).toBeNull();
    expect(lit).toEqual(crossings);
  });

  it('lights nothing when it misses the atmosphere', () => {
    const { lit, labels } = raySphere(ANGLE.max);

    expect(lit).toBeNull();
    expect(labels.H).not.toBeNull();
  });

  it('stops naming H where the crossings merge into it', () => {
    const grazing = (Math.asin(ATMOSPHERE / (CENTRE.x - ORIGIN.x)) * 180) / Math.PI;

    expect(raySphere(grazing - 0.05).labels.H).toBeNull();
  });
});

describe('the names, across the whole slider', () => {
  it('never overlap each other', () => {
    for (const degrees of sweep) {
      const boxes = named(degrees);
      for (const [i, a] of boxes.entries())
        for (const b of boxes.slice(i + 1))
          expect(overlap(a, b), `${a.name} and ${b.name} at ${degrees}°`).toBe(false);
    }
  });

  it('are never crossed by the ray', () => {
    for (const degrees of sweep) {
      const { end } = raySphere(degrees);
      for (const b of named(degrees))
        expect(crossesLine(b, ORIGIN, end), `${b.name} at ${degrees}°`).toBe(false);
    }
  });

  it('stay clear of the faded edges', () => {
    for (const degrees of sweep)
      for (const b of named(degrees)) {
        expect(b.left, `${b.name} at ${degrees}°`).toBeGreaterThan(FADE.x);
        expect(b.right, `${b.name} at ${degrees}°`).toBeLessThan(WIDTH - FADE.x);
        expect(b.top, `${b.name} at ${degrees}°`).toBeGreaterThan(FADE.y);
        expect(b.bottom, `${b.name} at ${degrees}°`).toBeLessThan(HEIGHT - FADE.y);
      }
  });
});
