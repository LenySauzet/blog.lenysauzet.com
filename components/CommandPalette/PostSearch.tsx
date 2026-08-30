'use client';

import { File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format } from 'date-fns';
import MiniSearch, { type SearchResult } from 'minisearch';
import { useEffect, useMemo, useState } from 'react';

import { CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { excerpt } from '@/lib/search/excerpt';
import { loadSearchIndex } from '@/lib/search/load-index';
import { SEARCH_OPTIONS, type SearchDocument } from '@/lib/search/config';

import { FadingList } from './FadingList';

/** What a row draws. The stored fields come back untyped, so they are named once. */
interface Result {
  slug: string;
  title: string;
  date: string;
  text: string;
  /** The document's own words that matched, which is what an excerpt marks. */
  terms: string[];
}

const toResult = (match: SearchResult): Result => ({
  slug: String(match.id),
  title: match.title,
  date: match.date,
  text: match.text,
  terms: match.terms,
});

/** Newest first, the order the index page uses. */
const byDate = (a: Result, b: Result) => b.date.localeCompare(a.date);

export function PostSearch({
  query,
  onResults,
  onPick,
}: {
  query: string;
  onResults: (slugs: string[]) => void;
  onPick: (slug: string) => void;
}) {
  const [index, setIndex] = useState<MiniSearch<SearchDocument> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;

    loadSearchIndex().then(
      (loaded) => current && setIndex(loaded),
      () => current && setFailed(true)
    );

    return () => {
      current = false;
    };
  }, []);

  const results = useMemo<Result[]>(() => {
    if (!index) return [];

    if (query.trim()) return index.search(query, SEARCH_OPTIONS).map(toResult);

    // The wildcard is how MiniSearch hands back every document: with nothing typed
    // the page is a list of the posts, not an empty surface waiting to be used.
    return index.search(MiniSearch.wildcard).map(toResult).sort(byDate);
  }, [index, query]);

  /**
   * cmdk moves its selection when its own search changes, which is not the only
   * thing that changes these rows: arriving on the page, and the index landing, both
   * fill the list without a keystroke, and left alone the first row is unselected
   * and Enter answers nothing.
   */
  useEffect(() => {
    onResults(results.map((result) => result.slug));
  }, [results, onResults]);

  if (failed) {
    return (
      <FadingList>
        <CommandEmpty>The search index could not be loaded.</CommandEmpty>
      </FadingList>
    );
  }

  if (!index) {
    return (
      <FadingList>
        <CommandEmpty>Reading the archive...</CommandEmpty>
      </FadingList>
    );
  }

  return (
    <FadingList>
      {results.length === 0 ? (
        <CommandEmpty>No post says anything about that.</CommandEmpty>
      ) : null}

      <CommandGroup heading="Blog posts">
        {results.map((result) => (
          <CommandItem
            key={result.slug}
            value={result.slug}
            onSelect={() => onPick(result.slug)}
            className="h-auto flex-col items-start gap-1 py-2.5"
          >
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
              <span className="truncate">{result.title}</span>
              <span className="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">
                {format(new Date(Date.parse(result.date)), 'MMM d, yyyy')}
              </span>
            </div>

            {/* The line it was found on, rather than the description every result
                would otherwise repeat. */}
            <p className="line-clamp-2 pl-8 text-sm text-muted-foreground/70">
              {excerpt(result.text, result.terms).map((segment, position) => (
                <span
                  key={position}
                  className={segment.match ? 'text-primary' : undefined}
                >
                  {segment.text}
                </span>
              ))}
            </p>
          </CommandItem>
        ))}
      </CommandGroup>
    </FadingList>
  );
}
