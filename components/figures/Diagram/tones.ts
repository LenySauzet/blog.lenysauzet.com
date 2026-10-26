export const TONES = {
  ink: '[--tone:var(--primary)]',
  second: '[--tone:var(--figure-second)]',
  third: '[--tone:var(--figure-third)]',
  structure: '[--tone:var(--muted-foreground)]',
  guide:
    '[--tone:color-mix(in_oklab,var(--muted-foreground)_55%,var(--background))]',
} as const;

export type Tone = keyof typeof TONES;
