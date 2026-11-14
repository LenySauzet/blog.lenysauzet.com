import type { ChartConfig } from '@/components/ui/chart';

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

export const resolve = (items: Named[]): Resolved[] =>
  items.map((item, index) => ({
    key: item.key,
    label: item.label,
    color: colourOf(item, index),
  }));

export const configOf = (items: Resolved[]): ChartConfig =>
  Object.fromEntries(items.map(({ key, label, color }) => [key, { label, color }]));

export const toggled = (
  hidden: ReadonlySet<string>,
  key: string,
  total: number
): ReadonlySet<string> => {
  const next = new Set(hidden);
  if (!next.delete(key)) next.add(key);
  return next.size === total ? hidden : next;
};
