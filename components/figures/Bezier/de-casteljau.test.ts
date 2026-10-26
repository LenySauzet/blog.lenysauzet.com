import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';

import { deCasteljau } from './de-casteljau';

const CUBIC = [vec2(0, 0), vec2(0, 10), vec2(10, 10), vec2(10, 0)];
const pointAt = (t: number) => deCasteljau(CUBIC, t).at(-1)?.[0];

describe('deCasteljau', () => {
  it('takes one point away at every pass, down to the one on the curve', () => {
    expect(deCasteljau(CUBIC, 0.3).map((level) => level.length)).toEqual([4, 3, 2, 1]);
  });

  it('starts on the first control point and ends on the last', () => {
    expect(pointAt(0)).toEqual(CUBIC[0]);
    expect(pointAt(1)).toEqual(CUBIC[3]);
  });

  it('lands halfway along a symmetric curve at its apex', () => {
    expect(pointAt(0.5)).toEqual(vec2(5, 7.5));
  });

  it('splits the curve into two that retrace it exactly', () => {
    const t = 0.4;
    const [control, first, second, [split]] = deCasteljau(CUBIC, t);
    const before = [control[0], first[0], second[0], split];
    const after = [split, second[1], first[2], control[3]];

    for (const s of [0.25, 0.5, 0.75]) {
      expect(deCasteljau(before, s).at(-1)?.[0].x).toBeCloseTo(pointAt(s * t)?.x ?? NaN);
      expect(deCasteljau(after, s).at(-1)?.[0].y).toBeCloseTo(pointAt(t + s * (1 - t))?.y ?? NaN);
    }
  });
});
