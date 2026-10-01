import type { IslandState } from '../types';

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
