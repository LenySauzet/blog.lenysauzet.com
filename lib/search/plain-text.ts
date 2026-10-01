/**
 * MDX reduced to the prose a reader sees: what the index should match and what an
 * excerpt should quote. Searching "const" must not surface every post with a code
 * block.
 *
 * Order matters. Fenced code before inline code, whole JSX blocks before loose
 * tags, or a stripped fragment leaves a marker the next rule reads as prose.
 */
const RULES: [RegExp, string][] = [
  [/^export const metadata = \{[\s\S]*?^\};?$/m, ''],
  [/^(?:import|export)\s.*$/gm, ''],
  [/```[\s\S]*?```/g, ''],
  [/\$\$[\s\S]*?\$\$/g, ''],
  /** Inline math holds no space against its delimiters; `$5 and $10` is money. */
  [/\$(?!\s)[^$\n]*[^\s$]\$/g, ''],
  /** `[^>]` crosses lines, which a component with a prop per line needs. */
  [/<[A-Z][^>]*\/>/g, ''],
  [/<\/?[A-Za-z][^>]*>/g, ''],
  /** Images before links: one character apart, and an alt is not prose. */
  [/!\[[^\]]*\]\([^)]*\)/g, ''],
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'],
  [/^#{1,6}\s+/gm, ''],
  [/^\s*>\s?/gm, ''],
  [/^\s*(?:[-*+]|\d+\.)\s+/gm, ''],
  [/^\s*\|.*\|\s*$/gm, ''],
  [/^\s*(?:[-*_]\s*){3,}$/gm, ''],
  [/[*_~`]/g, ''],
];

export function toPlainText(source: string): string {
  const stripped = RULES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    source
  );

  return stripped.replace(/\s+/g, ' ').trim();
}
