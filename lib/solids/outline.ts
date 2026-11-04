import { vec2, type Vec2 } from '@/lib/vec2';

/**
 * Floor outlines. A point's `x` is the world's x and its `y` the world's z: the floor
 * seen from above, which a solid stands up from along the world's y.
 */

/** A rectangle on the floor with rounded corners. */
export interface Plan {
  x: number;
  z: number;
  width: number;
  depth: number;
  radius: number;
}

/** The outline of a plan, `steps` segments to a corner. */
export function rounded({ x, z, width, depth, radius }: Plan, steps = 8): Vec2[] {
  const r = Math.max(0, Math.min(radius, width / 2, depth / 2));
  const centres = [
    vec2(x + width - r, z + r),
    vec2(x + width - r, z + depth - r),
    vec2(x + r, z + depth - r),
    vec2(x + r, z + r),
  ];

  const points = centres.flatMap((centre, corner) => {
    if (r === 0) return [centre];
    return Array.from({ length: steps + 1 }, (_, step) => {
      const angle = ((corner - 1 + step / steps) * Math.PI) / 2;
      return vec2(centre.x + r * Math.cos(angle), centre.y + r * Math.sin(angle));
    });
  });

  // At half a side the straight between two corners has no length, and the point both
  // share would make an edge with no normal, read as turned away mid-face.
  return points.filter((point, index) => {
    const before = points[(index + points.length - 1) % points.length];
    return Math.hypot(point.x - before.x, point.y - before.y) > 1e-9;
  });
}

export const circle = (centre: Vec2, radius: number, steps = 32): Vec2[] =>
  Array.from({ length: steps }, (_, step) => {
    const angle = (2 * Math.PI * step) / steps;
    return vec2(centre.x + radius * Math.cos(angle), centre.y + radius * Math.sin(angle));
  });

/** The plan shrunk by `by` on every side, or grown by a negative `by`. */
export const inset = ({ x, z, width, depth, radius }: Plan, by: number): Plan => ({
  x: x + by,
  z: z + by,
  width: width - 2 * by,
  depth: depth - 2 * by,
  radius: Math.max(0, radius - by),
});

/** One point `by` in from each corner of a plan: feet, screws. */
export const cornersOf = ({ x, z, width, depth }: Plan, by = 0): Vec2[] => [
  vec2(x + by, z + by),
  vec2(x + width - by, z + by),
  vec2(x + width - by, z + depth - by),
  vec2(x + by, z + depth - by),
];
