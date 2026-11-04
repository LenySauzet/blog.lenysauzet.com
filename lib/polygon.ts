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

/** Positive when the points turn counter-clockwise in a y-up frame. */
export const signedArea = (polygon: readonly Vec2[]) =>
  polygon.reduce((sum, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2;

export const area = (polygon: readonly Vec2[]) => Math.abs(signedArea(polygon));

/** The smallest convex polygon holding every point, by Andrew's monotone chain. */
export function hull(points: readonly Vec2[]): Vec2[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;
  const turn = (o: Vec2, a: Vec2, b: Vec2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const chain = (list: readonly Vec2[]) => {
    const kept: Vec2[] = [];
    for (const point of list) {
      while (kept.length >= 2 && turn(kept[kept.length - 2], kept[kept.length - 1], point) <= 0) kept.pop();
      kept.push(point);
    }
    return kept.slice(0, -1);
  };

  return [...chain(sorted), ...chain([...sorted].reverse())];
}

export const rectangle = (corner: Vec2, width: number, height: number) => [
  corner,
  vec2(corner.x + width, corner.y),
  vec2(corner.x + width, corner.y + height),
  vec2(corner.x, corner.y + height),
];
