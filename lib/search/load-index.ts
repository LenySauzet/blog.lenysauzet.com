import MiniSearch from 'minisearch';

import { INDEX_OPTIONS, SEARCH_INDEX_PATH, type SearchDocument } from './config';

/** Fetched once per page load, and dropped on failure so a retry is possible. */
let pending: Promise<MiniSearch<SearchDocument>> | null = null;

export function loadSearchIndex(): Promise<MiniSearch<SearchDocument>> {
  pending ??= fetch(SEARCH_INDEX_PATH)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`The search index answered ${response.status}.`);
      }
      return MiniSearch.loadJSON<SearchDocument>(
        await response.text(),
        INDEX_OPTIONS
      );
    })
    .catch((error) => {
      pending = null;
      throw error;
    });

  return pending;
}
