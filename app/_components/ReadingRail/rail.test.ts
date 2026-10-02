import { describe, expect, it } from 'vitest';

import { layOutTicks, tickAt, type Section } from './rail';

const section = (id: string, progress: number): Section => ({
  id,
  label: id.toUpperCase(),
  progress,
});

const marked = (ticks: ReturnType<typeof layOutTicks>) =>
  ticks.flatMap((tick, index) => (tick.section ? [[index, tick.section.id]] : []));

describe('tickAt', () => {
  it('finds the tick nearest a position', () => {
    expect(tickAt(11, 0)).toBe(0);
    expect(tickAt(11, 0.5)).toBe(5);
    expect(tickAt(11, 1)).toBe(10);
    expect(tickAt(11, 0.44)).toBe(4);
  });

  it('holds a position outside the rail at its end', () => {
    expect(tickAt(11, -2)).toBe(0);
    expect(tickAt(11, 3)).toBe(10);
  });

  it('answers for a rail too short to have a grid', () => {
    expect(tickAt(1, 0.7)).toBe(0);
    expect(tickAt(0, 0.7)).toBe(0);
  });
});

describe('layOutTicks', () => {
  it('spreads the ticks evenly from end to end', () => {
    const ticks = layOutTicks(5, []);

    expect(ticks.map((tick) => tick.progress)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('puts a section on the tick nearest it', () => {
    const ticks = layOutTicks(11, [section('middle', 0.52)]);

    expect(marked(ticks)).toEqual([[5, 'middle']]);
  });

  // Two headings a paragraph apart are still two places to go.
  it('moves a section down rather than losing it to one already taken', () => {
    const ticks = layOutTicks(11, [section('first', 0.5), section('second', 0.51)]);

    expect(marked(ticks)).toEqual([
      [5, 'first'],
      [6, 'second'],
    ]);
  });

  it('marks them in the order they are read, whatever order they arrive in', () => {
    const ticks = layOutTicks(11, [section('late', 0.9), section('early', 0.1)]);

    expect(marked(ticks)).toEqual([
      [1, 'early'],
      [9, 'late'],
    ]);
  });

  it('drops a section with nowhere left to go rather than overflowing', () => {
    const ticks = layOutTicks(2, [
      section('a', 1),
      section('b', 1),
      section('c', 1),
    ]);

    expect(marked(ticks)).toEqual([[1, 'a']]);
    expect(ticks).toHaveLength(2);
  });

  it('lays out nothing for a rail with no room', () => {
    expect(layOutTicks(0, [section('a', 0.5)])).toEqual([]);
  });
});
