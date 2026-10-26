import { describe, expect, it } from 'vitest';

import { clearOfFade, crossesLine, overlap, SIZES, textBox } from '@/test/figure';

import {
  ANGLE,
  ATMOSPHERE,
  CENTRE,
  HEIGHT,
  ORIGIN,
  raySphere,
} from './geometry';

const sweep = SIZES.flatMap((size) =>
  Array.from({ length: (ANGLE.max - ANGLE.min) * 10 + 1 }, (_, i) => ({
    size,
    degrees: ANGLE.min + i / 10,
  })),
);

const named = (degrees: number, size: number) =>
  Object.entries(raySphere(degrees).labels).flatMap(([name, placement]) =>
    placement ? [textBox(name, placement, size)] : [],
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
    for (const { degrees, size } of sweep) {
      const boxes = named(degrees, size);
      for (const [i, a] of boxes.entries())
        for (const b of boxes.slice(i + 1))
          expect(overlap(a, b), `${a.name} and ${b.name} at ${degrees}° in ${size}`).toBe(false);
    }
  });

  it('are never crossed by the ray', () => {
    for (const { degrees, size } of sweep) {
      const { end } = raySphere(degrees);
      for (const b of named(degrees, size))
        expect(crossesLine(b, ORIGIN, end), `${b.name} at ${degrees}° in ${size}`).toBe(false);
    }
  });

  it('stay clear of the faded edges', () => {
    for (const { degrees, size } of sweep)
      for (const b of named(degrees, size))
        expect(clearOfFade(b, HEIGHT), `${b.name} at ${degrees}° in ${size}`).toBe(true);
  });
});
