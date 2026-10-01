'use client';

import { scrollProgress } from '@/hooks/use-scroll-tracking';

import { ProgressRing } from '../ProgressRing';
import type { IslandState } from '../types';

export const finished: IslandState = {
  id: 'finished',
  when: ({ post, finished }) => post !== null && finished,
  render: () => (
    <div className="flex w-full min-w-0 items-center gap-4">
      <ProgressRing progress={scrollProgress} />
      <span className="truncate pr-3 text-[0.95rem]">What next?</span>
    </div>
  ),
};
