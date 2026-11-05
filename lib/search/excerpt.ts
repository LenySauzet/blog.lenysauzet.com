const SPAN = 150;

const LEAD = SPAN / 3;

export interface ExcerptSegment {
  text: string;
  match: boolean;
}

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Longest first, so a shorter term inside `halftone` cannot eat it.
const matcher = (terms: string[]) =>
  terms.length
    ? new RegExp(
        `(${[...terms].sort((a, b) => b.length - a.length).map(escape).join('|')})`,
        'gi'
      )
    : null;

const wordStart = (text: string, at: number) => {
  if (at <= 0) return 0;
  const space = text.indexOf(' ', at);
  return space === -1 ? at : space + 1;
};

const wordEnd = (text: string, at: number) => {
  if (at >= text.length) return text.length;
  const space = text.lastIndexOf(' ', at);
  return space === -1 ? at : space;
};

export function excerpt(
  text: string,
  terms: string[],
  span = SPAN
): ExcerptSegment[] {
  const pattern = matcher(terms);
  const found = pattern ? text.search(pattern) : -1;

  const start = wordStart(text, found === -1 ? 0 : Math.max(0, found - LEAD));
  const end = wordEnd(text, Math.min(text.length, start + span));

  const quote =
    (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');

  if (!pattern) return [{ text: quote, match: false }];

  // The capturing split alternates plain and match; drop empties only after, or parity breaks.
  return quote
    .split(pattern)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((segment) => segment.text !== '');
}
