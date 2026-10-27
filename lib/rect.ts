import { vec2, type Vec2 } from '@/lib/vec2';

export interface Rect {
  readonly corner: Vec2;
  readonly size: Vec2;
}

export type Side = 'top' | 'right' | 'bottom' | 'left';

export const rect = (corner: Vec2, width: number, height: number): Rect => ({
  corner,
  size: vec2(width, height),
});

export const centre = ({ corner, size }: Rect) =>
  vec2(corner.x + size.x / 2, corner.y + size.y / 2);

export const edge = (box: Rect, side: Side, gap = 0) => {
  const { x, y } = centre(box);
  const { corner, size } = box;

  switch (side) {
    case 'top':
      return vec2(x, corner.y - gap);
    case 'right':
      return vec2(corner.x + size.x + gap, y);
    case 'bottom':
      return vec2(x, corner.y + size.y + gap);
    case 'left':
      return vec2(corner.x - gap, y);
  }
};
