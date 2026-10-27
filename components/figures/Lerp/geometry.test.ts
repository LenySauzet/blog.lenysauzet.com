import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';
import { clearOfFade, covers, crossesLine, overlap, SIZES, textBox } from '@/test/figure';

import { HEIGHT, INITIAL, interpolation, progress, READOUT } from './geometry';

const POINT = 6;

const readout = (size: number) =>
  textBox('t = 0.00', { at: READOUT, offset: vec2(0, 0) }, size, 'end');

describe('the interpolation', () => {
  it('goes from P0 to P1 and back, without pausing at either end', () => {
    const { from, to } = interpolation(0);

    expect(interpolation(0).point).toEqual(from);
    expect(interpolation(0.5).point).toEqual(to);
    expect(progress(0.25)).toBeCloseTo(0.5);
    expect(progress(0.75)).toBeCloseTo(0.5);
    expect(progress(0.999)).toBeCloseTo(0, 2);
  });

  it('rests where the reader would want to read it', () => {
    expect(interpolation(INITIAL).t).toBeCloseTo(0.73);
  });

  it('names both ends and reads t clear of each other, of the line, of the moving point and of the fade, at every type size and every moment', () => {
    const phases = Array.from({ length: 51 }, (_, i) => i / 50);

    for (const size of SIZES)
      for (const phase of phases) {
        const { labels, from, to, point } = interpolation(phase);
        const boxes = [
          ...Object.entries(labels).map(([name, placement]) => textBox(name, placement, size)),
          readout(size),
        ];

        for (const [i, a] of boxes.entries()) {
          const at = `${a.name} at ${phase} in ${size}`;
          expect(clearOfFade(a, HEIGHT), at).toBe(true);
          expect(crossesLine(a, from, to), at).toBe(false);
          expect(covers(a, point, POINT), at).toBe(false);
          for (const b of boxes.slice(i + 1)) expect(overlap(a, b), at).toBe(false);
        }
      }
  });
});
