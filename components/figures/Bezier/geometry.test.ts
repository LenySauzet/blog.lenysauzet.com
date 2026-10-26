import { describe, expect, it } from 'vitest';

import { leaderPath } from '@/components/figures/Diagram/leaders';
import { vec2, type Vec2 } from '@/lib/vec2';
import { clearOfFade, covers, overlap, segmentsCross, SIZES, textBox } from '@/test/figure';

import { bezier, HEIGHT, T } from './geometry';

const sweep = SIZES.flatMap((size) =>
  Array.from({ length: (T.max - T.min) * 100 + 1 }, (_, i) => ({
    size,
    t: T.min + i / 100,
  })),
);

const named = (t: number, size: number) => {
  const { labels, leaders } = bezier(t);

  return [
    ...Object.entries(labels).map(([name, placement]) => textBox(name, placement, size)),
    ...leaders.map(({ name, label }) =>
      textBox(name, { at: label, offset: vec2(0.5, 0) }, size, 'start'),
    ),
  ];
};

const segments = (path: Vec2[]) =>
  path.slice(1).map((point, index) => [path[index], point] as const);

describe('the curve', () => {
  it('is drawn up to the point on it and dashed beyond', () => {
    const { drawn, rest, point } = bezier(T.initial);

    expect(drawn.at(-1)).toEqual(point);
    expect(rest[0]).toEqual(point);
  });
});

describe('the names, across the whole slider', () => {
  it('never overlap each other', () => {
    for (const { t, size } of sweep) {
      const boxes = named(t, size);
      for (const [i, a] of boxes.entries())
        for (const b of boxes.slice(i + 1))
          expect(overlap(a, b), `${a.name} and ${b.name} at t=${t} in ${size}`).toBe(false);
    }
  });

  it('never sit on a point of the construction', () => {
    for (const { t, size } of sweep) {
      const { control, first, second, point } = bezier(t);
      for (const b of named(t, size))
        for (const at of [...control, ...first, ...second, point])
          expect(covers(b, at, 6), `${b.name} at t=${t} in ${size}`).toBe(false);
    }
  });

  it('stay clear of the faded edges', () => {
    for (const { t, size } of sweep)
      for (const b of named(t, size))
        expect(clearOfFade(b, HEIGHT), `${b.name} at t=${t} in ${size}`).toBe(true);
  });

  it('are reached by leaders that never cross each other', () => {
    for (const { t } of sweep) {
      const paths = bezier(t).leaders.map(({ target, label }) => leaderPath(target, label));
      for (const [i, a] of paths.entries())
        for (const b of paths.slice(i + 1))
          for (const one of segments(a))
            for (const other of segments(b))
              expect(segmentsCross(one, other), `at t=${t}`).toBe(false);
    }
  });
});
