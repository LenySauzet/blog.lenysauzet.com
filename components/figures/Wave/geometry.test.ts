import { describe, expect, it } from 'vitest';

import { scene, type Piece } from '@/components/figures/Diagram';
import { clearOfFade, overlap, SIZES, textBox } from '@/test/figure';

import { AXES, FREQUENCY, HEIGHT, SHAPES, TURN, wave, type Shape } from './geometry';

const steps = (from: number, to: number, count: number) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);

const sweep = (Object.keys(SHAPES) as Shape[]).flatMap((shape) =>
  steps(FREQUENCY.min, FREQUENCY.max, 10).flatMap((frequency) =>
    steps(TURN.min, TURN.max, 8).map((turn) => ({ shape, frequency, turn })),
  ),
);

const drawn = (shape: Shape, frequency: number, turn: number) => {
  const { grid, camera } = wave(shape, frequency, turn);
  return scene(grid, camera, AXES);
};

const extent = (piece: Piece) => {
  switch (piece.kind) {
    case 'face':
      return piece.corners;
    case 'vertex':
      return [piece.at];
    default:
      return [piece.from, piece.to];
  }
};

describe('the wave', () => {
  it('folds away from the eye once it is steep enough', () => {
    const folds = (frequency: number) =>
      drawn('plane', frequency, 0).pieces.filter(({ kind }) => kind === 'silhouette').length;

    expect(folds(FREQUENCY.max)).toBeGreaterThan(folds(FREQUENCY.min));
  });

  it('ripples outward from the centre, the same at every distance', () => {
    const height = SHAPES.ripple(1.5);

    expect(height(0.6, 0)).toBeCloseTo(height(0, 0.6));
    expect(height(0.3, 0.4)).toBeCloseTo(height(0.5, 0));
  });

  it('stays clear of the faded edges, whatever the shape, frequency and turn', () => {
    for (const { shape, frequency, turn } of sweep)
      for (const { x, y } of drawn(shape, frequency, turn).pieces.flatMap(extent))
        expect(
          clearOfFade({ name: 'surface', left: x, right: x, top: y, bottom: y }, HEIGHT),
          `${shape} at ${frequency}, ${turn}°`,
        ).toBe(true);
  });

  it('names each axis apart from the others and clear of the fade', () => {
    for (const { shape, frequency, turn } of sweep)
      for (const size of SIZES) {
        const boxes = drawn(shape, frequency, turn).names.map(({ name, label }) =>
          textBox(name, label, size),
        );
        for (const [i, a] of boxes.entries()) {
          expect(clearOfFade(a, HEIGHT), `${a.name} at ${turn}° in ${size}`).toBe(true);
          for (const b of boxes.slice(i + 1)) expect(overlap(a, b)).toBe(false);
        }
      }
  });
});
