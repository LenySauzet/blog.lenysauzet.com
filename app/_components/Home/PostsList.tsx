'use client';

import { format } from 'date-fns';
import Link from 'next/link';

import { ScrambledText } from '@/components/shared/ScrambledText';
import { postDate } from '@/lib/posts/post-date';

type Post = {
  slug: string;
  metadata: {
    title: string;
    date: string;
  };
};

export function PostsList({ posts }: { posts: Post[] }) {
  const uniqueYears = [
    ...new Set(posts.map((post) => postDate(post.metadata.date).getFullYear())),
  ].sort((a, b) => b - a);

  return (
    <div className="relative flex flex-col">

      <div className="pointer-events-none fixed top-0 right-0 left-0 z-10 h-8 lg:left-1/2 bg-linear-to-b from-background from-25% to-transparent" />
      <div
        className="pointer-events-none fixed top-0 right-0 left-0 z-20 h-40 lg:left-1/2 backdrop-blur-sm bg-background/40"
        style={{
          maskImage: 'linear-gradient(to bottom, black 25%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 25%, transparent 100%)',
        }}
      />

      <div className="pointer-events-none fixed bottom-0 right-0 left-0 z-10 h-8 lg:left-1/2 bg-linear-to-t from-background from-25% to-transparent" />
      <div
        className="pointer-events-none fixed bottom-0 right-0 left-0 z-20 h-40 lg:left-1/2 backdrop-blur-sm bg-background/40"
        style={{
          maskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to top, black 25%, transparent 100%)',
        }}
      />

      <div
        className="group/years flex min-h-dvh flex-col gap-8 pt-24 pb-32 sm:pb-28 lg:border-l"
      >
        {uniqueYears.map((year) => {
          const postsForYear = posts
            .map((post, i) => ({ ...post, flatIndex: i }))
            .filter(
              (post) => postDate(post.metadata.date).getFullYear() === year,
            );

          return (
            // Dims the rows not hovered, as un-dimming the hovered one loses to `:has()`; mouse only, as touch hover sticks.
            <div
              className="flex flex-col gap-4 px-8 transition-opacity duration-300 motion-reduce:transition-none lg:px-0 pointer-fine:group-has-[[data-year]:hover]/years:not-hover:opacity-40"
              data-year={year}
              key={year}
            >
              <span className="text-sm uppercase font-mono text-foreground/50 pl-0 lg:pl-4">
                {year}
              </span>
              <ul>
                {postsForYear.map((post) => (
                  <li
                    key={post.slug}
                    className="group cursor-pointer border-b lg:px-4"
                  >
                    <Link
                      href={`/posts/${post.slug}`}
                      className="flex gap-2 justify-between items-center py-4 w-full group-hover:text-foreground transition-colors text-foreground/50"
                    >
                      {/* The 180ms delay keeps the caret hidden a beat; a `backwards` fill mode would show it at once. */}
                      <ScrambledText
                        className="after:ml-1 after:content-['\_'] after:opacity-0 motion-safe:group-hover:after:animate-[terminal-caret_1.06s_step-end_infinite_180ms] motion-reduce:group-hover:after:opacity-100"
                        delay={post.flatIndex * 0.1}
                        windowSize={7}
                        speed={1.75}
                      >
                        {post.metadata.title}
                      </ScrambledText>
                      <ScrambledText
                        delay={post.flatIndex * 0.05}
                        windowSize={7}
                        speed={0.8}
                        className="text-sm font-mono group-hover:text-foreground transition-colors text-foreground/50"
                      >
                        {format(postDate(post.metadata.date), 'MMM d')}
                      </ScrambledText>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
