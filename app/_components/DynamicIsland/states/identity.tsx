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
    // The mark is drawn small for its box. It is line work rather than a disc, so
    // at the inner height it carries far more ink than a flat avatar would and
    // takes the eye off the name; the row is given the height instead.
    <div className="flex h-8 w-full min-w-[13rem] items-center justify-between pl-2 pr-4">
      <Logo className="size-5 shrink-0" />
      <span className="text-base font-semibold whitespace-nowrap">{name}</span>
    </div>
  ),
};
