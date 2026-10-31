import type { CSSProperties } from 'react';

const TONES = {
  ink: 'var(--primary)',
  'ink-soft': 'color-mix(in oklab, var(--primary) 45%, var(--background))',
  page: 'var(--background)',
  well: 'color-mix(in oklab, var(--foreground) 3%, var(--background))',
  second: 'var(--figure-second)',
  third: 'var(--figure-third)',
  structure: 'var(--muted-foreground)',
  guide: 'var(--figure-guide)',
} as const;

export type Tone = keyof typeof TONES;

export const paint = (fill: Tone, edge: Tone = fill) =>
  ({ '--fill': TONES[fill], '--edge': TONES[edge] }) as CSSProperties;
