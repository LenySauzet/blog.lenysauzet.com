import { vec2, type Vec2 } from '@/lib/vec2';

export function stack(
  targets: readonly number[],
  pitch: number,
  [top, bottom]: readonly [number, number],
) {
  const order = targets
    .map((target, index) => ({ target, index }))
    .sort((a, b) => a.target - b.target);
  const placed = [...targets];

  let previous = -Infinity;
  for (const { target, index } of order) {
    previous = placed[index] = Math.max(target, previous + pitch, top);
  }

  let next = Infinity;
  for (const { index } of order.toReversed()) {
    next = placed[index] = Math.min(placed[index], next - pitch, bottom);
  }

  return placed;
}

const KNEE = 24;
export const LEADER_GAP = 0.5;

export function leaderPath(target: Vec2, label: Vec2): Vec2[] {
  const toward = Math.sign(target.x - label.x);
  const knee = vec2(target.x - toward * KNEE, label.y);

  return Math.abs(label.y - target.y) < 0.5
    ? [label, target]
    : [label, knee, target];
}
