'use client';

import { ScrambledText } from '@/components/ScrambledText';
import { format } from 'date-fns';
import { useInView } from 'motion/react';
import Link from 'next/link';
import { useRef, type RefObject } from 'react';

type Post = {
  slug: string;
  metadata: {
    title: string;
    date: string;
  };
};

// Staggered by position in the year rather than in the whole list, so a row that
// scrolls into view after fifty others still starts promptly.
const STAGGER = 0.06;
const MAX_STAGGER = 0.6;

function PostRow({
  post,
  index,
  scrollRoot,
}: {
  post: Post;
  index: number;
  scrollRoot: RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInView(ref, { once: true, root: scrollRoot, amount: 0.5 });
  const delay = Math.min(index * STAGGER, MAX_STAGGER);

  return (
    <li ref={ref} className="group cursor-pointer border-b lg:px-4">
      <Link
        href={`/posts/${post.slug}`}
        className="flex gap-2 justify-between items-center py-4 w-full group-hover:text-foreground transition-colors text-foreground/50"
      >
        {/* Held blank until seen, so the decode happens where it can be watched. */}
        <ScrambledText disabled={!seen} delay={delay} windowSize={7} speed={1.75}>
          {post.metadata.title}
        </ScrambledText>
        <ScrambledText
          disabled={!seen}
          delay={delay}
          windowSize={7}
          speed={0.8}
          className="text-sm font-mono group-hover:text-foreground transition-colors text-foreground/50"
        >
          {format(new Date(Date.parse(post.metadata.date)), 'MMM d')}
        </ScrambledText>
      </Link>
    </li>
  );
}

export function PostsList({ posts }: { posts: Post[] }) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  const uniqueYears = [
    ...new Set(posts.map((post) => new Date(post.metadata.date).getFullYear())),
  ].sort((a, b) => b - a);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">

      <div className="pointer-events-none absolute top-0 inset-x-0 z-10 h-8 bg-linear-to-b from-background from-25% to-transparent" />
      <div
        className="pointer-events-none absolute top-0 inset-x-0 z-20 h-40 backdrop-blur-sm bg-background/40"
        style={{
          maskImage: 'linear-gradient(to bottom, black 25%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 25%, transparent 100%)',
        }}
      />

      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-10 h-8 bg-linear-to-t from-background from-25% to-transparent" />
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 z-20 h-40 backdrop-blur-sm bg-background/40"
        style={{
          maskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to top, black 25%, transparent 100%)',
        }}
      />

      <div
        ref={scrollRoot}
        className="flex flex-col gap-8 pt-24 pb-32 sm:pb-28 flex-1 min-h-0 overflow-y-auto lg:border-l"
      >
        {uniqueYears.map((year) => {
          const postsForYear = posts.filter(
            (post) => new Date(post.metadata.date).getFullYear() === year,
          );

          return (
            <div className="flex flex-col gap-4 px-8 lg:px-0" key={year}>
              <span className="text-sm uppercase font-mono text-foreground/50 pl-0 lg:pl-4">
                {year}
              </span>
              <ul>
                {postsForYear.map((post, index) => (
                  <PostRow
                    key={post.slug}
                    post={post}
                    index={index}
                    scrollRoot={scrollRoot}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
