'use client';

import { File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format } from 'date-fns';
import type MiniSearch from 'minisearch';
import { useEffect, useMemo, useState } from 'react';

import {
  CommandEmpty,
  CommandGroup,
  CommandHint,
  CommandItem,
} from '@/components/ui/command';
import { postDate } from '@/lib/post-date';
import type { PostSummary } from '@/lib/post-utils';
import type { SearchDocument } from '@/lib/search/config';
import { excerpt } from '@/lib/search/excerpt';
import { loadSearchIndex } from '@/lib/search/load-index';
import { searchPosts, type PostMatch } from '@/lib/search/query';

import { FadingList } from './FadingList';

type Index = MiniSearch<SearchDocument>;

const listed = (post: PostSummary): PostMatch => ({
  slug: post.slug,
  title: post.title,
  date: post.date,
  text: post.description,
  terms: [],
});

interface PostSearchProps {
  posts: PostSummary[];
  query: string;
  onResults: (slugs: string[]) => void;
  onPick: (slug: string) => void;
}

export function PostSearch({ posts, query, onResults, onPick }: PostSearchProps) {
  const [index, setIndex] = useState<Index | 'failed'>();
  const asked = query.trim();
  const searching = asked.length > 0;

  useEffect(() => {
    if (!searching) return;

    let current = true;

    loadSearchIndex().then(
      (loaded) => current && setIndex(loaded),
      () => current && setIndex('failed')
    );

    return () => {
      current = false;
    };
  }, [searching]);

  const results = useMemo(() => {
    if (!asked) return posts.map(listed);
    if (index === 'failed') return [];
    if (!index) {
      const wanted = asked.toLowerCase();

      return posts
        .filter((post) => `${post.title} ${post.description}`.toLowerCase().includes(wanted))
        .map(listed);
    }

    return searchPosts(index, asked);
  }, [index, asked, posts]);

  useEffect(() => {
    onResults(results.map((result) => result.slug));
  }, [results, onResults]);

  return (
    <FadingList>
      {results.length === 0 && (
        <CommandEmpty>
          {index === 'failed'
            ? 'The search index could not be loaded.'
            : 'No post says anything about that.'}
        </CommandEmpty>
      )}

      {/* Only with rows to name, or it sits over the loading and empty messages. */}
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
              <CommandHint className="shrink-0 pl-4 text-xs">
                {format(postDate(result.date), 'MMM d, yyyy')}
              </CommandHint>
            </div>

            <p className="line-clamp-2 pl-8 text-sm font-normal text-muted-foreground/70">
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
