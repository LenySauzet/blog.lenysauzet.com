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

  it('is a consistent order whatever order the pieces arrive in', () => {
    const pieces = [vertex('c', 0), vertex('b', 0.4e-6), vertex('a', 0.8e-6)];
    const sorted = pieces.toSorted(paintOrder).map(({ id }) => id);

    expect(pieces.toReversed().toSorted(paintOrder).map(({ id }) => id)).toEqual(sorted);
    expect([pieces[1], pieces[2], pieces[0]].toSorted(paintOrder).map(({ id }) => id)).toEqual(sorted);
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

  it('paints every vertex over the faces and silhouettes that meet at it', () => {
    const where = (piece: Piece) => pieces.indexOf(piece);
    const touches = (piece: Piece, at: { x: number; y: number }) => {
      const same = (p: { x: number; y: number }) => p.x === at.x && p.y === at.y;
      if (piece.kind === 'face') return piece.corners.some(same);
      if (piece.kind === 'silhouette') return same(piece.from) || same(piece.to);
      return false;
    };

    for (const vertex of pieces)
      if (vertex.kind === 'vertex')
        for (const piece of pieces)
          if (touches(piece, vertex.at)) expect(where(vertex)).toBeGreaterThan(where(piece));
  });

  it('paints a silhouette over the faces on either side of it', () => {
    const where = (piece: Piece) => pieces.indexOf(piece);

    for (const line of pieces)
      if (line.kind === 'silhouette')
        for (const face of pieces)
          if (
            face.kind === 'face' &&
            [line.from, line.to].every((end) =>
              face.corners.some(({ x, y }) => x === end.x && y === end.y),
            )
          )
            expect(where(line)).toBeGreaterThan(where(face));
  });

  it('still lets a fold in front fade the vertices behind it', () => {
    const fold = scene(heightfield((x) => 0.6 * Math.sin(4 * x), 1, [9, 9]), CAMERA).pieces;
    const lastVertex = fold.findLastIndex(({ kind }) => kind === 'vertex');
    const firstFace = fold.findIndex(({ kind }) => kind === 'face');

    expect(fold.slice(firstFace, lastVertex).some(({ kind }) => kind === 'vertex')).toBe(true);
    expect(
      fold.slice(fold.findIndex(({ kind }) => kind === 'vertex')).some(({ kind }) => kind === 'face'),
    ).toBe(true);
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
