'use client';

import { File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format } from 'date-fns';
import type MiniSearch from 'minisearch';
import { useEffect, useMemo, useState } from 'react';

import { CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { postDate } from '@/lib/post-date';
import type { SearchDocument } from '@/lib/search/config';
import { excerpt } from '@/lib/search/excerpt';
import { loadSearchIndex } from '@/lib/search/load-index';
import { searchPosts } from '@/lib/search/query';

import { FadingList } from './FadingList';

type Index = MiniSearch<SearchDocument>;

interface PostSearchProps {
  query: string;
  /** Every row on show, so the palette can keep its selection on one. */
  onResults: (slugs: string[]) => void;
  onPick: (slug: string) => void;
}

export function PostSearch({ query, onResults, onPick }: PostSearchProps) {
  const [index, setIndex] = useState<Index | 'failed'>();

  useEffect(() => {
    let current = true;

    loadSearchIndex().then(
      (loaded) => current && setIndex(loaded),
      () => current && setIndex('failed')
    );

    return () => {
      current = false;
    };
  }, []);

  const results = useMemo(
    () => (index && index !== 'failed' ? searchPosts(index, query) : []),
    [index, query]
  );

  /**
   * cmdk moves its selection when its own search box changes, and nothing else:
   * arriving here and the index landing both fill the list without a keystroke.
   */
  useEffect(() => {
    onResults(results.map((result) => result.slug));
  }, [results, onResults]);

  return (
    <FadingList>
      {index === undefined && <CommandEmpty>Reading the archive...</CommandEmpty>}
      {index === 'failed' && (
        <CommandEmpty>The search index could not be loaded.</CommandEmpty>
      )}
      {index && index !== 'failed' && results.length === 0 && (
        <CommandEmpty>No post says anything about that.</CommandEmpty>
      )}

      {/* The heading only has a group to name when there is one: rendered
          unconditionally it sat over nothing while the archive loaded and
          under every message saying there was nothing to show. */}
      <CommandGroup heading={results.length ? 'Blog posts' : undefined}>
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
                {format(postDate(result.date), 'MMM d, yyyy')}
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
