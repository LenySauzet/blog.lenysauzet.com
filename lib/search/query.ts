import MiniSearch, { type SearchResult } from 'minisearch';

import { SEARCH_OPTIONS, type SearchDocument } from './config';

export interface PostMatch {
  slug: string;
  title: string;
  date: string;
  text: string;
  /** The document's own words, which is what an excerpt marks. */
  terms: string[];
}

/** Stored fields come back untyped, so they are named here and nowhere else. */
const toMatch = (result: SearchResult): PostMatch => ({
  slug: String(result.id),
  title: result.title,
  date: result.date,
  text: result.text,
  terms: result.terms,
});

const newestFirst = (a: PostMatch, b: PostMatch) => b.date.localeCompare(a.date);

/**
 * Nothing typed lists every post, newest first, which is what the wildcard is for.
 * Keeping this out of the view leaves the engine testable without a DOM.
 */
export function searchPosts(
  index: MiniSearch<SearchDocument>,
  query: string
): PostMatch[] {
  if (query.trim()) return index.search(query, SEARCH_OPTIONS).map(toMatch);

  return index.search(MiniSearch.wildcard).map(toMatch).sort(newestFirst);
}
