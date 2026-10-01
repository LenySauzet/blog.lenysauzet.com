const SPAN = 150;

/** A third in, so the matched word has a run-up rather than opening the quote. */
const LEAD = SPAN / 3;

export interface ExcerptSegment {
  text: string;
  match: boolean;
}

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Longest first, so `halftone` is not eaten by a shorter term inside it. The terms
 * are the document's words, not the query's: a prefix search for "moto" hands back
 * "motorcycle", which is what has to be found in the text.
 */
const matcher = (terms: string[]) =>
  terms.length
    ? new RegExp(
        `(${[...terms].sort((a, b) => b.length - a.length).map(escape).join('|')})`,
        'gi'
      )
    : null;

/** Snapped to a space, so a quote never opens or closes mid-word. */
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

  // A capturing split alternates plain, match, plain, so parity says which is which
  // and the pattern is never asked a second question. Empties go after the mapping,
  // or they take the parity with them.
  return quote
    .split(pattern)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((segment) => segment.text !== '');
}
