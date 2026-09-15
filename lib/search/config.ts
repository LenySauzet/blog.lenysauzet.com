import type { Options, SearchOptions } from 'minisearch';

/** A post flattened to what the index matches on and what a result has to show. */
export interface SearchDocument {
  slug: string;
  title: string;
  description: string;
  /** Joined: MiniSearch tokenises a string, and would take an array as one term. */
  tags: string;
  date: string;
  text: string;
}

/**
 * Shared by the build and the browser on purpose. `loadJSON` reads a serialized
 * index against the options it is handed rather than the ones it was built with, so
 * the two drifting apart does not fail loudly, it just stops matching.
 *
 * Only what a result row draws is stored, and the slug is not among it: `idField`
 * already carries it back. `text` is stored as well as indexed because a result
 * quotes the line it matched, which is the whole of what the payload buys over a
 * title-only index.
 */
export const INDEX_OPTIONS: Options<SearchDocument> = {
  idField: 'slug',
  fields: ['title', 'description', 'tags', 'text'],
  storeFields: ['title', 'date', 'text'],
};

export const SEARCH_OPTIONS: SearchOptions = {
  // A title match is what the reader was after; a body match is where it turned up.
  boost: { title: 4, tags: 3, description: 2 },
  prefix: true,
  // A typo is only worth guessing at once a word is long enough to hide one, and
  // never on a word still being typed.
  fuzzy: (term) => (term.length > 4 ? 0.2 : false),
  // Every word has to land somewhere: typing more should narrow, not widen.
  combineWith: 'AND',
};

/** Written at build time, fetched once, the first time anyone searches. */
export const SEARCH_INDEX_PATH = '/search-index.json';
