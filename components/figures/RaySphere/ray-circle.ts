import { dot, lengthSq, sub, type Vec2 } from '@/lib/vec2';

export type RayCircle =
  | { readonly hits: false; readonly closest: number }
  | {
      readonly hits: true;
      readonly closest: number;
      readonly near: number;
      readonly far: number;
    };

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
