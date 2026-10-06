/** Fixed hues, never the accent: in a figure a colour names something, and one
    that turns with the reader's preset renames it. */
export const TONES = {
  blue: '[--tone:var(--color-figure-blue)]',
  green: '[--tone:var(--color-figure-green)]',
  yellow: '[--tone:var(--color-figure-yellow)]',
  orange: '[--tone:var(--color-figure-orange)]',
  cyan: '[--tone:var(--color-figure-cyan)]',
  purple: '[--tone:var(--color-figure-purple)]',
  red: '[--tone:var(--color-figure-red)]',
  structure: '[--tone:var(--muted-foreground)]',
  /** Not `--border`, which is the edge of a surface and reads 1.23 on the page. */
  guide:
    '[--tone:color-mix(in_oklab,var(--muted-foreground)_55%,var(--background))]',
} as const;

export type Tone = keyof typeof TONES;
