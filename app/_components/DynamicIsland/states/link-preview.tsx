import { HugeiconsIcon } from '@hugeicons/react';

import type { LinkPreview } from '@/lib/link-preview';

import type { IslandState } from '../types';

export const LINK_PREVIEW = 'link-preview';

export const linkPreview = ({ icon, label }: LinkPreview): IslandState => ({
  id: LINK_PREVIEW,
  render: () => (
    <div className="flex h-[1.875rem] w-full min-w-0 items-center gap-3 pl-1 pr-4">
      <span className="grid size-[1.875rem] shrink-0 place-items-center rounded-full bg-primary/10">
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-4 text-primary"
        />
      </span>
      <span className="min-w-0 truncate text-[0.95rem]">{label}</span>
    </div>
  ),
});
