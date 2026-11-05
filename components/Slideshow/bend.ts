/** In pixels. */
export const MAX_BEND = 16;

/** A share of the slide's width. */
export const PARALLAX = 0.2;

/** `velocity` in Embla's unit: pixels per step of its fixed loop. */
export function bendFor(velocity: number) {
  return MAX_BEND * Math.tanh(velocity / 24);
}

// A quadratic's middle sits halfway to its control point, hence the doubled bend.
export function slidePath(width: number, height: number, bend: number) {
  const middle = height / 2;
  return `M 0 0 L ${width} 0 Q ${width + 2 * bend} ${middle} ${width} ${height} L 0 ${height} Q ${2 * bend} ${middle} 0 0 Z`;
}

/** `distance` in slide-widths from the middle of the view. */
export function parallaxShift(distance: number, width: number) {
  return -Math.min(Math.max(distance, -1), 1) * PARALLAX * width;
}
