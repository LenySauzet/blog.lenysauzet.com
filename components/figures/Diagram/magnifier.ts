import { add, fromAngle, length, scale, sub, type Vec2 } from '@/lib/vec2';

export interface Disc {
  at: Vec2;
  r: number;
}

export function tangents(near: Disc, far: Disc): [Vec2, Vec2][] {
  const between = sub(far.at, near.at);
  const heading = Math.atan2(between.y, between.x);
  const spread = Math.acos((near.r - far.r) / length(between));

  return [heading + spread, heading - spread].map((angle) => {
    const outward = fromAngle(angle);
    return [add(near.at, scale(outward, near.r)), add(far.at, scale(outward, far.r))];
  });
}
