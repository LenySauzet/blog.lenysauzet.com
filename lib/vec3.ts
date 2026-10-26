import { vec2, type Vec2 } from '@/lib/vec2';

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export const sub3 = (a: Vec3, b: Vec3): Vec3 =>
  vec3(a.x - b.x, a.y - b.y, a.z - b.z);

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

export const towardViewer = ({ yaw, pitch }: Camera) =>
  turnY(tilt(vec3(0, 0, 1), -pitch), -yaw);
