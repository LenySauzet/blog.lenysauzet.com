import type { ReactNode } from 'react';

export interface IslandPost {
  title: string;
  shortTitle?: string;
}

export interface IslandContext {
  pathname: string;
  hovered: boolean;
  post: IslandPost | null;
  scrolled: boolean;
  finished: boolean;
}

export interface IslandState {
  id: string;
  width?: string;
  maxWidth?: string;
  /** The pill's own, in pixels, for a state that is not pill-shaped. */
  radius?: number;
  when?: (context: IslandContext) => boolean;
  render: (context: IslandContext) => ReactNode;
}
