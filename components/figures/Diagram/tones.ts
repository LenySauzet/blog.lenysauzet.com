/**
 * A figure's palette. The hues are fixed and the accent is deliberately absent:
 * in a diagram a colour means something, so one that turns with the reader's
 * preset would rename what it marks. The accent has a single hue anyway, where
 * a figure distinguishing four notions needs four.
 *
 * Only the hue is declared. A fill is that hue mixed toward the page, so it
 * lightens on a light page and darkens on a dark one from one definition, the
 * way `--heat-from` runs in both directions.
 *
 * The two neutrals are the page's own, which already flip.
 *
 * Convention rather than type, so a figure can say what it needs: `blue` traces
 * what is being followed, `orange` marks what the maths found. The rest are
 * free, and the caption is where a figure says what it made them mean.
 */
export const TONES = {
  blue: '[--tone:var(--color-figure-blue)]',
  green: '[--tone:var(--color-figure-green)]',
  yellow: '[--tone:var(--color-figure-yellow)]',
  orange: '[--tone:var(--color-figure-orange)]',
  cyan: '[--tone:var(--color-figure-cyan)]',
  purple: '[--tone:var(--color-figure-purple)]',
  red: '[--tone:var(--color-figure-red)]',
  /** The geometry a figure is drawn on. */
  structure: '[--tone:var(--muted-foreground)]',
  /** Construction: an axis, a radius, anything the reader is not meant to read. */
  guide: '[--tone:var(--border)]',
} as const;

export type Tone = keyof typeof TONES;
