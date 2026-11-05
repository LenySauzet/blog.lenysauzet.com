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

const toMatch = (result: SearchResult): PostMatch => ({
  slug: String(result.id),
  title: result.title,
  date: result.date,
  text: result.text,
  terms: result.terms,
});

const newestFirst = (a: PostMatch, b: PostMatch) => b.date.localeCompare(a.date);

export function searchPosts(
  index: MiniSearch<SearchDocument>,
  query: string
): PostMatch[] {
  if (query.trim()) return index.search(query, SEARCH_OPTIONS).map(toMatch);

  return index.search(MiniSearch.wildcard).map(toMatch).sort(newestFirst);
}
