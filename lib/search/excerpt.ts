/** How much of the post a result quotes, in characters. */
const WINDOW = 150;

/** Where the match sits in that window: a third in, so the sentence has a run-up. */
const LEAD = WINDOW / 3;

export interface ExcerptSegment {
  text: string;
  /** A term the search matched, for the renderer to lift out of the sentence. */
  match: boolean;
}

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The matched terms come from MiniSearch as the *document's* words, not the query's:
 * a prefix search for "moto" hands back "motorcycle", which is what has to be found
 * in the text and marked.
 */
const matcher = (terms: string[]) =>
  terms.length
    ? new RegExp(
        `(${[...terms]
          .sort((a, b) => b.length - a.length)
          .map(escape)
          .join('|')})`,
        'gi'
      )
    : null;

/** Snaps to the nearest space so a quote never opens or closes mid-word. */
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
  window = WINDOW
): ExcerptSegment[] {
  const pattern = matcher(terms);
  const found = pattern ? text.search(pattern) : -1;

  const start = wordStart(text, found === -1 ? 0 : Math.max(0, found - LEAD));
  const end = wordEnd(text, Math.min(text.length, start + window));

  const quote =
    (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');

  if (!pattern) return [{ text: quote, match: false }];

  // A capturing split alternates plain, match, plain, so parity says which is which
  // and the pattern is never asked a second question. Empty pieces go afterwards, or
  // the parity they carry goes with them.
  return quote
    .split(pattern)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((segment) => segment.text !== '');
}
