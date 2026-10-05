/** The five chart tokens are shades of the accent, so a sixth series would
    repeat the first. Past five, name the colour in the series. */
export const TOKENS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
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
  total: number,
): ReadonlySet<string> => {
  const next = new Set(hidden);
  if (!next.delete(key)) next.add(key);
  return next.size === total ? hidden : next;
};
