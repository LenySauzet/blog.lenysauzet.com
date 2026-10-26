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

type Oklch = readonly [lightness: number, chroma: number, hue: number];

const CONTRASTS: { hue: number; light: Oklch; dark: Oklch }[] = [
  { hue: hueOf('orange').hue, light: [0.646, 0.222, 41.116], dark: [0.75, 0.183, 55.934] },
  { hue: hueOf('emerald').hue, light: [0.596, 0.145, 163.225], dark: [0.765, 0.177, 163.223] },
  { hue: hueOf('violet').hue, light: [0.541, 0.281, 293.009], dark: [0.702, 0.183, 293.541] },
];

export const arc = (a: number, b: number) => {
  const turn = Math.abs(a - b) % 360;
  return Math.min(turn, 360 - turn);
};

export const contrastOf = (hue: Hue) =>
  CONTRASTS.reduce((best, candidate) =>
    arc(candidate.hue, hue.hue) > arc(best.hue, hue.hue) ? candidate : best,
  );

const oklch = ([l, c, h]: Oklch) => `oklch(${l} ${c} ${h})`;

export const propertiesOf = (hue: Hue) => {
  const { light, dark } = contrastOf(hue);

  return {
    '--base-hue': String(hue.hue),
    '--accent-l': String(hue.lightness ?? LIGHTNESS),
    '--contrast-light': oklch(light),
    '--contrast-dark': oklch(dark),
  };
};

export const accentOf = (hue: Hue) =>
  `oklch(${hue.lightness ?? LIGHTNESS} ${CHROMA} ${hue.hue})`;
