import type { IslandState } from '../types';

/**
 * Raised two ways for the same reason: ambient while the pointer rests on the
 * island, and transient a moment after a first load, so the palette is known
 * before anyone goes looking for it.
 *
 * The wording is keyless where there is no keyboard. The modifier itself is still
 * written ⌘ on every platform, as the palette's own shortcut column does; reading
 * the platform is a separate concern and both should be fixed together.
 */
export const hint: IslandState = {
  id: 'hint',
  when: ({ hovered }) => hovered,
  render: () => (
    <span className="px-1 text-sm whitespace-nowrap text-muted-foreground">
      <span className="pointer-coarse:hidden">
        Press <kbd className="font-mono text-foreground">⌘K</kbd> to search
      </span>
      <span className="pointer-fine:hidden">Tap to search and more</span>
    </span>
  ),
};
