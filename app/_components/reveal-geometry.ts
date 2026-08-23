// The panel is the viewport's full height and half its width, so a layer that has to
// outreach it takes the larger of the two. Sized off height alone, a panel wider than
// tall kept a corner the rim never covered. Square is also what makes the gradient
// below a circle, since a radius given as a percentage has no meaning for `circle`.
const SIDE_OF_HEIGHT = 2.4;
const SIDE_OF_WIDTH = 1.3;

export const SIDE = `max(${SIDE_OF_HEIGHT * 100}vh, ${SIDE_OF_WIDTH * 100}vw)`;

// Both a fraction of the side. The circle sits on the layer's own top left corner, so
// only the quarter arc reaching into the panel exists: centred inside, the far arcs
// would follow the sweep and cover what had just been revealed. That corner is where
// the gradient stops being painted, so the travel ends with it exactly on the panel's
// corner. A frame that let it inside drew a straight seam across the visual.
const RADIUS = 0.75;
export const TRAVEL = 0.55;

// Falloff, as a fraction of the radius. Widening it costs radius: every panel corner
// has to be inside this by the end, not merely inside the circle.
const CLEAR = 0.75;

export const percent = (fraction: number) => `${fraction * 100}%`;

export const WASH =
  `radial-gradient(${percent(RADIUS)} ${percent(RADIUS)} at 0% 0%, ` +
  `transparent 0%, transparent ${percent(CLEAR)}, ` +
  `oklch(from var(--background) l c h / 0.35) 87%, var(--background) 100%)`;

// Even the whole way. Shaping it either way was worse: accelerating, the rim arrived
// at nearly its top speed and stopped dead. At constant speed the stop lands after the
// rim has left the panel, so nothing on screen is left to see it happen.
export const SWEEP_SECONDS = 1.15;

// Outlasts the sweep, so it is the last to finish and owns the unmount. Pulling focus
// in step with the rim resolved the panel before the eye had settled on it.
export const DEFOCUS_SECONDS = 1.95;

/** What the constants above have to satisfy, whatever shape the panel takes. */
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
