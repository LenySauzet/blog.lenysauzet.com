import { MEASURE, type Placement } from '@/components/figures/Diagram';
import { faces, heightfield, lambert, silhouette } from '@/lib/mesh';
import { normalize, sub, vec2, type Vec2 } from '@/lib/vec2';
import {
  dot3,
  ISOMETRIC,
  normalize3,
  scale3,
  towardViewer,
  vec3,
  view,
  type Vec3,
} from '@/lib/vec3';

export const HEIGHT = 400;
export const FREQUENCY = { min: 0.5, max: 3, initial: 1.5 };
export const TURN = { min: -25, max: 25, initial: 0 };

const SAMPLES = [25, 25] as const;
const AXIS_STEPS = 24;
const HALF = 1;
const AMPLITUDE = 0.3;
const AXIS = 1.4;
const LIGHT = normalize3(vec3(-0.4, 1, 0.5));
const LIT = { floor: 0.08, range: 0.5, underside: 0.04 };

export type Piece = { depth: number } & (
  | { kind: 'tile'; corners: Vec2[]; shade: number }
  | { kind: 'edge' | 'axis' | 'arrow'; from: Vec2; to: Vec2 }
  | { kind: 'vertex'; at: Vec2 }
);

export function wave(frequency: number, turn: number) {
  const camera = {
    ...ISOMETRIC,
    yaw: ISOMETRIC.yaw + (turn * Math.PI) / 180,
    scale: 150,
    origin: vec2(MEASURE / 2, HEIGHT / 2),
  };
  const project = view(camera);
  const toward = towardViewer(camera);
  const grid = heightfield((x) => AMPLITUDE * Math.sin(frequency * Math.PI * x), HALF, SAMPLES);
  const depthOf = (points: readonly Vec3[]) =>
    points.reduce((sum, point) => sum + project(point).depth, 0) / points.length;

  const tiles: Piece[] = faces(grid)
    .flat()
    .map((face) => ({
      kind: 'tile',
      corners: face.corners.map((corner) => project(corner).at),
      shade:
        dot3(face.normal, toward) > 0
          ? LIT.floor + LIT.range * lambert(face, LIGHT)
          : LIT.underside,
      depth: depthOf(face.corners),
    }));
  const edges: Piece[] = silhouette(grid, toward).map(([a, b]) => ({
    kind: 'edge',
    from: project(a).at,
    to: project(b).at,
    depth: depthOf([a, b]) + 1e-3,
  }));

  const vertices: Piece[] = grid.flat().map((point) => ({
    kind: 'vertex',
    at: project(point).at,
    depth: project(point).depth + 2e-3,
  }));

  const tips = [
    ['x', vec3(AXIS, 0, 0)],
    ['y', vec3(0, AXIS * 0.6, 0)],
    ['z', vec3(0, 0, AXIS)],
  ] as const;
  const axes: Piece[] = tips.flatMap(([, tip]) =>
    Array.from({ length: AXIS_STEPS }, (_, step) => {
      const [a, b] = [step, step + 1].map((k) => scale3(tip, k / AXIS_STEPS));
      return {
        kind: step === AXIS_STEPS - 1 ? 'arrow' : 'axis',
        from: project(a).at,
        to: project(b).at,
        depth: depthOf([a, b]),
      };
    }),
  );
  const origin = project(vec3(0, 0, 0)).at;

  return {
    pieces: [...tiles, ...edges, ...vertices, ...axes].sort((a, b) => a.depth - b.depth),
    names: tips.map(([name, tip]) => {
      const at = project(tip).at;
      return {
        name,
        label: { at, offset: normalize(sub(at, origin)) } satisfies Placement,
      };
    }),
  };
}
