import { hull, signedArea } from '@/lib/polygon';
import { vec2, type Vec2 } from '@/lib/vec2';
import { basis, dot3, normalize3, towardViewer, vec3, view, type Camera, type Vec3 } from '@/lib/vec3';

import { circle, distinct, rounded, type Plan } from './outline';
import type { Lines } from './path';

/** From turned away from the light to facing it. */
export type Shade = 0 | 1 | 2 | 3;

export const SHADES = 4;

/**
 * A solid seen by one camera, every piece in screen units, painted in this order: fill,
 * sides, top, crease, bevel, silhouette.
 */
export interface Solid {
  /** The hull, in the page's colour, hiding what stands behind. */
  fill: Vec2[];
  /** Each wound the same way as `top`, so pieces of one solid never cancel where they meet. */
  sides: { corners: Vec2[]; shade: Shade }[];
  top: Vec2[];
  /** Where the top meets the sides the viewer sees. */
  crease: Lines;
  /** A highlight inset along the crease, tapering into the silhouette at its ends. */
  bevel: Lines;
  silhouette: Lines;
  /** Larger is nearer, measured half way up: what a painter sorts on. */
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
 * The light every solid is shaded by, level and from the viewer's left: fixed to the
 * camera, so a turned object keeps its shades where the eye expects them.
 */
function lightOf(camera: Camera): Vec3 {
  const { right } = basis(camera);
  return normalize3(vec3(-right.x, 0, -right.z));
}

// The light is square to the view, so a side facing it head-on is seen edge on; but a
// side a hair off that still counts as seen, and its cosine rounds to exactly 1.
const shadeOf = (normal: Vec3, light: Vec3) =>
  Math.min(SHADES - 1, Math.floor(((dot3(normal, light) + 1) / 2) * SHADES)) as Shade;

/** The outward normal of each edge of a floor outline, `i` to `i + 1`, whichever way it winds. */
function normalsOf(ring: readonly Vec2[]): Vec3[] {
  const outward = signedArea(ring) > 0 ? 1 : -1;
  return ring.map((point, index) => {
    const next = ring[(index + 1) % ring.length];
    return normalize3(vec3(outward * (next.y - point.y), 0, outward * (point.x - next.x)));
  });
}

/** Which edges of a floor outline face the viewer, given with repeated points dropped. */
export const facingOf = (ring: readonly Vec2[], camera: Camera) => {
  const toward = towardViewer(camera);
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

/**
 * Convex and simple: every turn the same way, none doubling back, and the turns adding up
 * to one turn exactly, which a star, winding round its centre more than once, never does.
 */
function isConvex(ring: readonly Vec2[]) {
  const turns = ring.map((point, index) => {
    const [next, after] = [ring[(index + 1) % ring.length], ring[(index + 2) % ring.length]];
    const [ax, ay, bx, by] = [next.x - point.x, next.y - point.y, after.x - next.x, after.y - next.y];
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  });
  const oneWay = turns.every((turn) => turn >= -1e-9) || turns.every((turn) => turn <= 1e-9);
  const total = turns.reduce((sum, turn) => sum + turn, 0);
  const forward = turns.every((turn) => Math.abs(turn) < Math.PI - 1e-9);
  return oneWay && forward && Math.abs(Math.abs(total) - 2 * Math.PI) < 1e-6;
}

const wound = (points: Vec2[]) => (signedArea(points) < 0 ? [...points].reverse() : points);

/**
 * A convex floor outline stood up along y and shaded by facing, seen from above. Anything
 * concave, an L or a U, is built from convex pieces: only then is every edge it shows
 * really in front.
 */
export function prism(outline: readonly Vec2[], { from, height, bevel = 0 }: Rise, camera: Camera): Solid {
  if (!(height >= 0)) throw new Error('prism: the height must not be negative');
  if (!(towardViewer(camera).y > 0)) throw new Error('prism: a solid is drawn seen from above');
  const ring = distinct(outline);
  if (!isConvex(ring)) {
    throw new Error('prism: the outline must be convex and simple; build a concave part from pieces');
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
  const centre = ring.reduce((sum, { x, y }) => vec2(sum.x + x / count, sum.y + y / count), vec2(0, 0));
  const depth = project(vec3(centre.x, from + height / 2, centre.y)).depth;

  // A plate with no height is all edge: no side to crease against, no bevel to catch light.
  if (height === 0) {
    return {
      fill: wound(top),
      sides: [],
      top: wound(top),
      crease: [],
      bevel: [],
      silhouette: [[...top, top[0]]],
      depth,
    };
  }

  const side = (index: number) => {
    const next = (index + 1) % count;
    return wound([top[index], top[next], bottom[next], bottom[index]]);
  };

  // Along the bisector by enough to sit `bevel` from both edges the corner joins.
  const bevelled = (index: number) => {
    const [a, b] = [normals[(index + count - 1) % count], normals[index]];
    const [sx, sz] = [a.x + b.x, a.z + b.z];
    const reach = (2 * bevel) / (sx * sx + sz * sz);
    const { x, y } = ring[index];
    return project(vec3(x - sx * reach, from + height, y - sz * reach)).at;
  };

  return {
    fill: hull([...top, ...bottom]),
    sides: ring.flatMap((_, index) =>
      facing[index] ? [{ corners: side(index), shade: shadeOf(normals[index], light) }] : [],
    ),
    top: wound(top),
    crease: visible.map((run) => along(top, run)),
    // A lone visible edge has no corner to inset, and its bevel would only retrace the crease.
    bevel:
      bevel > 0
        ? visible
            .filter((run) => run.length > 2)
            .map((run) => [top[run[0]], ...run.slice(1, -1).map(bevelled), top[run[run.length - 1]]])
        : [],
    silhouette: [
      ...runs(facing, false).map((run) => along(top, run)),
      ...visible.map((run) => along(bottom, run)),
      ...ring.flatMap((_, index) =>
        facing[(index + count - 1) % count] !== facing[index] ? [[top[index], bottom[index]]] : [],
      ),
    ],
    depth,
  };
}

/** A rounded block: 2 to 4 `steps` to a corner for small parts, 8 to 10 for large ones. */
export const block = (plan: Plan, rise: Rise, camera: Camera, steps = 8) =>
  prism(rounded(plan, steps), rise, camera);

/** A post, foot, puck or knob: 16 to 20 `steps` for small ones, 56 to 72 for wide discs. */
export const cylinder = (centre: Vec2, radius: number, rise: Rise, camera: Camera, steps = 32) =>
  prism(circle(centre, radius, steps), rise, camera);
