export interface Hue {
  id: string;
  label: string;
  /** The oklch angle every token in `app/globals.css` derives from. */
  hue: number;
}

/**
 * Four angles, not four moods: chroma and lightness are fixed per token, so a
 * preset can only rotate. The arc is narrower than the circle because of it,
 * and `hues.test.ts` holds the reason.
 */
export const HUES: Hue[] = [
  { id: 'violet', label: 'Violet', hue: 262.04 },
  { id: 'magenta', label: 'Magenta', hue: 330 },
  { id: 'ember', label: 'Ember', hue: 20 },
  { id: 'amber', label: 'Amber', hue: 55 },
];

export const DEFAULT_HUE = HUES[0];

export const STORAGE_KEY = 'hue';

export const hueOf = (id: string | null | undefined) =>
  (HUES.find((candidate) => candidate.id === id) ?? DEFAULT_HUE).hue;
