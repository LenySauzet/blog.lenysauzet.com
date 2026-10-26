import { describe, expect, it } from 'vitest';

import { faces, heightfield, silhouette } from './mesh';
import { vec3 } from './vec3';

const ABOVE = vec3(0, 1, 0);
const FLAT = heightfield(() => 0, 1, [5, 5]);

describe('heightfield', () => {
  it('samples a square of points across the extent it is given', () => {
    expect(FLAT).toHaveLength(5);
    expect(FLAT[0][0]).toEqual(vec3(-1, 0, -1));
    expect(FLAT[4][4]).toEqual(vec3(1, 0, 1));
  });

  it('lifts each point by the height at it', () => {
    expect(heightfield((x, z) => x + z, 1, [3, 3])[2][2].y).toBe(2);
  });

  it('samples columns and rows independently, for a surface that only varies one way', () => {
    const strip = heightfield(() => 0, 1, [7, 3]);

    expect(strip).toHaveLength(3);
    expect(strip[0]).toHaveLength(7);
  });
});

describe('faces', () => {
  it('face up on a flat ground', () => {
    for (const face of faces(FLAT).flat()) expect(face.normal).toEqual(vec3(0, 1, 0));
  });
});

describe('silhouette', () => {
  it('is only the border of a flat ground', () => {
    expect(silhouette(FLAT, ABOVE)).toHaveLength(4 * 4);
    expect(silhouette(heightfield(() => 0, 1, [7, 3]), ABOVE)).toHaveLength(2 * 6 + 2 * 2);
  });

  it('adds a line where the surface turns away from the viewer', () => {
    const fold = heightfield((x) => -Math.abs(x) * 3, 1, [5, 5]);
    const grazing = vec3(1, 0.2, 0);

    expect(silhouette(fold, grazing).length).toBeGreaterThan(4 * 4);
  });

  it('never lists an edge twice', () => {
    const wave = heightfield((x) => Math.sin(x * 6), 1, [9, 9]);
    const key = ([a, b]: readonly [{ x: number; z: number }, { x: number; z: number }]) =>
      [a, b].map(({ x, z }) => `${x},${z}`).sort().join('|');
    const edges = silhouette(wave, vec3(1, 0.3, 0)).map(key);

    expect(new Set(edges).size).toBe(edges.length);
  });
});
