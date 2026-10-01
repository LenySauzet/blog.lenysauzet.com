'use client';

import { scrollProgress } from '@/hooks/use-scroll-tracking';

import { ProgressRing } from '../ProgressRing';
import type { IslandPost, IslandState } from '../types';

function Reading({ post }: { post: IslandPost }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-4">
      <ProgressRing progress={scrollProgress} />
      <span className="min-w-0 truncate pr-3 text-[0.95rem]">
        {post.shortTitle ?? post.title}
      </span>
    </div>
  );
}

export const reading: IslandState = {
  id: 'reading',
  when: ({ post, scrolled }) => post !== null && scrolled,
  render: ({ post }) => post && <Reading post={post} />,
};
