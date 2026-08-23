'use client';

import { ScrambledText } from '@/components/ScrambledText';
import { format } from 'date-fns';
import Link from 'next/link';

type Post = {
  slug: string;
  metadata: {
    title: string;
    date: string;
  };
};

export function PostsList({ posts }: { posts: Post[] }) {
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
        data-scroll-root
        className="group/years flex flex-col gap-8 pt-24 pb-32 sm:pb-28 flex-1 min-h-0 overflow-y-auto lg:border-l"
      >
        {uniqueYears.map((year) => {
          const postsForYear = posts
            .map((post, i) => ({ ...post, flatIndex: i }))
            .filter(
              (post) => new Date(post.metadata.date).getFullYear() === year,
            );

          return (
            // Dimmed by not being the hovered year, rather than by the hovered one
            // outranking a dim laid over everything: a `:has()` rule carries enough
            // specificity to win that fight and leave the year under the pointer faded
            // with the rest. `pointer-fine` because a touch hover sticks after a scroll.
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
                      {/* The caret holds its column whether or not it is showing, so
                          arriving costs no reflow. The delay is the animation's own:
                          with no fill mode the title keeps its resting state until
                          the first keyframe lands, which is what makes the caret
                          appear a beat after the pointer rather than with it. */}
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
                        {format(
                          new Date(Date.parse(post.metadata.date)),
                          'MMM d',
                        )}
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
