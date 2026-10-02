/**
 * Fades to a transparent `--background` rather than `transparent`, which
 * resolves to rgba(0,0,0,0) and would interpolate through black, drawing a grey
 * band across the gradient.
 *
 * `hold` is how much of the run stays at full before the ramp begins. An edge
 * dissolving into a page wants none of it, reading as a wash otherwise; a panel
 * covering what is under it wants exactly that wash.
 */
export const fadeToBackground = (direction: string, hold = '0%') =>
  `linear-gradient(${direction}, var(--background) 0%, var(--background) ${hold}, oklch(from var(--background) l c h / 0) 100%)`;

export const blurRamp = (direction: string, hold = '0%') =>
  `linear-gradient(${direction}, black 0%, black ${hold}, transparent 100%)`;
