/** The five chart tokens are shades of the accent, so a sixth series would
    repeat the first. Past five, name the colour in the series. */
export const TOKENS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

/** Takes anything that may name a colour, since a slice and a series both can. */
export const colourOf = ({ color }: { color?: string }, index: number) =>
  color ?? TOKENS[index % TOKENS.length];

/**
 * Switching the last visible series off leaves an empty plot, which reads as a
 * broken figure rather than as a choice, so the set is handed back unchanged.
 */
export const toggled = (
  hidden: ReadonlySet<string>,
  key: string,
  total: number
): ReadonlySet<string> => {
  const next = new Set(hidden);
  if (!next.delete(key)) next.add(key);
  return next.size === total ? hidden : next;
};

const COMBINERS = {
  sum: (values: number[]) => values.reduce((a, b) => a + b, 0),
  max: (values: number[]) => Math.max(...values),
  min: (values: number[]) => Math.min(...values),
  mean: (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length,
} as const;

/** Rounded to two places, since a float's tail is noise in a readout. */
export const combine = (
  how: keyof typeof COMBINERS,
  values: number[],
  ceiling?: number
): number => {
  if (!values.length) return 0;
  const raw = COMBINERS[how](values);
  return +Math.min(raw, ceiling ?? Infinity).toFixed(2);
};

/**
 * Adds colours the way light adds, which is what a chart summing channels
 * needs: red and blue give magenta, all three give white. CSS cannot do it,
 * `color-mix` interpolating rather than adding, so the browser resolves each
 * colour for us through a one-pixel canvas and the channels are summed here.
 *
 * Returns undefined before a canvas exists, which is the server and the first
 * paint; the caller falls back until then.
 */
export const additive = (colours: string[]): string | undefined => {
  if (typeof document === 'undefined' || !colours.length) return undefined;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return undefined;

  const total = [0, 0, 0];
  for (const colour of colours) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    total[0] += r;
    total[1] += g;
    total[2] += b;
  }

  return `rgb(${total.map((c) => Math.min(255, Math.round(c))).join(' ')})`;
};
