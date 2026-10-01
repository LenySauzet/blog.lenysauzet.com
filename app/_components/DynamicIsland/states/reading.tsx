'use client';

import type { IslandPost, IslandState } from '../types';
import { ProgressRing } from '../ProgressRing';
import { useScrollProgress } from '../use-scroll-progress';

/**
 * A component rather than markup returned inline: the state owns where its data
 * comes from as well as its layout, so the island's context stays the three things
 * every state needs rather than the union of what any one of them wants.
 */
function Reading({ post }: { post: IslandPost }) {
  const progress = useScrollProgress();

  return (
    <div className="flex items-center gap-3 pr-1">
      <ProgressRing progress={progress} />
      <span className="max-w-[16ch] truncate text-sm font-medium sm:max-w-[28ch]">
        {post.shortTitle ?? post.title}
      </span>
    </div>
  );
}

/** Where the reader is, and how much of it is left. */
export const reading: IslandState = {
  id: 'reading',
  when: ({ post }) => post !== null,
  render: ({ post }) => (post ? <Reading post={post} /> : null),
};
