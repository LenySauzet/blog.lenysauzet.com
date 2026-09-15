import MiniSearch from 'minisearch';

import {
  INDEX_OPTIONS,
  SEARCH_INDEX_PATH,
  type SearchDocument,
} from './config';

/**
 * Held at module scope so the index is fetched and parsed once per page load
 * however many times the palette is opened. Dropped again if it fails, so a
 * search that hit a cold network can be retried rather than being stuck.
 */
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
