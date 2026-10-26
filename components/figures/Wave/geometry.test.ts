import { describe, expect, it } from 'vitest';

import { clearOfFade, overlap, SIZES, textBox } from '@/test/figure';

import { FREQUENCY, HEIGHT, TURN, wave, type Piece } from './geometry';

const steps = (from: number, to: number, count: number) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);

const sweep = steps(FREQUENCY.min, FREQUENCY.max, 10).flatMap((frequency) =>
  steps(TURN.min, TURN.max, 8).map((turn) => ({ frequency, turn })),
);

const extent = (piece: Piece) => {
  switch (piece.kind) {
    case 'tile':
      return piece.corners;
    case 'vertex':
      return [piece.at];
    default:
      return [piece.from, piece.to];
  }
};

const points = (frequency: number, turn: number) =>
  wave(frequency, turn).pieces.flatMap(extent);

describe('the surface', () => {
  it('is painted from the back forward, so nearer faces cover farther ones', () => {
    for (const { frequency, turn } of sweep) {
      const depths = wave(frequency, turn).pieces.map(({ depth }) => depth);
      expect(depths).toEqual(depths.toSorted((a, b) => a - b));
    }
  });

  it('shades every face within the range a fill can take', () => {
    for (const { frequency, turn } of sweep)
      for (const piece of wave(frequency, turn).pieces)
        if (piece.kind === 'tile') {
          expect(piece.shade).toBeGreaterThan(0);
          expect(piece.shade).toBeLessThanOrEqual(1);
        }
  });

  it('draws a silhouette inside the border once the wave is steep enough to fold away', () => {
    const edges = (frequency: number) =>
      wave(frequency, 0).pieces.filter(({ kind }) => kind === 'edge').length;

    expect(edges(FREQUENCY.max)).toBeGreaterThan(edges(FREQUENCY.min));
  });

  it('stays clear of the faded edges at every frequency and turn', () => {
    for (const { frequency, turn } of sweep)
      for (const { x, y } of points(frequency, turn))
        expect(
          clearOfFade({ name: 'surface', left: x, right: x, top: y, bottom: y }, HEIGHT),
          `at ${frequency}, ${turn}°`,
        ).toBe(true);
  });

  it('names every piece uniquely, so a re-sort moves pieces rather than rebuilding them', () => {
    for (const { frequency, turn } of sweep) {
      const ids = wave(frequency, turn).pieces.map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('the axes', () => {
  it('run under the surface where it lies in front of them', () => {
    const { pieces } = wave(FREQUENCY.initial, TURN.initial);
    const order = pieces.map(({ kind }) => kind);
    const firstTile = order.indexOf('tile');
    const lastTile = order.lastIndexOf('tile');
    const between = order.slice(firstTile, lastTile).filter((kind) => kind === 'axis');

    expect(between.length).toBeGreaterThan(0);
  });

  it('name each axis apart from the others and clear of the fade', () => {
    for (const { frequency, turn } of sweep)
      for (const size of SIZES) {
        const boxes = wave(frequency, turn).names.map(({ name, label }) => textBox(name, label, size));
        for (const [i, a] of boxes.entries()) {
          expect(clearOfFade(a, HEIGHT), `${a.name} at ${turn}° in ${size}`).toBe(true);
          for (const b of boxes.slice(i + 1)) expect(overlap(a, b)).toBe(false);
        }
      }
  });
});
