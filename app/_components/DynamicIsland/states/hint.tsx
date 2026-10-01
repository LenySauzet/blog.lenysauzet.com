import type { IslandState } from '../types';

/**
 * Raised two ways for the same reason: ambient while the pointer rests on the
 * island, and transient a moment after a first load, so the palette is known
 * before anyone goes looking for it.
 *
 * Centred, and given no width of its own: the island holds the width of whatever
 * this covers, so pointing at it never makes it smaller. One font, one weight, one
 * colour, the modifier included: a key
 * picked out in a brighter tone reads as a button to press rather than as part of
 * the sentence. `leading-none` so the line box is the glyphs themselves and the
 * uniform inset actually centres them; Departure's own line box does not.
 *
 * Both ways in are named, and the one the pointer is already holding comes first:
 * the island is a button, and a line that offers only a shortcut reads as though
 * the shortcut were the only way. The wording is keyless where there is no
 * keyboard; the modifier itself is still written ⌘ everywhere, as the palette's own
 * shortcut column does.
 */
export const hint: IslandState = {
  id: 'hint',
  when: ({ hovered }) => hovered,
  render: () => (
    <span className="w-full px-3 text-center font-mono text-xs leading-none whitespace-nowrap text-muted-foreground/70">
      <span className="pointer-coarse:hidden">Click or ⌘K to search</span>
      <span className="pointer-fine:hidden">Tap to search</span>
    </span>
  ),
};
