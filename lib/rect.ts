import { vec2, type Vec2 } from '@/lib/vec2';

export interface Rect {
  readonly corner: Vec2;
  readonly size: Vec2;
}

export const rect = (corner: Vec2, width: number, height: number): Rect => ({
  corner,
  size: vec2(width, height),
});

export const centre = ({ corner, size }: Rect) =>
  vec2(corner.x + size.x / 2, corner.y + size.y / 2);
