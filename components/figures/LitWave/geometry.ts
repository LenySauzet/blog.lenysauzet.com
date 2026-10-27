import { AMPLITUDE, ripple } from '@/components/figures/Wave/geometry';
import { basis, dot3, ISOMETRIC, vec3 } from '@/lib/vec3';

export const FREQUENCY = { min: 0.5, max: 3, initial: 1.5 };
export const LIGHT = { min: 0, max: 360, initial: 135 };
export const ASPECT = 4 / 3;
export const EXTENT = 1.75;

const ELEVATION = (50 * Math.PI) / 180;
const SAMPLES = 41;
const CAMERA = basis(ISOMETRIC);

const triple = ({ x, y, z }: { x: number; y: number; z: number }) => [x, y, z];

export const light = (azimuth: number) => {
  const angle = (azimuth * Math.PI) / 180;

  return vec3(
    Math.cos(ELEVATION) * Math.cos(angle),
    Math.sin(ELEVATION),
    Math.cos(ELEVATION) * Math.sin(angle),
  );
};

export const outline = (frequency: number) => {
  const height = ripple(frequency);
  const along = Array.from({ length: SAMPLES }, (_, i) => -1 + (2 * i) / (SAMPLES - 1));
  const points = along.flatMap((x) => along.map((z) => vec3(x, height(x, z), z)));
  const across = points.map((point) => dot3(point, CAMERA.right));
  const rise = points.map((point) => dot3(point, CAMERA.up));
  const [left, right] = [Math.min(...across), Math.max(...across)];
  const [low, high] = [Math.min(...rise), Math.max(...rise)];

  return { left, right, low, high, centre: (low + high) / 2 };
};

export const uniforms = (frequency: number, azimuth: number) => ({
  uFrequency: frequency,
  uAmplitude: AMPLITUDE,
  uExtent: EXTENT,
  uCentre: outline(frequency).centre,
  uLight: triple(light(azimuth)),
  uRight: triple(CAMERA.right),
  uUp: triple(CAMERA.up),
  uToward: triple(CAMERA.toward),
});
