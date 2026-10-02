/**
 * Fades to a transparent `--background` rather than `transparent`, which
 * resolves to rgba(0,0,0,0) and would interpolate through black, drawing a grey
 * band across the gradient.
 *
 * `hold` is the share of the run that stays at full before the ramp begins. An
 * edge dissolving into a page wants none of it, reading as a wash otherwise; a
 * panel laid over a column wants exactly that wash.
 */

/** Alphas along the ramp. A pair is a straight line, which is what an edge
    dissolving into a page wants; more of them bend it, which is what a panel
    wants, a straight fall reading as a band with two edges rather than as a
    dissolve. */
export const LINEAR = [1, 0];
export const EASED = [1, 0.92, 0.74, 0.46, 0.2, 0.06, 0];

const ramp = (hold: number, curve: number[], at: (alpha: number) => string) =>
  curve
    .map((alpha, index) => {
      const through = index / (curve.length - 1);

      return `${at(alpha)} ${(hold + (100 - hold) * through).toFixed(2)}%`;
    })
    .join(', ');

export const fadeToBackground = (direction: string, hold = 0, curve = LINEAR) =>
  `linear-gradient(${direction}, var(--background) 0%, ${ramp(hold, curve, (alpha) => `oklch(from var(--background) l c h / ${alpha})`)})`;

export const blurRamp = (direction: string, hold = 0, curve = LINEAR) =>
  `linear-gradient(${direction}, black 0%, ${ramp(hold, curve, (alpha) => `rgb(0 0 0 / ${alpha})`)})`;
