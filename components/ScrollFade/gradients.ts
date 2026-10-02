/** Alphas along a ramp. A pair is a straight line, which is what an edge
    dissolving into a page wants; more of them bend it, which is what a panel
    laid over a column wants, a straight fall reading as a band with two edges
    rather than as a dissolve. */
const LINEAR = [1, 0];
export const EASED = [1, 0.92, 0.74, 0.46, 0.2, 0.06, 0];

/** `hold` is the share of the run that stays at full before the ramp begins. */
const ramp = (hold: number, curve: number[], at: (alpha: number) => string) =>
  curve
    .map((alpha, index) => {
      const through = index / (curve.length - 1);

      return `${at(alpha)} ${(hold + (100 - hold) * through).toFixed(2)}%`;
    })
    .join(', ');

/**
 * Fades to a transparent `--background` rather than `transparent`, which
 * resolves to rgba(0,0,0,0) and would interpolate through black, drawing a grey
 * band across the gradient.
 *
 * A colour ramp painted this way bands over a surface of its own colour, so a
 * layer that has to stay invisible there takes `blurRamp` as a mask instead.
 */
export const fadeToBackground = (direction: string) =>
  `linear-gradient(${direction}, var(--background) 0%, ${ramp(0, LINEAR, (alpha) => `oklch(from var(--background) l c h / ${alpha})`)})`;

export const blurRamp = (direction: string, hold = 0, curve = LINEAR) =>
  `linear-gradient(${direction}, black 0%, ${ramp(hold, curve, (alpha) => `rgb(0 0 0 / ${alpha})`)})`;
