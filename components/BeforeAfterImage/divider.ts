/** In pixels. */
export const MAX_PULL = 16;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// A quadratic's middle sits halfway to its control point, so the control mirrors the ends.
export function dividerPath(center: number, pull: number, width: number, height: number) {
  const edge = clamp(center - clamp(pull, -MAX_PULL, MAX_PULL), 0, width);
  return `M ${edge} 0 Q ${2 * center - edge} ${height / 2} ${edge} ${height}`;
}

export function afterRegion(divider: string, width: number, height: number) {
  return `${divider} L ${width} ${height} L ${width} 0 Z`;
}

/** `speed` in percent a second, `width` in pixels. */
export function pullFor(speed: number, width: number) {
  const pxPerMs = (speed * width) / 100 / 1000;
  return MAX_PULL * Math.tanh(pxPerMs / 1.2);
}

export interface LabelSpan {
  center: number;
  half: number;
}

export function labelOpacity(side: 'before' | 'after', x: number, { center, half }: LabelSpan) {
  const distance = side === 'before' ? x - center : center - x;
  return clamp(distance / (half + 16), 0, 1);
}
