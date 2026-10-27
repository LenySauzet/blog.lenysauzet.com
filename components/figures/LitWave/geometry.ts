import { AMPLITUDE, ripple } from '@/components/figures/Wave/geometry';
import { basis, dot3, ISOMETRIC, vec3, type Vec3 } from '@/lib/vec3';

export const FREQUENCY = { min: 0.5, max: 3, initial: 1.5 };
export const LIGHT = { min: 0, max: 360, initial: 135 };
export const ASPECT = 4 / 3;
export const EXTENT = 1.75;

const ELEVATION = (50 * Math.PI) / 180;
const SAMPLES = 41;
const PHASES = 8;
const CAMERA = basis(ISOMETRIC);

const triple = ({ x, y, z }: Vec3) => [x, y, z];

const extent = (values: readonly number[]) =>
  values.reduce(([low, high], value) => [Math.min(low, value), Math.max(high, value)], [Infinity, -Infinity]);

export const light = (azimuth: number) => {
  const angle = (azimuth * Math.PI) / 180;

  return vec3(
    Math.cos(ELEVATION) * Math.cos(angle),
    Math.sin(ELEVATION),
    Math.cos(ELEVATION) * Math.sin(angle),
  );
};

export const outline = (frequency: number) => {
  const along = Array.from({ length: SAMPLES }, (_, i) => -1 + (2 * i) / (SAMPLES - 1));
  const points = Array.from({ length: PHASES }, (_, i) => ripple(frequency, (2 * Math.PI * i) / PHASES)).flatMap(
    (height) => along.flatMap((x) => along.map((z) => vec3(x, height(x, z), z))),
  );
  const [left, right] = extent(points.map((point) => dot3(point, CAMERA.right)));
  const [low, high] = extent(points.map((point) => dot3(point, CAMERA.up)));

  return { left, right, low, high, centre: (low + high) / 2 };
};

export const uniforms = (frequency: number, azimuth: number, normals: boolean) => ({
  uFrequency: frequency,
  uAmplitude: AMPLITUDE,
  uExtent: EXTENT,
  uCentre: outline(frequency).centre,
  uLight: triple(light(azimuth)),
  uRight: triple(CAMERA.right),
  uUp: triple(CAMERA.up),
  uToward: triple(CAMERA.toward),
  uNormals: normals ? 1 : 0,
});
