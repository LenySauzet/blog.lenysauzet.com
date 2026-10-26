import { describe, expect, it } from 'vitest';

import { fromAngle, length, normalize, scale, vec2 } from './vec2';

describe('vec2', () => {
  it('normalises to unit length', () => {
    expect(length(normalize(vec2(3, 4)))).toBeCloseTo(1);
  });

  it('leaves a zero vector alone rather than dividing by its length', () => {
    expect(normalize(vec2(0, 0))).toEqual(vec2(0, 0));
  });

  it('scales a length without turning it', () => {
    expect(length(scale(normalize(vec2(3, 4)), 10))).toBeCloseTo(10);
  });

  it('turns clockwise on screen, which is where SVG puts positive y', () => {
    const quarter = fromAngle(Math.PI / 2);

    expect(quarter.x).toBeCloseTo(0);
    expect(quarter.y).toBeCloseTo(1);
  });
});
