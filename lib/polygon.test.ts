import { describe, expect, it } from 'vitest';

import { area, clip, rectangle } from './polygon';
import { normalize, vec2 } from './vec2';

const SQUARE = rectangle(vec2(0, 0), 10, 10);

describe('area', () => {
  it('measures a rectangle whichever way it winds', () => {
    expect(area(SQUARE)).toBe(100);
    expect(area(SQUARE.toReversed())).toBe(100);
  });
});

describe('clip', () => {
  it('keeps the whole polygon when it lies inside the half-plane', () => {
    expect(area(clip(SQUARE, { through: vec2(-5, 0), normal: vec2(1, 0) }))).toBe(100);
  });

  it('keeps nothing when it lies outside', () => {
    expect(clip(SQUARE, { through: vec2(20, 0), normal: vec2(1, 0) })).toEqual([]);
  });

  it('cuts along the edge it is given', () => {
    expect(area(clip(SQUARE, { through: vec2(3, 0), normal: vec2(1, 0) }))).toBeCloseTo(70);
  });

  it('cuts a square in half along its diagonal', () => {
    const diagonal = { through: vec2(0, 0), normal: normalize(vec2(1, -1)) };

    expect(area(clip(SQUARE, diagonal))).toBeCloseTo(50);
  });

  it('splits a polygon into two parts that add back up to it', () => {
    const plane = { through: vec2(4, 2), normal: normalize(vec2(2, 3)) };
    const flipped = { ...plane, normal: vec2(-plane.normal.x, -plane.normal.y) };

    expect(area(clip(SQUARE, plane)) + area(clip(SQUARE, flipped))).toBeCloseTo(100);
  });
});
