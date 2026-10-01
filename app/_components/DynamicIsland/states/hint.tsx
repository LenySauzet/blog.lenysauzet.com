import type { IslandState } from '../types';

/**
 * Raised two ways for the same reason: ambient while the pointer rests on the
 * island, and transient a moment after a first load, so the palette is known
 * before anyone goes looking for it.
 *
 * Smaller than the states it covers, because it is an aside rather than a reading
 * of the page. One font, one weight, one colour, the modifier included: a key
 * picked out in a brighter tone reads as a button to press rather than as part of
 * the sentence. `leading-none` so the line box is the glyphs themselves and the
 * uniform inset actually centres them; Departure's own line box does not.
 *
 * The wording is keyless where there is no keyboard; the modifier itself is still
 * written ⌘ everywhere, as the palette's own shortcut column does.
 */
export const hint: IslandState = {
  id: 'hint',
  when: ({ hovered }) => hovered,
  render: () => (
    <span className="px-3 font-mono text-xs leading-none whitespace-nowrap text-muted-foreground/70">
      <span className="pointer-coarse:hidden">Press ⌘K to search</span>
      <span className="pointer-fine:hidden">Tap to search and more</span>
    </span>
  ),
};
