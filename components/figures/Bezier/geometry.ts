import { FADE_HOLD, LARGEST_TYPE, stack, type Placement } from '@/components/figures/Diagram';
import { vec2, type Vec2 } from '@/lib/vec2';

import { deCasteljau } from './de-casteljau';

export const HEIGHT = 370;
const CONTROL = [vec2(70, 290), vec2(150, 80), vec2(350, 80), vec2(430, 290)] as const;
export const T = { min: 0, max: 1, initial: 0.42 };
const COLUMN = 490;

const GAP = 1.5;
const PITCH = 1.6 * LARGEST_TYPE;
const BAND = HEIGHT * (1 - FADE_HOLD / 100) + LARGEST_TYPE;

type Cubic = readonly [Vec2, Vec2, Vec2, Vec2];

export function bezier(t: number) {
  const [control, first, second, [point]] = deCasteljau(CONTROL, t);
  const targets = [
    { name: '1st pass', at: first[2] },
    { name: '2nd pass', at: second[1] },
    { name: 'B(t)', at: point },
  ];
  const drawn: Cubic = [control[0], first[0], second[0], point];
  const rest: Cubic = [point, second[1], first[2], control[3]];
  const rows = stack(
    targets.map(({ at }) => at.y),
    PITCH,
    [BAND, HEIGHT - BAND],
  );

  return {
    control,
    first,
    second,
    point,
    drawn,
    rest,
    leaders: targets.map(({ name, at }, index) => ({
      name,
      target: at,
      label: vec2(COLUMN, rows[index]),
    })),
    labels: {
      P0: { at: control[0], offset: vec2(0, GAP) },
      P1: { at: control[1], offset: vec2(0, -GAP) },
      P2: { at: control[2], offset: vec2(0, -GAP) },
      P3: { at: control[3], offset: vec2(0, GAP) },
    } satisfies Record<string, Placement>,
  };
}
