import { hull, signedArea } from '@/lib/polygon';
import { vec2, type Vec2 } from '@/lib/vec2';
import { basis, dot3, normalize3, vec3, view, type Camera, type Vec3 } from '@/lib/vec3';

import { circle, rounded, type Plan } from './outline';

/** From turned away from the light to facing it. */
export type Tone = 0 | 1 | 2 | 3;

export const TONES = 4;

/** A solid seen by one camera: every piece in screen units, painted in this order. */
export interface Solid {
  /** In the page's colour, hiding what stands behind: one hull, or a face each when concave. */
  fill: Vec2[][];
  sides: { corners: Vec2[]; tone: Tone }[];
  top: Vec2[];
  /** Where the top meets the sides the viewer sees. */
  crease: Vec2[][];
  /** A highlight inset along the crease, when asked for. */
  bevel: Vec2[][];
  outline: Vec2[][];
  /** Larger is nearer: what a painter sorts on. */
  depth: number;
}

export interface Rise {
  /** The height the solid stands on. */
  from: number;
  height: number;
  /** Inset of the bevel along the top's visible edges; 0 draws none. */
  bevel?: number;
  /** An outline that turns inward: filled from its faces, since a hull would bridge the notch. */
  concave?: boolean;
}

/**
 * The light every solid is shaded by, level and from the viewer's left, a little in
 * front: fixed to the camera, so a turned object keeps its tones where the eye expects.
 */
export function lightOf(camera: Pick<Camera, 'yaw' | 'pitch'>): Vec3 {
  const { right, toward } = basis(camera);
  return normalize3(vec3(0.4 * toward.x - right.x, 0, 0.4 * toward.z - right.z));
}

/** How a side whose outward normal is `normal` is shaded, in `TONES` steps. */
export const toneOf = (normal: Vec3, light: Vec3): Tone =>
  Math.min(TONES - 1, Math.floor(((dot3(normal, light) + 1) / 2) * TONES)) as Tone;

/** Consecutive indices round a closed ring where `keep` holds, each run with its closing index. */
function runs(flags: readonly boolean[], keep: boolean): number[][] {
  const count = flags.length;
  const start = flags.findIndex((flag, index) => flag !== flags[(index + count - 1) % count]);
  if (start < 0) return flags[0] === keep ? [Array.from({ length: count + 1 }, (_, index) => index % count)] : [];

  const found: number[][] = [];
  let run: number[] | null = null;
  for (let step = 0; step < count; step++) {
    const index = (start + step) % count;
    if (flags[index] === keep) {
      run ??= [index];
      run.push((index + 1) % count);
    } else if (run) {
      found.push(run);
      run = null;
    }
  }
  if (run) found.push(run);
  return found;
}

const turnedUp = (points: Vec2[]) => (signedArea(points) < 0 ? [...points].reverse() : points);

/** Any floor outline stood up along y and shaded by facing. */
export function prism(ring: readonly Vec2[], { from, height, bevel = 0, concave = false }: Rise, camera: Camera): Solid {
  const project = view(camera);
  const { toward } = basis(camera);
  const light = lightOf(camera);
  const count = ring.length;
  const outward = signedArea(ring) > 0 ? 1 : -1;

  const normals = ring.map((point, index) => {
    const next = ring[(index + 1) % count];
    return normalize3(vec3(outward * (next.y - point.y), 0, outward * (point.x - next.x)));
  });
  const facing = normals.map((normal) => dot3(normal, toward) > 1e-9);
  const top = ring.map(({ x, y }) => project(vec3(x, from + height, y)).at);
  const bottom = ring.map(({ x, y }) => project(vec3(x, from, y)).at);
  const side = (index: number) => {
    const next = (index + 1) % count;
    return turnedUp([top[index], top[next], bottom[next], bottom[index]]);
  };
  const along = (points: Vec2[], run: number[]) => run.map((index) => points[index]);

  const visible = runs(facing, true);
  const outline = [
    ...runs(facing, false).map((run) => along(top, run)),
    ...(height > 0 ? visible.map((run) => along(bottom, run)) : []),
    ...(height > 0
      ? ring.flatMap((_, index) => (facing[(index + count - 1) % count] !== facing[index] ? [[top[index], bottom[index]]] : []))
      : []),
  ];

  const corner = (index: number) => {
    const [a, b] = [normals[(index + count - 1) % count], normals[index]];
    const length = Math.hypot(a.x + b.x, a.z + b.z) || 1;
    const { x, y } = ring[index];
    return project(vec3(x - ((a.x + b.x) / length) * bevel, from + height, y - ((a.z + b.z) / length) * bevel)).at;
  };

  const centre = ring.reduce((sum, { x, y }) => vec2(sum.x + x / count, sum.y + y / count), vec2(0, 0));

  return {
    fill: concave
      ? [turnedUp(top), turnedUp(bottom), ...ring.flatMap((_, index) => (facing[index] ? [side(index)] : []))]
      : [hull([...top, ...bottom])],
    sides:
      height > 0
        ? ring.flatMap((_, index) => (facing[index] ? [{ corners: side(index), tone: toneOf(normals[index], light) }] : []))
        : [],
    top: turnedUp(top),
    crease: visible.map((run) => along(top, run)),
    bevel:
      bevel > 0
        ? visible.map((run) => [top[run[0]], ...run.slice(1, -1).map(corner), top[run[run.length - 1]]])
        : [],
    outline,
    depth: project(vec3(centre.x, from + height / 2, centre.y)).depth,
  };
}

/** A rounded box: 2 to 4 `steps` to a corner for small parts, 8 to 10 for large ones. */
export const box = (plan: Plan, rise: Rise, camera: Camera, steps = 8) => prism(rounded(plan, steps), rise, camera);

/** A post, foot, puck or knob: 16 to 20 `steps` for small ones, 56 to 72 for wide discs. */
export const post = (centre: Vec2, radius: number, rise: Rise, camera: Camera, steps = 32) =>
  prism(circle(centre, radius, steps), rise, camera);
