/**
 * Fades to a transparent `--background` rather than `transparent`, which
 * resolves to rgba(0,0,0,0) and would interpolate through black, drawing a grey
 * band across the gradient. Both ramps stay linear: any hold at the edge reads
 * as a wash over whatever is covered rather than a fade.
 */
export const fadeToBackground = (direction: string) =>
  `linear-gradient(${direction}, var(--background) 0%, oklch(from var(--background) l c h / 0) 100%)`;

export const blurRamp = (direction: string) =>
  `linear-gradient(${direction}, black 0%, transparent 100%)`;
