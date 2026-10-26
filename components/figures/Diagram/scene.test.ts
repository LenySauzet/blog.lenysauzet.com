import { describe, expect, it } from 'vitest';

import { heightfield } from '@/lib/mesh';
import { length, sub, vec2 } from '@/lib/vec2';
import { ISOMETRIC, vec3 } from '@/lib/vec3';

import { paintOrder, scene, type Piece } from './scene';

const CAMERA = { ...ISOMETRIC, scale: 100, origin: vec2(200, 200) };
const GRID = heightfield((x) => 0.3 * Math.sin(3 * x), 1, [9, 9]);
const AXES = [
  { name: 'x', tip: vec3(1.4, 0, 0) },
  { name: 'z', tip: vec3(0, 0, 1.4) },
];
const { pieces, names } = scene(GRID, CAMERA, AXES);

const vertex = (id: string, depth: number): Piece => ({ id, kind: 'vertex', at: vec2(0, 0), depth });

describe('paintOrder', () => {
  it('paints the farther piece first', () => {
    expect(paintOrder(vertex('a', 0.4), vertex('b', 0.5))).toBeLessThan(0);
  });

  it('breaks a tie the same way on the server and in the browser, whose floats differ in the last digits', () => {
    expect(paintOrder(vertex('b', 0.5), vertex('a', 0.5 + 1e-12))).toBeGreaterThan(0);
    expect(paintOrder(vertex('b', 0.5 + 1e-12), vertex('a', 0.5))).toBeGreaterThan(0);
  });
});

describe('scene', () => {
  it('is painted from the back forward', () => {
    expect(pieces).toEqual(pieces.toSorted(paintOrder));
  });

  it('names every piece uniquely, so a re-sort moves pieces rather than rebuilding them', () => {
    const ids = pieces.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks every vertex of the grid', () => {
    expect(pieces.filter(({ kind }) => kind === 'vertex')).toHaveLength(81);
  });

  it('runs each axis out both ways, an arrow at either end pointing away from the origin', () => {
    const origin = vec2(200, 200);
    const arrows = pieces.filter((piece) => piece.kind === 'arrow');

    expect(arrows).toHaveLength(2 * AXES.length);
    for (const arrow of arrows)
      if (arrow.kind === 'arrow')
        expect(length(sub(arrow.to, origin))).toBeGreaterThan(length(sub(arrow.from, origin)));
  });

  it('passes the axes under the surface where it lies in front of them', () => {
    const order = pieces.map(({ kind }) => kind);
    const between = order
      .slice(order.indexOf('face'), order.lastIndexOf('face'))
      .filter((kind) => kind === 'axis');

    expect(between.length).toBeGreaterThan(0);
  });

  it('names each axis at its positive end', () => {
    expect(names.map(({ name }) => name)).toEqual(['x', 'z']);
  });
});
