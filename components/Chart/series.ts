import type { ChartConfig } from '@/components/ui/chart';

/** The five chart tokens are shades of the accent, so a sixth series would
    repeat the first. Past five, name the colour in the series. */
export const TOKENS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export interface Named {
  key: string;
  label: string;
  color?: string;
}

export interface Resolved {
  key: string;
  label: string;
  color: string;
}

export const colourOf = ({ color }: Named, index: number) =>
  color ?? TOKENS[index % TOKENS.length];

/** Series and slices alike, each beside the colour it will paint with. */
export const resolve = (items: Named[]): Resolved[] =>
  items.map((item, index) => ({
    key: item.key,
    label: item.label,
    color: colourOf(item, index),
  }));

/** `ChartStyle` turns this into the `--color-<key>` each mark reads. */
export const configOf = (items: Resolved[]): ChartConfig =>
  Object.fromEntries(items.map(({ key, label, color }) => [key, { label, color }]));

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
