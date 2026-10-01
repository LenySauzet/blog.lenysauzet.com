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
}

export interface IslandState {
  id: string;
  width?: string;
  when?: (context: IslandContext) => boolean;
  render: (context: IslandContext) => ReactNode;
}
