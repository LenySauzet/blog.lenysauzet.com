import { Coffee01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import type { IslandState } from '../types';

export const finished: IslandState = {
  id: 'finished',
  when: ({ post, finished }) => post !== null && finished,
  render: () => (
    <div className="flex h-[1.875rem] w-full items-center gap-3 pl-1 pr-4">
      <span className="grid size-[1.875rem] shrink-0 place-items-center rounded-full bg-success/10">
        <HugeiconsIcon icon={Coffee01Icon} strokeWidth={2} className="size-4 text-success" />
      </span>
      <span className="truncate text-[0.95rem]">Support me</span>
    </div>
  ),
};
