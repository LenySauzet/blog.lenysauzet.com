import { describe, expect, it } from 'vitest';

import { scene, type Piece } from '@/components/figures/Diagram';
import { clearOfFade, overlap, SIZES, textBox } from '@/test/figure';

import { AXES, FREQUENCY, HEIGHT, ripple, TURN, wave } from './geometry';

const steps = (from: number, to: number, count: number) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);

const drawn = (frequency: number, turn: number) => {
  const { grid, camera } = wave(frequency, turn);
  return scene(grid, camera, AXES);
};

const sweep = steps(FREQUENCY.min, FREQUENCY.max, 10).flatMap((frequency) =>
  steps(TURN.min, TURN.max, 8).map((turn) => ({
    at: `at ${frequency}, ${turn}°`,
    ...drawn(frequency, turn),
  })),
);

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
      drawn(frequency, 0).pieces.filter(({ kind }) => kind === 'silhouette').length;

    expect(folds(FREQUENCY.max)).toBeGreaterThan(folds(FREQUENCY.min));
  });

  it('ripples outward from the centre, the same at every distance', () => {
    const height = ripple(1.5);

    expect(height(0.6, 0)).toBeCloseTo(height(0, 0.6));
    expect(height(0.3, 0.4)).toBeCloseTo(height(0.5, 0));
  });

  it('stays clear of the faded edges, whatever the frequency and turn', () => {
    for (const { at, pieces } of sweep) {
      const points = pieces.flatMap(extent);
      const xs = points.map(({ x }) => x);
      const ys = points.map(({ y }) => y);
      const bounds = {
        name: 'surface',
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys),
      };

      expect(clearOfFade(bounds, HEIGHT), at).toBe(true);
    }
  });

  it('names each axis apart from the others and clear of the fade', () => {
    for (const { at, names } of sweep)
      for (const size of SIZES) {
        const boxes = names.map(({ name, label }) => textBox(name, label, size));
        for (const [i, a] of boxes.entries()) {
          expect(clearOfFade(a, HEIGHT), `${a.name} ${at} in ${size}`).toBe(true);
          for (const b of boxes.slice(i + 1)) expect(overlap(a, b)).toBe(false);
        }
      }
  });
});
