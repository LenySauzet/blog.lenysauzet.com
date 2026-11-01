/** How far, in pixels, the seam between two moving slides bows at its middle. */
export const MAX_BEND = 16;

/** How much slower than its frame a slide's image travels, as a share of the slide. */
export const PARALLAX = 0.06;

/**
 * The bow for a track moving at `velocity`, Embla's own unit (pixels per step of its
 * fixed loop): signed with the motion, so the middle of the seam leads and its ends
 * trail; a slow glide barely bends, a fling saturates at MAX_BEND.
 */
export function bendFor(velocity: number) {
  return MAX_BEND * Math.tanh(velocity / 24);
}

/**
 * A slide's outline, its left and right edges each one arc over the full height,
 * pinned at the corners and bowed by `bend` at mid-height. Both edges move alike, so
 * one slide's right edge is exactly its neighbour's left and the seam stays whole.
 * A quadratic's middle sits halfway to its control point, hence the doubled bend.
 */
export function slidePath(width: number, height: number, bend: number) {
  const middle = height / 2;
  return `M 0 0 L ${width} 0 Q ${width + 2 * bend} ${middle} ${width} ${height} L 0 ${height} Q ${2 * bend} ${middle} 0 0 Z`;
}

/**
 * Where a slide's image sits inside its frame, for a slide `distance` slide-widths
 * from the middle of the view: it lags its frame by PARALLAX, so it reads as further
 * away. Beyond a slide-width it is out of view and stays at the most it ever moves.
 */
export function parallaxShift(distance: number, width: number) {
  return -Math.min(Math.max(distance, -1), 1) * PARALLAX * width;
}
