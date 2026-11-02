/** Past this many, the row of steps becomes a window that follows the active one. */
export const MAX_STEPS = 5;

export interface StepWindow {
  start: number;
  end: number;
}

/** The steps on show: up to `visible` of them, the active one as central as the ends allow. */
export function stepWindow(count: number, active: number, visible = MAX_STEPS): StepWindow {
  const size = Math.max(0, Math.min(count, visible));
  const start = Math.min(Math.max(active - Math.floor(size / 2), 0), count - size);
  return { start, end: start + size };
}

/**
 * A step at the window's edge with more beyond it is drawn smaller: the row goes on.
 * Never the active one, which the window keeps off an edge unless nothing lies past it.
 */
export function isEdge(index: number, count: number, { start, end }: StepWindow) {
  return (index === start && start > 0) || (index === end - 1 && end < count);
}

/** Where a move to `index` lands: round the ends when the slideshow loops, held at them when not. */
export function stepTarget(index: number, count: number, loop: boolean) {
  return loop ? ((index % count) + count) % count : Math.min(Math.max(index, 0), count - 1);
}

/** Whether a slide is next to the selected one, counting round the ends when it loops. */
export function isNear(index: number, selected: number, count: number, loop: boolean) {
  const apart = Math.abs(index - selected);
  return (loop ? Math.min(apart, count - apart) : apart) <= 1;
}
