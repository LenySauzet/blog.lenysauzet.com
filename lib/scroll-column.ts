const SCROLL_ROOT = '[data-scroll-root]';

export const scrollColumn = () => document.querySelector<HTMLElement>(SCROLL_ROOT);

export const travelOf = (column: HTMLElement) =>
  column.scrollHeight - column.clientHeight;

export const headingsOf = (column: HTMLElement) =>
  [...column.querySelectorAll<HTMLElement>('[data-prose] > h2, [data-prose] > h3')];

const PIXELS_PER_LINE = 16;

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
