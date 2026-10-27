import {
  FADE_HOLD,
  LARGEST_TYPE,
  MEASURE,
  type Placement,
} from '@/components/figures/Diagram';
import type { Rect } from '@/lib/rect';
import { add, scale, vec2, type Vec2 } from '@/lib/vec2';

export const SIZES = [13, 16, LARGEST_TYPE];

const GLYPH = { width: 0.65, height: 1.3 };
const TRACKING = 0.12;
const BAND = 1 - FADE_HOLD / 100;

export interface Box {
  name: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const textBox = (
  name: string,
  { at, offset }: Placement,
  size: number,
  anchor: 'start' | 'middle' | 'end' = 'middle',
): Box => {
  const origin = add(at, scale(offset, size));
  const width = name.length * GLYPH.width * size;
  const left = origin.x - width * { start: 0, middle: 0.5, end: 1 }[anchor];

  return {
    name,
    left,
    right: left + width,
    top: origin.y - (GLYPH.height * size) / 2,
    bottom: origin.y + (GLYPH.height * size) / 2,
  };
};

export const titleBox = (name: string, { x, y }: Vec2, size: number): Box => {
  const width = name.length * (GLYPH.width + TRACKING) * size;

  return {
    name,
    left: x - width / 2,
    right: x + width / 2,
    top: y - (GLYPH.height * size) / 2,
    bottom: y + (GLYPH.height * size) / 2,
  };
};

export const bounds = (name: string, { corner, size }: Rect): Box => ({
  name,
  left: corner.x,
  right: corner.x + size.x,
  top: corner.y,
  bottom: corner.y + size.y,
});

export const inside = (outer: Box, inner: Box) =>
  inner.left >= outer.left &&
  inner.right <= outer.right &&
  inner.top >= outer.top &&
  inner.bottom <= outer.bottom;

export const overlap = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

export const covers = (box: Box, { x, y }: Vec2, radius: number) =>
  x + radius > box.left &&
  x - radius < box.right &&
  y + radius > box.top &&
  y - radius < box.bottom;

export const side = (from: Vec2, to: Vec2, { x, y }: Vec2) =>
  Math.sign((to.x - from.x) * (y - from.y) - (to.y - from.y) * (x - from.x));

export const crossesLine = (box: Box, from: Vec2, to: Vec2) => {
  const sides = [
    vec2(box.left, box.top),
    vec2(box.right, box.top),
    vec2(box.left, box.bottom),
    vec2(box.right, box.bottom),
  ].map((corner) => side(from, to, corner));

  return sides.includes(1) && sides.includes(-1);
};

export const segmentsCross = ([a, b]: readonly [Vec2, Vec2], [c, d]: readonly [Vec2, Vec2]) =>
  side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;

export const clearOfFade = (box: Box, height: number) =>
  box.left > MEASURE * BAND &&
  box.right < MEASURE * (1 - BAND) &&
  box.top > height * BAND &&
  box.bottom < height * (1 - BAND);
