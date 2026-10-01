import Logo from '@/components/Logo';
import siteConfig from '@/config/site';

import type { IslandState } from '../types';

/**
 * Without its diacritic on purpose: at this size the accent rides into the cap's
 * inner edge and reads as a speck rather than as a letter.
 */
const name = siteConfig.authorName.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** The fallback: no condition, last in the registry. Who writes here. */
export const identity: IslandState = {
  id: 'identity',
  render: () => (
    // Anchored at both ends rather than huddled in the middle: the mark holds the
    // left cap, the name holds the right, and the gap between them is what makes
    // the island read as a bar rather than as a badge. Hence a width of its own,
    // which content alone would not give it.
    <div className="flex w-full min-w-[13rem] items-center justify-between">
      <Logo className="size-6 shrink-0" />
      <span className="pr-4 text-[0.95rem] font-semibold whitespace-nowrap">{name}</span>
    </div>
  ),
};
