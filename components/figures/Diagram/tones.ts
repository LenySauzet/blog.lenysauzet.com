export const TONES = {
  blue: '[--tone:var(--color-figure-blue)]',
  orange: '[--tone:var(--color-figure-orange)]',
  structure: '[--tone:var(--muted-foreground)]',
  guide:
    '[--tone:color-mix(in_oklab,var(--muted-foreground)_55%,var(--background))]',
} as const;

export type Tone = keyof typeof TONES;
