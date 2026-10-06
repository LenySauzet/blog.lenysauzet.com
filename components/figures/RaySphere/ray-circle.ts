import { dot, lengthSq, sub, type Vec2 } from '@/lib/vec2';

/**
 * Where a ray meets a circle, as distances along it rather than as points: the
 * figure needs the same `t` on two radii, and a scalar is what the drawing turns
 * into whatever it is hanging there.
 *
 * `near` and `far` live behind `hits`, so neither can be read without the proof
 * that there is anything to read.
 */
export type RayCircle =
  | { readonly hits: false; readonly closest: number }
  | {
      readonly hits: true;
      readonly closest: number;
      readonly near: number;
      readonly far: number;
    };

/**
 * A ray, not a line: a circle behind the origin is a miss. `direction` is assumed
 * unit length, which makes the quadratic's leading coefficient 1 and `closest` a
 * distance rather than a parameter to be scaled back.
 */
export function rayCircle(
  origin: Vec2,
  direction: Vec2,
  centre: Vec2,
  radius: number
): RayCircle {
  const toCentre = sub(origin, centre);
  const closest = -dot(toCentre, direction);
  const discriminant = closest * closest - (lengthSq(toCentre) - radius * radius);

  if (discriminant < 0) return { hits: false, closest };

  const offset = Math.sqrt(discriminant);
  const near = closest - offset;
  const far = closest + offset;

  return far < 0 ? { hits: false, closest } : { hits: true, closest, near, far };
}
