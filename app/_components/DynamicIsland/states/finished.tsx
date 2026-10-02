import { Coffee01Icon } from '@hugeicons/core-free-icons';

import { Mark } from '../Mark';
import type { IslandState } from '../types';

export const finished: IslandState = {
  id: 'finished',
  when: ({ post, finished }) => post !== null && finished,
  render: () => (
    <div className="flex h-[1.875rem] w-full items-center gap-3 pl-1 pr-4">
      <Mark icon={Coffee01Icon} tone="success" />
      <span className="truncate text-[0.95rem]">Support me</span>
    </div>
  ),
};
