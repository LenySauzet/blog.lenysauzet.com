export const MAX_STEPS = 5;

export interface StepWindow {
  start: number;
  end: number;
}

export function stepWindow(count: number, active: number): StepWindow {
  const size = Math.min(count, MAX_STEPS);
  const start = Math.min(Math.max(active - Math.floor(size / 2), 0), count - size);
  return { start, end: start + size };
}

export function isEdge(index: number, count: number, { start, end }: StepWindow) {
  return (index === start && start > 0) || (index === end - 1 && end < count);
}

export function stepTarget(index: number, count: number, loop: boolean) {
  return loop ? ((index % count) + count) % count : Math.min(Math.max(index, 0), count - 1);
}

export function isNear(index: number, selected: number, count: number, loop: boolean) {
  const apart = Math.abs(index - selected);
  return (loop ? Math.min(apart, count - apart) : apart) <= 1;
}
