export interface Hue {
  id: string;
  label: string;
  /** Tailwind's own angle for that name, which every token derives from. */
  hue: number;
  /** Where the shipped lightness does not clear the contrast floor. */
  lightness?: number;
}

const BLUE: Hue = { id: 'blue', label: 'Blue', hue: 259.815, lightness: 0.61 };

export const DEFAULT_HUE = BLUE;

export const HUES: Hue[] = [
  { id: 'amber', label: 'Amber', hue: 70.08 },
  BLUE,
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

export const LIGHTNESS = 0.615;
export const CHROMA = 0.168;

export const STORAGE_KEY = 'hue';

export const hueOf = (id: string | null | undefined) =>
  HUES.find((candidate) => candidate.id === id) ?? DEFAULT_HUE;

export const propertiesOf = (hue: Hue) => ({
  '--base-hue': String(hue.hue),
  '--accent-l': String(hue.lightness ?? LIGHTNESS),
});

export const accentOf = (hue: Hue) =>
  `oklch(${hue.lightness ?? LIGHTNESS} ${CHROMA} ${hue.hue})`;
