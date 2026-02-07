'use client';

import { ScrambledText } from '@/components/ScrambledText';
import { useSplashScreenStore } from '@/hook/use-splashScreen-store';
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
  const isSplashVisible = useSplashScreenStore((s) => s.isVisible);

  const uniqueYears = [
    ...new Set(posts.map((post) => new Date(post.metadata.date).getFullYear())),
  ].sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {uniqueYears.map((year) => {
        const postsForYear = posts
          .map((post, i) => ({ ...post, flatIndex: i }))
          .filter(
            (post) => new Date(post.metadata.date).getFullYear() === year
          );

        return (
          <div className="flex flex-col gap-5" key={year}>
            <span className="text-sm uppercase font-mono">{year}</span>
            <ul>
              {postsForYear.map((post) => (
                <li key={post.slug} className="group cursor-pointer border-b">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="flex gap-2 justify-between items-center py-4 w-full group-hover:text-foreground transition-colors text-foreground/50"
                  >
                    <ScrambledText
                      disabled={isSplashVisible}
                      delay={0.5 + post.flatIndex * 0.1}
                      windowSize={7}
                      speed={1.75}
                    >
                      {post.metadata.title}
                    </ScrambledText>
                    <ScrambledText
                      disabled={isSplashVisible}
                      delay={0.5 + post.flatIndex * 0.05}
                      windowSize={7}
                      speed={0.8}
                      className="text-sm font-mono group-hover:text-foreground transition-colors text-foreground/50"
                    >
                      {format(
                        new Date(Date.parse(post.metadata.date)),
                        'MMM d'
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
  );
}
