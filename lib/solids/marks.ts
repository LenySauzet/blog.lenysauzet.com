import { vec2, type Vec2 } from '@/lib/vec2';
import {
  add3,
  cross,
  dot3,
  normalize3,
  scale3,
  sub3,
  towardViewer,
  vec3,
  view,
  type Camera,
  type Vec3,
} from '@/lib/vec3';

import { circle } from './outline';
import type { Lines } from './path';
import { convexRing, facingOf, runs } from './prism';

/**
 * Lines drawn on solids, seams, rulers, knurls, springs, as world polylines: projected
 * last, so what lies in front of what stays known to whoever sorts or checks them.
 */
export type Strokes = Vec3[][];

export const projected = (strokes: Strokes, camera: Camera): Lines => {
  const project = view(camera);
  return strokes.map((stroke) => stroke.map((point) => project(point).at));
};

const onFloor = ({ x, y: z }: Vec2, y: number) => vec3(x, y, z);

/** A whole horizontal circle at height `y`: a screw ring or a bezel on a top face. */
export function rim(centre: Vec2, radius: number, y: number, steps = 40): Strokes {
  const points = circle(centre, radius, steps).map((point) => onFloor(point, y));
  return [[...points, points[0]]];
}

/**
 * A line round the visible near side of a convex floor outline at height `y`, ending on
 * the solid's own silhouette: a weld, a lid seam. Inset from the corners instead, it
 * would read as a texture that stops.
 */
export function seam(outline: readonly Vec2[], y: number, camera: Camera): Strokes {
  const points = convexRing(outline);
  return runs(facingOf(points, camera), true).map((run) => run.map((index) => onFloor(points[index], y)));
}

/**
 * A seam round a cylinder: given the cylinder's own `steps`, it ends on its silhouette,
 * where a true half circle would overshoot the facets.
 */
export const band = (centre: Vec2, radius: number, y: number, camera: Camera, steps = 32) =>
  seam(circle(centre, radius, steps), y, camera);

/** Upright lines round the visible half of a cylinder: the grip of a knob. */
export function knurl(
  centre: Vec2,
  radius: number,
  [y0, y1]: readonly [number, number],
  count: number,
  camera: Camera,
): Strokes {
  const toward = towardViewer(camera);
  // Measured on the floor alone, so the cut is the same at every pitch.
  const level = Math.hypot(toward.x, toward.z);
  return Array.from({ length: count }, (_, index) => (2 * Math.PI * index) / count)
    // Closer to the limb than this, the lines crowd into a grey band.
    .filter((angle) => (Math.cos(angle) * toward.x + Math.sin(angle) * toward.z) / level > 0.15)
    .map((angle) => {
      const at = vec2(centre.x + radius * Math.cos(angle), centre.y + radius * Math.sin(angle));
      return [onFloor(at, y0), onFloor(at, y1)];
    });
}

/**
 * A coil spring from `from` to `to`, split where its wire passes behind and in front of
 * its own axis: paint `behind`, then the rod it wraps, then `front`.
 */
export function coil(from: Vec3, to: Vec3, radius: number, turns: number, camera: Camera, perTurn = 16) {
  const axis = sub3(to, from);
  if (!(Math.hypot(axis.x, axis.y, axis.z) > 0)) throw new Error('coil: its ends must be apart');
  if (!(turns > 0) || !(perTurn >= 1)) throw new Error('coil: it must turn, sampled at least once a turn');
  const along = normalize3(axis);
  // Any direction off the axis seeds the two that span its cross-section.
  const u = normalize3(cross(Math.abs(along.y) < 0.9 ? vec3(0, 1, 0) : vec3(1, 0, 0), along));
  const v = cross(along, u);
  const toward = towardViewer(camera);
  const halves = { behind: [] as Strokes, front: [] as Strokes };
  const count = Math.ceil(turns * perTurn);
  let run: Vec3[] = [];
  let near: boolean | null = null;

  for (let index = 0; index <= count; index++) {
    const angle = (2 * Math.PI * turns * index) / count;
    const out = add3(scale3(u, Math.cos(angle)), scale3(v, Math.sin(angle)));
    const point = add3(add3(from, scale3(axis, index / count)), scale3(out, radius));
    const facing = dot3(out, toward) > 0;
    near ??= facing;
    run.push(point);
    if (facing !== near) {
      halves[near ? 'front' : 'behind'].push(run);
      run = [point];
      near = facing;
    }
  }
  if (run.length > 1) halves[near ? 'front' : 'behind'].push(run);
  return halves;
}

