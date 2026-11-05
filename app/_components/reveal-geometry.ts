// Square, off both axes: sized off height alone, a wide panel kept a corner uncovered.
const SIDE_OF_HEIGHT = 2.4;
const SIDE_OF_WIDTH = 1.3;

export const SIDE = `max(${SIDE_OF_HEIGHT * 100}vh, ${SIDE_OF_WIDTH * 100}vw)`;

// Fractions of the side. Centred on the layer's corner, or the far arcs re-cover the panel.
const RADIUS = 0.75;
export const TRAVEL = 0.55;

// A fraction of the radius: every panel corner must end inside it, not just the circle.
const CLEAR = 0.75;

export const percent = (fraction: number) => `${fraction * 100}%`;

export const WASH =
  `radial-gradient(${percent(RADIUS)} ${percent(RADIUS)} at 0% 0%, ` +
  `transparent 0%, transparent ${percent(CLEAR)}, ` +
  `oklch(from var(--background) l c h / 0.35) 87%, var(--background) 100%)`;

// Run linear: eased, the rim stops dead on screen instead of after leaving it.
export const SWEEP_SECONDS = 1.15;

// Outlasts the sweep, so it owns the unmount.
export const DEFOCUS_SECONDS = 1.95;

export function revealGeometry(panelWidth: number, panelHeight: number) {
  const side = Math.max(SIDE_OF_HEIGHT * panelHeight, SIDE_OF_WIDTH * 2 * panelWidth);
  const radius = RADIUS * side;
  const start = TRAVEL * side;

  return {
    coversPanel: side - start >= Math.max(panelWidth, panelHeight),
    hiddenAtStart: Math.hypot(start, start) >= radius,
    clearAtEnd: Math.hypot(panelWidth, panelHeight) <= CLEAR * radius,
  };
}
