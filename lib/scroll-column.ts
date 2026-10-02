const SCROLL_ROOT = '[data-scroll-root]';

/** The page scrolls in a column of its own, not in `body`. */
export const scrollColumn = () => document.querySelector<HTMLElement>(SCROLL_ROOT);

export const travelOf = (column: HTMLElement) =>
  column.scrollHeight - column.clientHeight;

export const headingsOf = (column: HTMLElement) =>
  [...column.querySelectorAll<HTMLElement>('h2[id]')];

const PIXELS_PER_LINE = 16;

/** Chrome fixed over the column is a sibling of it, so a wheel landing there
    reaches nothing on its own. */
export function handOnWheel(event: React.WheelEvent) {
  const column = scrollColumn();
  if (!column) return;

  const step =
    event.deltaMode === 1
      ? PIXELS_PER_LINE
      : event.deltaMode === 2
        ? column.clientHeight
        : 1;

  column.scrollBy({ top: event.deltaY * step, behavior: 'auto' });
}
