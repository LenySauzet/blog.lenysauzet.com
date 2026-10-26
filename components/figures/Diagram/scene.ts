import { faces, silhouette, type Grid } from '@/lib/mesh';
import { normalize, sub, type Vec2 } from '@/lib/vec2';
import {
  scale3,
  towardViewer,
  vec3,
  view,
  type Camera,
  type Vec3,
} from '@/lib/vec3';

import type { Placement } from './primitives';

export interface Axis {
  name: string;
  tip: Vec3;
}

export type Piece = { id: string; depth: number } & (
  | { kind: 'face'; corners: Vec2[] }
  | { kind: 'silhouette' | 'axis' | 'arrow'; from: Vec2; to: Vec2 }
  | { kind: 'vertex'; at: Vec2 }
);

const AXIS_STEPS = 24;

export const paintOrder = (a: Piece, b: Piece) =>
  Math.round((a.depth - b.depth) * 1e6) || a.id.localeCompare(b.id);

export function scene(grid: Grid, camera: Camera, axes: readonly Axis[] = []) {
  const project = view(camera);
  const depths = (points: readonly Vec3[]) => points.map((point) => project(point).depth);
  const mean = (points: readonly Vec3[]) =>
    depths(points).reduce((sum, depth) => sum + depth, 0) / points.length;
  const nearest = (points: readonly Vec3[]) => Math.max(...depths(points));
  const edge = (a: Vec3, b: Vec3) => ({
    from: project(a).at,
    to: project(b).at,
    depth: mean([a, b]),
  });

  const mesh = faces(grid).flat();
  const cell = Math.max(
    ...mesh.map(({ corners }) => nearest(corners) - Math.min(...depths(corners))),
  );

  const surface: Piece[] = mesh.map((face, index) => ({
    id: `face${index}`,
    kind: 'face',
    corners: face.corners.map((corner) => project(corner).at),
    depth: mean(face.corners),
  }));
  const outline: Piece[] = silhouette(grid, towardViewer(camera)).map(([a, b]) => ({
    id: `silhouette${a.x},${a.z},${b.x},${b.z}`,
    kind: 'silhouette',
    ...edge(a, b),
    depth: nearest([a, b]) + cell,
  }));
  const vertices: Piece[] = grid.flat().map((point, index) => ({
    id: `vertex${index}`,
    kind: 'vertex',
    at: project(point).at,
    depth: project(point).depth + 2 * cell,
  }));
  const lines: Piece[] = axes.flatMap(({ name, tip }) =>
    Array.from({ length: 2 * AXIS_STEPS }, (_, step) => {
      const along = (k: number) => scale3(tip, k / AXIS_STEPS - 1);
      const outward = step === 0 || step === 2 * AXIS_STEPS - 1;
      const [a, b] = step === 0 ? [along(1), along(0)] : [along(step), along(step + 1)];

      return { id: `${name}${step}`, kind: outward ? 'arrow' : 'axis', ...edge(a, b) };
    }),
  );

  const origin = project(vec3(0, 0, 0)).at;

  return {
    pieces: [...surface, ...outline, ...vertices, ...lines].sort(paintOrder),
    names: axes.map(({ name, tip }) => {
      const at = project(tip).at;
      return {
        name,
        label: { at, offset: normalize(sub(at, origin)) } satisfies Placement,
      };
    }),
  };
}
