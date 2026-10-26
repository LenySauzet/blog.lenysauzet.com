import { lerp, type Vec2 } from '@/lib/vec2';

export const deCasteljau = (points: readonly Vec2[], t: number): Vec2[][] =>
  points.length === 1
    ? [[...points]]
    : [
        [...points],
        ...deCasteljau(
          points.slice(1).map((point, index) => lerp(points[index], point, t)),
          t,
        ),
      ];
