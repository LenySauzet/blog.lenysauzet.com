import { MEASURE } from '@/components/figures/Diagram';
import { lerp, vec2 } from '@/lib/vec2';

export const HEIGHT = 240;
export const PERIOD = 4;
export const READOUT = vec2(MEASURE - 64, HEIGHT - 40);

const ENDS = [vec2(150, 160), vec2(522, 80)] as const;
const TRAVEL = 0.8;
const GAP = 1.5;

export const INITIAL = 0.73 * TRAVEL;

export const progress = (phase: number) => Math.min(1, phase / TRAVEL);

export function interpolation(phase: number) {
  const t = progress(phase);
  const [from, to] = ENDS;
  const point = lerp(from, to, t);

  return {
    t,
    from,
    to,
    point,
    labels: {
      P0: { at: from, offset: vec2(0, GAP) },
      P1: { at: to, offset: vec2(0, -GAP) },
    },
  };
}
