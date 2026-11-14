import type { Options, SearchOptions } from 'minisearch';

export interface SearchDocument {
  slug: string;
  title: string;
  description: string;
  /** Joined: MiniSearch tokenises a string and would take an array as one term. */
  tags: string;
  date: string;
  text: string;
}

export const INDEX_OPTIONS: Options<SearchDocument> = {
  idField: 'slug',
  fields: ['title', 'description', 'tags', 'text'],
  storeFields: ['title', 'date', 'text'],
};

export const SEARCH_OPTIONS: SearchOptions = {
  boost: { title: 4, tags: 3, description: 2 },
  prefix: true,
  /** Long enough to hide a typo, and never a word still being typed. */
  fuzzy: (term) => (term.length > 4 ? 0.2 : false),
  combineWith: 'AND',
};

export const SEARCH_INDEX_PATH = '/search-index.json';
