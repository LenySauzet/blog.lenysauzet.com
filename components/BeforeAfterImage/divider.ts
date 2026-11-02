/** How far, in pixels, a fast move bows the divider's ends behind its middle. */
export const MAX_PULL = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * The divider as an SVG path through `center` at mid-height. A pull bows it in one arc
 * over the full height, as the Slideshow's seam bows: the ends trail behind the middle
 * by up to MAX_PULL, staying inside the image. A quadratic's middle sits halfway to its
 * control point, which is why the control is the middle's mirror of the ends.
 */
export function dividerPath(center: number, pull: number, width: number, height: number) {
  const edge = clamp(center - clamp(pull, -MAX_PULL, MAX_PULL), 0, width);
  return `M ${edge} 0 Q ${2 * center - edge} ${height / 2} ${edge} ${height}`;
}

/** The region right of the divider, where the after image shows. */
export function afterRegion(divider: string, width: number, height: number) {
  return `${divider} L ${width} ${height} L ${width} 0 Z`;
}

/**
 * The pull for a divider moving at `speed` percent a second across `width` px: a
 * slow one barely flexes, a fast one saturates at MAX_PULL.
 */
export function pullFor(speed: number, width: number) {
  const pxPerMs = (speed * width) / 100 / 1000;
  return MAX_PULL * Math.tanh(pxPerMs / 1.2);
}

export interface LabelSpan {
  center: number;
  half: number;
}

/**
 * A label's opacity with the divider at `x`: whole while the divider is clear of it,
 * gone once the divider has crossed its centre, fading over its half-width plus 16px.
 * Before sits left and fades as the divider comes left; after, the reverse.
 */
export function labelOpacity(side: 'before' | 'after', x: number, { center, half }: LabelSpan) {
  const distance = side === 'before' ? x - center : center - x;
  return clamp(distance / (half + 16), 0, 1);
}
