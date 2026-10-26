import { MEASURE } from '@/components/figures/Diagram/Diagram';
import {
  add,
  fromAngle,
  length,
  normalize,
  scale,
  sub,
  vec2,
  type Vec2,
} from '@/lib/vec2';

import { rayCircle } from './ray-circle';

export const WIDTH = MEASURE;
export const HEIGHT = 408;
export const ORIGIN = vec2(58, 204);
export const CENTRE = vec2(430, 204);
export const PLANET = 86;
export const ATMOSPHERE = 124;
export const ANGLE = { min: -22, max: 22, initial: 9 };

const RAY_LENGTH = 820;
const GAP = 1.5;
const STAGGER = 0.9;
const CHORD_FLOOR = 40;

type Pair = readonly [Vec2, Vec2];
export interface Placement {
  at: Vec2;
  offset: Vec2;
}

export function raySphere(degrees: number) {
  const direction = fromAngle((-degrees * Math.PI) / 180);
  const along = (t: number) => add(ORIGIN, scale(direction, t));
  const sky = rayCircle(ORIGIN, direction, CENTRE, ATMOSPHERE);
  const ground = rayCircle(ORIGIN, direction, CENTRE, PLANET);
  const closest = along(sky.closest);

  const toCentre = sub(CENTRE, closest);
  const away =
    length(toCentre) > 1 ? normalize(toCentre) : vec2(-direction.y, direction.x);
  const below = away.y >= 0 ? 1 : -1;
  const beside = (at: Vec2, side: number, ahead: number): Placement => ({
    at,
    offset: add(scale(away, side * GAP), scale(direction, ahead * STAGGER)),
  });
  const underCentre = (em: number, distance = 0): Placement => ({
    at: add(CENTRE, vec2(0, below * distance)),
    offset: vec2(0, below * em),
  });

  const crossings: Pair | null = sky.hits
    ? [along(sky.near), along(sky.far)]
    : null;
  const landings: Pair | null = ground.hits
    ? [along(ground.near), along(ground.far)]
    : null;

  return {
    closest,
    end: along(RAY_LENGTH),
    crossings,
    landings,
    lit: crossings && ([crossings[0], landings?.[0] ?? crossings[1]] as Pair),
    labels: {
      O: { at: ORIGIN, offset: vec2(0, -GAP) },
      C: underCentre(GAP),
      H:
        sky.hits && sky.far - sky.near <= CHORD_FLOOR ? null : beside(closest, -1, 0),
      p1: crossings && beside(crossings[0], -1, -1),
      p2: crossings && beside(crossings[1], -1, 1),
      g1: landings && beside(landings[0], 1, -1),
      g2: landings && beside(landings[1], 1, 1),
      Planet: underCentre(3),
      Atmosphere: underCentre(1.2, ATMOSPHERE),
    } satisfies Record<string, Placement | null>,
  };
}
