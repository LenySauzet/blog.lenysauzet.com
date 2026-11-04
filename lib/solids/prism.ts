import { hull, signedArea } from '@/lib/polygon';
import { vec2, type Vec2 } from '@/lib/vec2';
import { basis, dot3, normalize3, vec3, view, type Camera, type Vec3 } from '@/lib/vec3';

import { circle, rounded, type Plan } from './outline';

/** Polylines in screen units, ready to be written as one path. */
export type Lines = Vec2[][];

/** From turned away from the light to facing it. */
export type Tone = 0 | 1 | 2 | 3;

export const TONES = 4;

/**
 * A solid seen by one camera, every piece in screen units, painted in this order: fill,
 * sides, top, crease, bevel, silhouette.
 */
export interface Solid {
  /** The hull, in the page's colour, hiding what stands behind. */
  fill: Vec2[];
  sides: { corners: Vec2[]; tone: Tone }[];
  top: Vec2[];
  /** Where the top meets the sides the viewer sees. */
  crease: Lines;
  /** A highlight inset along the crease, tapering into the silhouette at its ends. */
  bevel: Lines;
  silhouette: Lines;
  /** Larger is nearer: what a painter sorts on. */
  depth: number;
}

export interface Rise {
  /** The height the solid stands on. */
  from: number;
  height: number;
  /** How far the bevel sits in from the top's visible edges; 0 draws none. */
  bevel?: number;
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

/** The outward normal of each edge of a floor outline, `i` to `i + 1`, whichever way it winds. */
export function normalsOf(ring: readonly Vec2[]): Vec3[] {
  const outward = signedArea(ring) > 0 ? 1 : -1;
  return ring.map((point, index) => {
    const next = ring[(index + 1) % ring.length];
    return normalize3(vec3(outward * (next.y - point.y), 0, outward * (point.x - next.x)));
  });
}

/** Which edges of a floor outline face the viewer. */
export const facingOf = (ring: readonly Vec2[], camera: Pick<Camera, 'yaw' | 'pitch'>) => {
  const { toward } = basis(camera);
  return normalsOf(ring).map((normal) => dot3(normal, toward) > 1e-9);
};

/**
 * The runs of edges where `flags` holds, round a closed ring, each as the indices of the
 * points it passes through, its closing one included.
 */
export function runs(flags: readonly boolean[], keep: boolean): number[][] {
  const count = flags.length;
  const start = flags.findIndex((flag, index) => flag !== flags[(index + count - 1) % count]);
  if (start < 0) {
    return flags[0] === keep ? [Array.from({ length: count + 1 }, (_, index) => index % count)] : [];
  }

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

const isConvex = (ring: readonly Vec2[]) => {
  const turns = ring.map((point, index) => {
    const [next, after] = [ring[(index + 1) % ring.length], ring[(index + 2) % ring.length]];
    return (next.x - point.x) * (after.y - next.y) - (next.y - point.y) * (after.x - next.x);
  });
  return turns.every((turn) => turn >= -1e-9) || turns.every((turn) => turn <= 1e-9);
};

// Every piece wound one way on screen, so the sides of one solid never cancel each other
// under the nonzero fill rule where they meet.
const wound = (points: Vec2[]) => (signedArea(points) < 0 ? [...points].reverse() : points);

/**
 * A convex floor outline stood up along y and shaded by facing, seen from above (a
 * positive pitch). Anything concave, an L or a U, is built from convex pieces: only
 * then is every edge it shows really in front.
 */
export function prism(ring: readonly Vec2[], { from, height, bevel = 0 }: Rise, camera: Camera): Solid {
  if (!isConvex(ring)) {
    throw new Error('prism: the outline must be convex; build a concave part from convex pieces');
  }

  const project = view(camera);
  const light = lightOf(camera);
  const count = ring.length;
  const normals = normalsOf(ring);
  const facing = facingOf(ring, camera);
  const top = ring.map(({ x, y }) => project(vec3(x, from + height, y)).at);
  const bottom = ring.map(({ x, y }) => project(vec3(x, from, y)).at);
  const along = (points: Vec2[], run: number[]) => run.map((index) => points[index]);
  const visible = runs(facing, true);
  const standing = height > 0;

  const side = (index: number) => {
    const next = (index + 1) % count;
    return wound([top[index], top[next], bottom[next], bottom[index]]);
  };

  // Inset along the bisector by enough to sit `bevel` from both edges it joins.
  const inset = (index: number) => {
    const [a, b] = [normals[(index + count - 1) % count], normals[index]];
    const [sx, sz] = [a.x + b.x, a.z + b.z];
    const reach = (2 * bevel) / Math.max(sx * sx + sz * sz, 1e-9);
    const { x, y } = ring[index];
    return project(vec3(x - sx * reach, from + height, y - sz * reach)).at;
  };

  const centre = ring.reduce((sum, { x, y }) => vec2(sum.x + x / count, sum.y + y / count), vec2(0, 0));

  return {
    fill: hull([...top, ...bottom]),
    sides: standing
      ? ring.flatMap((_, index) =>
          facing[index] ? [{ corners: side(index), tone: toneOf(normals[index], light) }] : [],
        )
      : [],
    top: wound(top),
    crease: visible.map((run) => along(top, run)),
    bevel:
      bevel > 0
        ? visible.map((run) => [top[run[0]], ...run.slice(1, -1).map(inset), top[run[run.length - 1]]])
        : [],
    silhouette: [
      ...runs(facing, false).map((run) => along(top, run)),
      ...(standing ? visible.map((run) => along(bottom, run)) : []),
      ...(standing
        ? ring.flatMap((_, index) =>
            facing[(index + count - 1) % count] !== facing[index] ? [[top[index], bottom[index]]] : [],
          )
        : []),
    ],
    depth: project(vec3(centre.x, from + height / 2, centre.y)).depth,
  };
}

/** A rounded box: 2 to 4 `steps` to a corner for small parts, 8 to 10 for large ones. */
export const box = (plan: Plan, rise: Rise, camera: Camera, steps = 8) =>
  prism(rounded(plan, steps), rise, camera);

/** A post, foot, puck or knob: 16 to 20 `steps` for small ones, 56 to 72 for wide discs. */
export const post = (centre: Vec2, radius: number, rise: Rise, camera: Camera, steps = 32) =>
  prism(circle(centre, radius, steps), rise, camera);
