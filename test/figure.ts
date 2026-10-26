import {
  FADE_HOLD,
  LARGEST_TYPE,
  MEASURE,
  type Placement,
} from '@/components/figures/Diagram';
import { add, scale, vec2, type Vec2 } from '@/lib/vec2';

export const SIZES = [13, 16, LARGEST_TYPE];

const GLYPH = { width: 0.65, height: 1.3 };
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
  anchor: 'start' | 'middle' = 'middle',
): Box => {
  const origin = add(at, scale(offset, size));
  const width = name.length * GLYPH.width * size;
  const left = anchor === 'middle' ? origin.x - width / 2 : origin.x;

  return {
    name,
    left,
    right: left + width,
    top: origin.y - (GLYPH.height * size) / 2,
    bottom: origin.y + (GLYPH.height * size) / 2,
  };
};

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
