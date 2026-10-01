import Logo from '@/components/Logo';
import siteConfig from '@/config/site';

import type { IslandState } from '../types';

/**
 * The first name, and without its diacritic: at this size the accent rides into the
 * cap's inner edge and reads as a speck rather than as a letter.
 */
const [name] = siteConfig.authorName
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .split(' ');

/** The fallback: no condition, last in the registry. Who writes here. */
export const identity: IslandState = {
  id: 'identity',
  render: () => (
    // Anchored at both ends rather than huddled in the middle: the mark holds the
    // left cap, the name the right, and the gap between them is what makes the
    // island read as a bar rather than as a badge. Hence a width of its own, which
    // content alone would not give it.
    //
    // The row stands at the island's inner height so this state is no taller than
    // any other, and the mark is drawn small inside it. It is line work rather
    // than a disc, so at the full inner height it carries far more ink than a flat
    // avatar would and takes the eye off the name.
    <div className="flex h-[1.875rem] w-full min-w-[13rem] items-center justify-between pl-2 pr-4">
      <Logo className="size-5 shrink-0" />
      <span className="font-mono tracking-widest whitespace-nowrap text-muted-foreground">
        {name}
      </span>
    </div>
  ),
};
