export interface Hue {
  id: string;
  label: string;
  /** The oklch angle every token in `app/globals.css` derives from. Taken from
      Tailwind's own palette, so the name is the colour it names. */
  hue: number;
  /**
   * The accent's lightness, where the shipped 0.615 does not hold. Only the
   * hue turns for the rest of the site; the accent carries a third of the
   * chroma of anything else and loses a third of its contrast on white across
   * the green and cyan arc. Measured per preset to clear both themes.
   */
  lightness?: number;
  /** Zero for the one preset that is not a colour. */
  chroma?: number;
}

/** Tailwind's hue for each name, so Blue is Tailwind's blue and not a violet
    that has been called one. Neutral first, then alphabetical: a list to find
    a name in rather than a wheel to turn. */
export const HUES: Hue[] = [
  { id: 'neutral', label: 'Neutral', hue: 0, lightness: 0.61, chroma: 0 },
  { id: 'amber', label: 'Amber', hue: 70.08 },
  { id: 'blue', label: 'Blue', hue: 259.815, lightness: 0.61 },
  { id: 'cyan', label: 'Cyan', hue: 215.221, lightness: 0.57 },
  { id: 'emerald', label: 'Emerald', hue: 162.48, lightness: 0.575 },
  { id: 'fuchsia', label: 'Fuchsia', hue: 322.15 },
  { id: 'green', label: 'Green', hue: 149.579, lightness: 0.59 },
  { id: 'indigo', label: 'Indigo', hue: 277.117 },
  { id: 'lime', label: 'Lime', hue: 130.85, lightness: 0.595 },
  { id: 'orange', label: 'Orange', hue: 47.604 },
  { id: 'pink', label: 'Pink', hue: 354.308 },
  { id: 'purple', label: 'Purple', hue: 303.9 },
  { id: 'red', label: 'Red', hue: 25.331 },
  { id: 'rose', label: 'Rose', hue: 16.439 },
  { id: 'sky', label: 'Sky', hue: 237.323, lightness: 0.595 },
  { id: 'teal', label: 'Teal', hue: 182.503, lightness: 0.565 },
  { id: 'violet', label: 'Violet', hue: 292.717 },
  { id: 'yellow', label: 'Yellow', hue: 86.047, lightness: 0.61 },
];

export const DEFAULT_HUE = HUES.find((hue) => hue.id === 'blue')!;

export const LIGHTNESS = 0.615;
export const CHROMA = 0.168;

export const STORAGE_KEY = 'hue';

export const hueOf = (id: string | null | undefined) =>
  HUES.find((candidate) => candidate.id === id) ?? DEFAULT_HUE;

/** What a preset writes on `<html>`, read by the store and by the script that
    paints before the first frame. */
export const propertiesOf = (hue: Hue) => ({
  '--base-hue': String(hue.hue),
  '--accent-l': String(hue.lightness ?? LIGHTNESS),
  '--accent-c': String(hue.chroma ?? CHROMA),
});

/** The accent a preset produces, which is what a swatch paints. */
export const accentOf = (hue: Hue) =>
  `oklch(${hue.lightness ?? LIGHTNESS} ${hue.chroma ?? CHROMA} ${hue.hue})`;
