import { vec2, type Vec2 } from '@/lib/vec2';

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export const add3 = (a: Vec3, b: Vec3): Vec3 =>
  vec3(a.x + b.x, a.y + b.y, a.z + b.z);

export const sub3 = (a: Vec3, b: Vec3): Vec3 =>
  vec3(a.x - b.x, a.y - b.y, a.z - b.z);

export const scale3 = (v: Vec3, k: number): Vec3 =>
  vec3(v.x * k, v.y * k, v.z * k);

export const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vec3, b: Vec3): Vec3 =>
  vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

export const normalize3 = (v: Vec3): Vec3 => {
  const len = Math.sqrt(dot3(v, v));
  return len === 0 ? v : vec3(v.x / len, v.y / len, v.z / len);
};

const turnY = ({ x, y, z }: Vec3, angle: number) =>
  vec3(x * Math.cos(angle) + z * Math.sin(angle), y, z * Math.cos(angle) - x * Math.sin(angle));

const tilt = ({ x, y, z }: Vec3, angle: number) =>
  vec3(x, y * Math.cos(angle) - z * Math.sin(angle), y * Math.sin(angle) + z * Math.cos(angle));

export interface Camera {
  yaw: number;
  pitch: number;
  scale: number;
  origin: Vec2;
}

export const ISOMETRIC = { yaw: -Math.PI / 4, pitch: Math.atan(1 / Math.SQRT2) };

export const view = ({ yaw, pitch, scale, origin }: Camera) => (point: Vec3) => {
  const seen = tilt(turnY(point, yaw), pitch);

  return {
    at: vec2(origin.x + seen.x * scale, origin.y - seen.y * scale),
    depth: seen.z,
  };
};

export const basis = ({ yaw, pitch }: Pick<Camera, 'yaw' | 'pitch'>) => {
  const world = (v: Vec3) => turnY(tilt(v, -pitch), -yaw);

  return {
    right: world(vec3(1, 0, 0)),
    up: world(vec3(0, 1, 0)),
    toward: world(vec3(0, 0, 1)),
  };
};

export const towardViewer = (camera: Camera) => basis(camera).toward;

export interface Frame {
  width: number;
  height: number;
  /** Room kept clear on every side, in viewBox units. */
  pad: number;
}

/** The camera at this angle that centres every point in the frame, as large as it fits. */
export function fit(
  points: readonly Vec3[],
  angle: Pick<Camera, 'yaw' | 'pitch'>,
  { width, height, pad }: Frame,
): Camera {
  const flat = points.map((point) => view({ ...angle, scale: 1, origin: vec2(0, 0) })(point).at);
  const [xs, ys] = [flat.map(({ x }) => x), flat.map(({ y }) => y)];
  const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  if (!(right > left || bottom > top)) throw new Error('fit: the points must span some width or height');
  const scale = Math.min((width - 2 * pad) / (right - left), (height - 2 * pad) / (bottom - top));

  return {
    ...angle,
    scale,
    origin: vec2(width / 2 - ((left + right) / 2) * scale, height / 2 - ((top + bottom) / 2) * scale),
  };
}
