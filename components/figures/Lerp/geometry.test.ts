import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';
import { clearOfFade, crossesLine, overlap, SIZES, textBox } from '@/test/figure';

import { HEIGHT, INITIAL, interpolation, progress, READOUT } from './geometry';

const readout = (size: number) =>
  textBox('t = 0.00', { at: READOUT, offset: vec2(0, 0) }, size, 'end');

describe('the interpolation', () => {
  it('starts at P0 and ends at P1', () => {
    const start = interpolation(0);
    const end = interpolation(0.99);

    expect(start.point).toEqual(start.from);
    expect(end.point).toEqual(end.to);
  });

  it('holds at P1 for the end of each loop, so the arrival can be seen', () => {
    expect(progress(0.5)).toBeLessThan(1);
    expect(progress(0.85)).toBe(1);
    expect(progress(0.99)).toBe(1);
  });

  it('rests where the reader would want to read it', () => {
    expect(interpolation(INITIAL).t).toBeCloseTo(0.73);
  });

  it('names both ends and reads t clear of each other and of the fade, at every type size', () => {
    for (const size of SIZES) {
      const { labels, from, to } = interpolation(INITIAL);
      const boxes = [
        ...Object.entries(labels).map(([name, placement]) => textBox(name, placement, size)),
        readout(size),
      ];

      for (const [i, a] of boxes.entries()) {
        expect(clearOfFade(a, HEIGHT), `${a.name} in ${size}`).toBe(true);
        expect(crossesLine(a, from, to), `${a.name} in ${size}`).toBe(false);
        for (const b of boxes.slice(i + 1)) expect(overlap(a, b)).toBe(false);
      }
    }
  });
});
