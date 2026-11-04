import type { Vec2 } from '@/lib/vec2';

/** Polylines in screen units, ready to be written as one path. */
export type Lines = Vec2[][];

/**
 * A tenth of a viewBox unit, about a tenth of a pixel at the column's width: finer
 * costs payload on figures of thousands of paths and changes nothing a reader sees.
 */
export const tenth = (value: number) => (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '');

/** One SVG path for every polyline given, each closed when `closed` is set. */
export const pathOf = (lines: Lines, closed = false) =>
  lines
    .filter((line) => line.length > 0)
    .map((line) => {
      const moves = line.map(({ x, y }, at) => `${at ? 'L' : 'M'}${tenth(x)} ${tenth(y)}`).join('');
      return closed ? `${moves}Z` : moves;
    })
    .join('');
