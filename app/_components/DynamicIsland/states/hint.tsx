import type { IslandState } from '../types';

/**
 * Raised two ways for the same reason: ambient while the pointer rests on the
 * island, and transient a moment after a first load, so the palette is known
 * before anyone goes looking for it.
 *
 * One font, one weight, one colour, the modifier included: a key picked out in a
 * brighter tone reads as a button to press rather than as part of the sentence.
 * The wording is keyless where there is no keyboard; the modifier itself is still
 * written ⌘ everywhere, as the palette's own shortcut column does.
 */
export const hint: IslandState = {
  id: 'hint',
  when: ({ hovered }) => hovered,
  render: () => (
    <span className="px-4 font-mono text-sm whitespace-nowrap text-muted-foreground/70">
      <span className="pointer-coarse:hidden">Press ⌘K to search</span>
      <span className="pointer-fine:hidden">Tap to search and more</span>
    </span>
  ),
};
