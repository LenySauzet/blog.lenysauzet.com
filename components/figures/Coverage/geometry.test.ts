import { describe, expect, it } from 'vitest';

import { area } from '@/lib/polygon';
import { clearOfFade, SIZES, textBox } from '@/test/figure';

import { ANGLE, CELL, coverage, HEIGHT, LENS, SWATCH } from './geometry';

const sweep = Array.from(
  { length: (ANGLE.max - ANGLE.min) * 10 + 1 },
  (_, i) => ANGLE.min + i / 10,
);

describe('coverage', () => {
  it('fills a pixel by the share of it the shape covers, never more or less', () => {
    for (const degrees of sweep)
      for (const { share } of coverage(degrees).cells) {
        expect(share).toBeGreaterThanOrEqual(0);
        expect(share).toBeLessThanOrEqual(1 + 1e-9);
      }
  });

  it('loses no area between the pixels', () => {
    const covered = (degrees: number) =>
      coverage(degrees).cells.reduce((sum, { share }) => sum + share, 0);

    for (const degrees of sweep) {
      expect(covered(degrees) + covered(degrees + 180)).toBeCloseTo(
        coverage(degrees).cells.length,
      );
    }
  });

  it('draws the edge from one side of the grid to the other', () => {
    for (const degrees of sweep) expect(coverage(degrees).edge).toHaveLength(2);
  });

  it('hatches exactly the share the swatch reports', () => {
    for (const degrees of sweep) {
      const { focus } = coverage(degrees);
      expect(area(focus.covered) / CELL ** 2).toBeCloseTo(focus.share);
    }
  });
});

describe('the frame', () => {
  it('holds the loupe and the swatch clear of the faded edges', () => {
    const loupe = {
      name: 'loupe',
      left: LENS.at.x - LENS.r,
      right: LENS.at.x + LENS.r,
      top: LENS.at.y - LENS.r,
      bottom: LENS.at.y + LENS.r,
    };
    const xs = SWATCH.map(({ x }) => x);
    const ys = SWATCH.map(({ y }) => y);
    const swatch = {
      name: 'swatch',
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    };

    expect(clearOfFade(loupe, HEIGHT)).toBe(true);
    expect(clearOfFade(swatch, HEIGHT)).toBe(true);
  });

  it('never lays the loupe over the grid it magnifies', () => {
    const gridRight = Math.max(...coverage(0).cells.flatMap(({ corners }) => corners.map(({ x }) => x)));

    expect(LENS.at.x - LENS.r).toBeGreaterThan(gridRight);
  });

  it('keeps the readout clear of the faded edges at every type size', () => {
    for (const size of SIZES)
      expect(clearOfFade(textBox('100%', coverage(0).readout, size), HEIGHT)).toBe(true);
  });
});
