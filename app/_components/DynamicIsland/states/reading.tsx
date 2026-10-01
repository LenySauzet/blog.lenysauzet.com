'use client';

import type { IslandPost, IslandState } from '../types';
import { ProgressRing } from '../ProgressRing';
import { scrollProgress } from '../scroll';

/**
 * A component rather than markup returned inline: the state owns where its data
 * comes from as well as its layout, so the island's context stays what resolution
 * needs rather than the union of what any one state wants to draw.
 */
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

/**
 * Where the reader is, and how much of it is left. Only once they have started:
 * at the top of an article there is no progress to report, so the island
 * introduces the site instead and gets out of the way as soon as it is useful.
 */
export const reading: IslandState = {
  id: 'reading',
  when: ({ post, scrolled }) => post !== null && scrolled,
  render: ({ post }) => (post ? <Reading post={post} /> : null),
};
