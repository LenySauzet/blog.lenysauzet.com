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