export interface Ruler {
  /** Where the scale starts and ends: the edge its ticks grow from. */
  from: Vec3;
  to: Vec3;
  /** The unit direction the ticks grow in, across the edge and in its face. */
  outward: Vec3;
  /** World units between ticks along the edge. */
  step: number;
  /** Every how many ticks a major one falls, counted from the start. */
  every: number;
  lengths: readonly [minor: number, major: number];
}

/** A ruler's ticks, rooted on the edge they hang from, on any face. */
export function ticks({ from, to, outward, step, every, lengths: [minor, major] }: Ruler) {
  if (!(step > 0) || !(every >= 1) || !Number.isInteger(every)) {
    throw new Error('ticks: the step must be positive and every a whole count');
  }
  const span = sub3(to, from);
  const length = Math.hypot(span.x, span.y, span.z);
  const marks = { minor: [] as Strokes, major: [] as Strokes };
  if (length === 0) return marks;
  for (let index = 0; index <= Math.floor(length / step + 1e-9); index++) {
    const root = add3(from, scale3(span, (index * step) / length));
    const big = index % every === 0;
    marks[big ? 'major' : 'minor'].push([root, add3(root, scale3(outward, big ? major : minor))]);
  }
  return marks;
}

export interface Dial {
  count: number;
  /** Every how many ticks a major one falls, counted from `from`. */
  every: number;
  lengths: readonly [minor: number, major: number];
  /** Where the ticks start, in radians: 0 points to -z, growing clockwise seen from above. */
  from?: number;
  /** How far round they run; a whole turn draws its zero once. */
  span?: number;
}

/** Ticks round a dial on a top face at height `y`. */
export function dial(
  centre: Vec2,
  radius: number,
  y: number,
  { count, every, lengths: [minor, major], from = 0, span = 2 * Math.PI }: Dial,
) {
  if (![count, every].every((value) => value >= 1 && Number.isInteger(value)) || !(Math.abs(span) > 0)) {
    throw new Error('dial: count and every must be whole counts, and span must not be nothing');
  }
  const whole = Math.abs(Math.abs(span) - 2 * Math.PI) < 1e-9;
  const marks = { minor: [] as Strokes, major: [] as Strokes };
  for (let index = 0; index < (whole ? count : count + 1); index++) {
    const angle = from + (span * index) / count;
    const big = index % every === 0;
    // Angle 0 at -z, so the radius at `angle` is (sin, -cos) on the floor.
    const at = (reach: number) =>
      vec3(centre.x + Math.sin(angle) * reach, y, centre.y - Math.cos(angle) * reach);
    marks[big ? 'major' : 'minor'].push([at(radius - (big ? major : minor)), at(radius)]);
  }
  return marks;
}

/**
 * An SVG transform that lays a group's flat coordinates on any face: its x along `u`,
 * its y along `v`, from `origin`, all in world units. Text, screens and plates are drawn
 * flat inside it and land in the face's own plane. To a thousandth, finer than a path's
 * tenth, since the matrix scales whatever is drawn in it.
 */
export function onFace(origin: Vec3, u: Vec3, v: Vec3, camera: Camera) {
  const project = view(camera);
  const at = project(origin).at;
  const [a, b] = [project(add3(origin, u)).at, project(add3(origin, v)).at];
  const values = [a.x - at.x, a.y - at.y, b.x - at.x, b.y - at.y, at.x, at.y];
  return `matrix(${values.map((value) => Math.round(value * 1000) / 1000).join(' ')})`;
}
