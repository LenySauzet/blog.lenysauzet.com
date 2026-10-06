import { dot, lengthSq, sub, type Vec2 } from '@/lib/vec2';

/** Distances along the ray, not points: the drawing hangs its own marks on them.
    `near` and `far` sit behind `hits`, so neither reads without the proof. */
export type RayCircle =
  | { readonly hits: false; readonly closest: number }
  | {
      readonly hits: true;
      readonly closest: number;
      readonly near: number;
      readonly far: number;
    };

/** A ray, not a line: a circle behind the origin is a miss. `direction` must be
    unit length, which is what makes `closest` a distance. */
export function rayCircle(
  origin: Vec2,
  direction: Vec2,
  centre: Vec2,
  radius: number,
): RayCircle {
  const toCentre = sub(origin, centre);
  const closest = -dot(toCentre, direction);
  const discriminant =
    closest * closest - (lengthSq(toCentre) - radius * radius);

  if (discriminant < 0) return { hits: false, closest };

  const offset = Math.sqrt(discriminant);
  const near = closest - offset;
  const far = closest + offset;

  return far < 0
    ? { hits: false, closest }
    : { hits: true, closest, near, far };
}
