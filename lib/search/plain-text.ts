/**
 * MDX reduced to the prose a reader actually sees, which is both what the index
 * should match on and what an excerpt should quote. Anything that renders as
 * furniture rather than as a sentence is dropped: a search for "const" should not
 * surface every post carrying a code block.
 *
 * Order matters. Fenced code goes before inline code, and whole JSX blocks before
 * the loose tags, or a stripped fragment leaves a fence marker behind that the next
 * rule then reads as prose.
 */

// Not a parser: a tag whose props contain a bare `>` outruns this, and none here
// do. `[^>]` already crosses lines, which is what a component with a prop per line
// needs.
const JSX_SELF_CLOSING = /<[A-Z][^>]*\/>/g;
const JSX_TAG = /<\/?[A-Za-z][^>]*>/g;

const RULES: [RegExp, string][] = [
  // JS export frontmatter: metadata, not copy.
  [/^export const metadata = \{[\s\S]*?^\};?$/m, ''],
  [/^(?:import|export)\s.*$/gm, ''],
  [/```[\s\S]*?```/g, ''],
  [/\$\$[\s\S]*?\$\$/g, ''],
  [/\$[^$\n]+\$/g, ''],
  [JSX_SELF_CLOSING, ''],
  [JSX_TAG, ''],
  // Images before links: the syntax differs by one character, and an alt read as
  // prose puts a caption in the middle of a sentence.
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
