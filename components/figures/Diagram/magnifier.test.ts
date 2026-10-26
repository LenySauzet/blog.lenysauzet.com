import { describe, expect, it } from 'vitest';

import { dot, length, sub, vec2 } from '@/lib/vec2';
import { side } from '@/test/figure';

import { tangents } from './magnifier';

const NEAR = { at: vec2(0, 0), r: 10 };
const FAR = { at: vec2(100, 30), r: 40 };

describe('tangents', () => {
  it('touches both circles, on their edges', () => {
    for (const [onNear, onFar] of tangents(NEAR, FAR)) {
      expect(length(sub(onNear, NEAR.at))).toBeCloseTo(NEAR.r);
      expect(length(sub(onFar, FAR.at))).toBeCloseTo(FAR.r);
    }
  });

  it('grazes each circle rather than cutting into it', () => {
    for (const [onNear, onFar] of tangents(NEAR, FAR)) {
      const line = sub(onFar, onNear);

      expect(dot(line, sub(onNear, NEAR.at))).toBeCloseTo(0);
      expect(dot(line, sub(onFar, FAR.at))).toBeCloseTo(0);
    }
  });

  it('runs one line along each side, never crossing between them', () => {
    const [[a, b], [c, d]] = tangents(NEAR, FAR);
    const of = (point: typeof a) => side(NEAR.at, FAR.at, point);

    expect(of(a)).toBe(of(b));
    expect(of(c)).toBe(of(d));
    expect(of(a)).not.toBe(of(c));
  });
});
