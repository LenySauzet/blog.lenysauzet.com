/** How far, in pixels, the seam between two moving slides bows at its middle. */
export const MAX_BEND = 16;

/**
 * The bow for a track moving at `velocity`, Embla's own unit (pixels per step of its
 * fixed loop): signed with the motion, so the middle of the seam leads and its ends
 * trail; a slow glide barely bends, a fling saturates at MAX_BEND.
 */
export function bendFor(velocity: number) {
  return MAX_BEND * Math.tanh(velocity / 24);
}

/**
 * A slide's outline, its left and right edges bowed by the same `bend` at mid-height.
 * Both edges move alike, so one slide's right edge is exactly its neighbour's left
 * and the seam stays whole; a slide's image bleeds MAX_BEND past each side to fill a
 * bulge.
 */
export function slidePath(width: number, height: number, bend: number) {
  const quarter = height * 0.25;
  const middle = height * 0.5;
  const threeQuarters = height * 0.75;
  const right = width + bend;
  return [
    `M 0 0 L ${width} 0`,
    `C ${width} ${quarter} ${right} ${quarter} ${right} ${middle}`,
    `C ${right} ${threeQuarters} ${width} ${threeQuarters} ${width} ${height}`,
    `L 0 ${height}`,
    `C 0 ${threeQuarters} ${bend} ${threeQuarters} ${bend} ${middle}`,
    `C ${bend} ${quarter} 0 ${quarter} 0 0 Z`,
  ].join(' ');
}
