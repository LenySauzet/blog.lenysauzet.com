import type { Placement } from '@/components/figures/Diagram';
import { area, clip, depth, rectangle, type HalfPlane } from '@/lib/polygon';
import { add, fromAngle, vec2, type Vec2 } from '@/lib/vec2';

export const HEIGHT = 300;
export const ANGLE = { min: -70, max: 70, initial: 25 };

export const CELL = 32;
const COLUMNS = 8;
const ROWS = 6;
const GRID = vec2(40, 54);
const PIVOT = vec2(150, 142);
const FOCUS = { column: 3, row: 2 };

export const LENS = { at: vec2(440, 150), r: 84 };
const SOURCE = 24;
export const ARROW = { from: vec2(538, 150), to: vec2(580, 150) };
export const SWATCH = rectangle(vec2(588, 136), 28, 28);

const cellAt = (column: number, row: number) =>
  rectangle(add(GRID, vec2(column * CELL, row * CELL)), CELL, CELL);

export function coverage(degrees: number) {
  const along = fromAngle((-degrees * Math.PI) / 180);
  const shape: HalfPlane = { through: PIVOT, normal: vec2(-along.y, along.x) };
  const share = (corners: Vec2[]) => area(clip(corners, shape)) / CELL ** 2;

  const cells = Array.from({ length: COLUMNS * ROWS }, (_, index) => {
    const corners = cellAt(index % COLUMNS, Math.floor(index / COLUMNS));
    return { corners, share: share(corners) };
  });
  const focus = cellAt(FOCUS.column, FOCUS.row);
  const edge = clip(rectangle(GRID, COLUMNS * CELL, ROWS * CELL), shape).filter(
    (corner) => Math.abs(depth(shape, corner)) < 1e-6,
  );

  return {
    cells,
    edge,
    focus: {
      corners: focus,
      covered: clip(focus, shape),
      share: share(focus),
    },
    source: { at: add(focus[0], vec2(CELL / 2, CELL / 2)), r: SOURCE },
    readout: {
      at: add(SWATCH[3], vec2(14, 0)),
      offset: vec2(0, 1.2),
    } satisfies Placement,
  };
}
