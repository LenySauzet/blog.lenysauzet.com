import { dot, lerp, sub, vec2, type Vec2 } from '@/lib/vec2';

export interface HalfPlane {
  through: Vec2;
  normal: Vec2;
}

export const depth = ({ through, normal }: HalfPlane, point: Vec2) =>
  dot(sub(point, through), normal);

export function clip(polygon: readonly Vec2[], plane: HalfPlane): Vec2[] {
  return polygon.flatMap((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const [here, there] = [depth(plane, point), depth(plane, next)];
    const kept = here >= 0 ? [point] : [];

    return (here >= 0) === (there >= 0)
      ? kept
      : [...kept, lerp(point, next, here / (here - there))];
  });
}

export const area = (polygon: readonly Vec2[]) =>
  Math.abs(
    polygon.reduce((sum, point, index) => {
      const next = polygon[(index + 1) % polygon.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0),
  ) / 2;

export const rectangle = (corner: Vec2, width: number, height: number) => [
  corner,
  vec2(corner.x + width, corner.y),
  vec2(corner.x + width, corner.y + height),
  vec2(corner.x, corner.y + height),
];
