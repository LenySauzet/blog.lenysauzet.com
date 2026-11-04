import { signedArea } from '@/lib/polygon';
import type { Vec2 } from '@/lib/vec2';
import { add3, basis, cross, dot3, normalize3, scale3, sub3, vec3, view, type Camera, type Vec3 } from '@/lib/vec3';

import { circle } from './outline';

/**
 * Lines drawn on solids: seams, rulers, knurls, springs. Each is a list of polylines in
 * screen units, so it can be tested as geometry and written as one path.
 */
export type Lines = Vec2[][];

export const polyline = (points: readonly Vec3[], camera: Camera): Vec2[] => points.map((point) => view(camera)(point).at);

/** A horizontal circle at height `y`, whole: a screw ring or a bezel on a top face. */
export const ring = (centre: Vec2, radius: number, y: number, camera: Camera, steps = 40): Vec2[] => {
  const points = circle(centre, radius, steps);
  return polyline([...points, points[0]].map(({ x, y: z }) => vec3(x, y, z)), camera);
};

/** The half of a horizontal circle facing the viewer: a seam or a band round a post. */
export function frontArc(centre: Vec2, radius: number, y: number, camera: Camera, steps = 24): Vec2[] {
  const { toward } = basis(camera);
  const facing = Math.atan2(toward.z, toward.x);
  return polyline(
    Array.from({ length: steps + 1 }, (_, step) => {
      const angle = facing - Math.PI / 2 + (Math.PI * step) / steps;
      return vec3(centre.x + radius * Math.cos(angle), y, centre.y + radius * Math.sin(angle));
    }),
    camera,
  );
}

/**
 * A line round the visible near side of a floor outline at height `y`, ending on the
 * solid's own silhouette: a weld, a lid seam, a band. Inset from the corners instead, it
 * would read as a texture that stops.
 */
export function seam(ring: readonly Vec2[], y: number, camera: Camera): Lines {
  const { toward } = basis(camera);
  const count = ring.length;
  const outward = signedArea(ring) > 0 ? 1 : -1;
  const facing = ring.map((point, index) => {
    const next = ring[(index + 1) % count];
    return outward * ((next.y - point.y) * toward.x + (point.x - next.x) * toward.z) > 1e-9;
  });
  const first = facing.findIndex((on, index) => on && !facing[(index + count - 1) % count]);
  if (first < 0) return [];

  const lines: Lines = [];
  let run: Vec3[] = [];
  for (let step = 0; step <= count; step++) {
    const index = (first + step) % count;
    const { x, y: z } = ring[index];
    const point = vec3(x, y, z);
    if (step < count && facing[index]) run.push(point);
    else if (run.length) {
      lines.push(polyline([...run, point], camera));
      run = [];
    }
  }
  return lines;
}

/** Upright lines round the visible half of a post: the grip of a knob. */
export function knurl(centre: Vec2, radius: number, [y0, y1]: readonly [number, number], count: number, camera: Camera): Lines {
  const { toward } = basis(camera);
  return Array.from({ length: count }, (_, index) => (2 * Math.PI * index) / count)
    // Closer to the limb than this, the lines crowd into a grey band.
    .filter((angle) => Math.cos(angle) * toward.x + Math.sin(angle) * toward.z > 0.15)
    .map((angle) => {
      const [x, z] = [centre.x + radius * Math.cos(angle), centre.y + radius * Math.sin(angle)];
      return polyline([vec3(x, y0, z), vec3(x, y1, z)], camera);
    });
}

/**
 * A coil spring from `from` to `to`, split where its wire passes behind and in front of
 * its own axis: paint `behind`, then the rod it wraps, then `front`.
 */
export function coil(from: Vec3, to: Vec3, radius: number, turns: number, camera: Camera, perTurn = 16) {
  const axis = sub3(to, from);
  const along = normalize3(axis);
  // Any direction off the axis seeds the two that span its cross-section.
  const u = normalize3(cross(Math.abs(along.y) < 0.9 ? vec3(0, 1, 0) : vec3(1, 0, 0), along));
  const v = cross(along, u);
  const { toward } = basis(camera);
  const behind: Lines = [];
  const front: Lines = [];
  let run: Vec3[] = [];
  let near: boolean | null = null;
  const count = Math.max(1, Math.round(turns * perTurn));

  for (let index = 0; index <= count; index++) {
    const angle = (2 * Math.PI * turns * index) / count;
    const out = add3(scale3(u, Math.cos(angle)), scale3(v, Math.sin(angle)));
    const point = add3(add3(from, scale3(axis, index / count)), scale3(out, radius));
    const facing = dot3(out, toward) > 0;
    near ??= facing;
    run.push(point);
    if (facing !== near) {
      (near ? front : behind).push(polyline(run, camera));
      run = [point];
      near = facing;
    }
  }
  if (run.length > 1) (near ? front : behind).push(polyline(run, camera));
  return { behind, front };
}

export interface Scale {
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
export function ticks({ from, to, outward, step, every, lengths: [minor, major] }: Scale, camera: Camera) {
  const span = sub3(to, from);
  const length = Math.hypot(span.x, span.y, span.z);
  const count = Math.floor(length / step + 1e-9);
  const marks = { minor: [] as Lines, major: [] as Lines };
  for (let index = 0; index <= count; index++) {
    const root = add3(from, scale3(span, (index * step) / length));
    const big = index % every === 0;
    marks[big ? 'major' : 'minor'].push(polyline([root, add3(root, scale3(outward, big ? major : minor))], camera));
  }
  return marks;
}

/** Ticks round a dial on a top face; angle 0 points to -z and grows clockwise from above. */
export function dial(
  centre: Vec2,
  radius: number,
  y: number,
  { count, every, lengths: [minor, major], from = 0, span = 2 * Math.PI }: {
    count: number;
    every: number;
    lengths: readonly [number, number];
    from?: number;
    span?: number;
  },
  camera: Camera,
) {
  const whole = Math.abs(span - 2 * Math.PI) < 1e-9;
  const marks = { minor: [] as Lines, major: [] as Lines };
  for (let index = 0; index < (whole ? count : count + 1); index++) {
    const angle = from + (span * index) / count;
    const big = index % every === 0;
    const [dx, dz] = [Math.sin(angle), -Math.cos(angle)];
    const inner = radius - (big ? major : minor);
    marks[big ? 'major' : 'minor'].push(
      polyline([vec3(centre.x + dx * inner, y, centre.y + dz * inner), vec3(centre.x + dx * radius, y, centre.y + dz * radius)], camera),
    );
  }
  return marks;
}

/**
 * An SVG transform that lays a group's flat coordinates on any face: its x along `u`,
 * its y along `v`, from `origin`, all in world units. Text, screens and plates are drawn
 * flat inside it and land in the face's own plane.
 */
export function onFace(origin: Vec3, u: Vec3, v: Vec3, camera: Camera) {
  const project = view(camera);
  const at = project(origin).at;
  const [a, b] = [project(add3(origin, u)).at, project(add3(origin, v)).at];
  const values = [a.x - at.x, a.y - at.y, b.x - at.x, b.y - at.y, at.x, at.y];
  return `matrix(${values.map((value) => Math.round(value * 1000) / 1000).join(' ')})`;
}
