import { Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

import { useIslandStore } from '@/hooks/use-island-store';

import type { IslandState } from '../types';

/** Long enough to read six words, short enough not to hold the island hostage. */
const DWELL = 2600;

/**
 * One id for every announcement, and that is the queueing policy: the store renews
 * a state raised twice, so a second announcement covers the first rather than
 * waiting behind it. A queue would make the island owe a backlog, and the reader
 * who copies a link twice is telling it the same thing twice.
 */
const ID = 'announcement';

/**
 * What a command says when it has done something. The island is the site's only
 * notification surface, so this is the whole of that contract: a sentence, and the
 * icon of whatever raised it.
 */
export function announce(message: string, icon: IconSvgElement = Tick02Icon) {
  const state: IslandState = {
    id: ID,
    render: () => (
      <div className="flex w-full items-center justify-center gap-2 px-3">
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-4 shrink-0 text-primary"
        />
        <span className="truncate text-sm">{message}</span>
      </div>
    ),
  };

  useIslandStore.getState().present(state, { ttl: DWELL });
}
