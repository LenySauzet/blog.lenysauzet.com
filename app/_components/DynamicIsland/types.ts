import type { ReactNode } from 'react';

/** What a post hands the island while it is being read. */
export interface IslandPost {
  title: string;
  /** The title cut for a surface this narrow. Falls back to `title`. */
  shortTitle?: string;
}

/** Everything a state is allowed to decide on. Anything else it takes from a hook. */
export interface IslandContext {
  pathname: string;
  hovered: boolean;
  post: IslandPost | null;
  /** Whether the reader has left the top of the page. */
  scrolled: boolean;
}

export interface IslandState {
  id: string;
  /**
   * What the island becomes. The state owns its layout: the island only owns the
   * container, so a state is free to be a line, a pill or a card.
   */
  render: (context: IslandContext) => ReactNode;
  /**
   * Absent means always, as in the command registry. The registry is ordered, so
   * the first state whose condition holds wins and the last one without a
   * condition is the fallback. No priority field: two ways to say the same thing
   * would eventually disagree.
   */
  when?: (context: IslandContext) => boolean;
}
