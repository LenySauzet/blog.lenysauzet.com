import { describe, expect, it } from 'vitest';

import { layOutTicks, sameSections, tickAt, type Section } from './rail';

const section = (label: string, progress: number): Section => ({
  label,
  level: 2,
  progress,
  top: progress * 1000,
});

const marked = (ticks: ReturnType<typeof layOutTicks>) =>
  ticks.flatMap((tick, index) => (tick.section ? [[index, tick.section.label]] : []));

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

describe('sameSections', () => {
  const one = section('one', 0.5);

  it('holds a reading that has not moved', () => {
    expect(sameSections([one], [section('one', 0.5)])).toBe(true);
  });

  // A shorter viewport leaves every heading where it was and still lengthens
  // the travel under it, so the place on the rail moves while the measurement
  // does not. Compared on `top` alone the rail froze.
  it('sees a place that moved under a heading that did not', () => {
    const moved: Section = { ...one, progress: 0.48 };

    expect(moved.top).toBe(one.top);
    expect(sameSections([one], [moved])).toBe(false);
  });

  it('sees a heading renamed, moved, added or dropped', () => {
    expect(sameSections([one], [{ ...one, label: 'other' }])).toBe(false);
    expect(sameSections([one], [{ ...one, top: 12 }])).toBe(false);
    expect(sameSections([one], [one, section('two', 0.8)])).toBe(false);
    expect(sameSections([one], [])).toBe(false);
  });
});
