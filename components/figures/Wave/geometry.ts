import { MEASURE, type Axis } from '@/components/figures/Diagram';
import { heightfield } from '@/lib/mesh';
import { vec2 } from '@/lib/vec2';
import { ISOMETRIC, vec3, type Camera } from '@/lib/vec3';

export const HEIGHT = 420;
export const FREQUENCY = { min: 0.5, max: 3, initial: 1.5 };
export const TURN = { min: -25, max: 25, initial: 0 };

const SAMPLES = [25, 25] as const;
const AMPLITUDE = 0.3;
const REACH = 1.35;

export const SHAPES = {
  plane: (frequency: number) => (x: number) =>
    AMPLITUDE * Math.sin(frequency * Math.PI * x),
  ripple: (frequency: number) => (x: number, z: number) =>
    AMPLITUDE * Math.cos(frequency * Math.PI * Math.hypot(x, z)),
};

export type Shape = keyof typeof SHAPES;

export const AXES: Axis[] = [
  { name: 'x', tip: vec3(REACH, 0, 0) },
  { name: 'y', tip: vec3(0, REACH * 0.6, 0) },
  { name: 'z', tip: vec3(0, 0, REACH) },
];

export const wave = (shape: Shape, frequency: number, turn: number) => ({
  grid: heightfield(SHAPES[shape](frequency), 1, SAMPLES),
  camera: {
    ...ISOMETRIC,
    yaw: ISOMETRIC.yaw + (turn * Math.PI) / 180,
    scale: 140,
    origin: vec2(MEASURE / 2, HEIGHT / 2),
  } satisfies Camera,
});
