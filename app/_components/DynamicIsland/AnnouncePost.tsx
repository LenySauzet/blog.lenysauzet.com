'use client';

import { useEffect } from 'react';

import { useIslandStore } from '@/hooks/use-island-store';

import type { IslandPost } from './types';

/**
 * Renders nothing: a post announcing itself to the island, which lives in the root
 * layout and only knows the path. Cleared on unmount, so leaving an article takes
 * the reading state with it rather than leaving a stale title on the index.
 *
 * The same door a transient state comes through, which is the point: a component
 * anywhere can tell the island something without the island knowing it exists.
 */
export function AnnouncePost({ title, shortTitle }: IslandPost) {
  useEffect(() => {
    useIslandStore.getState().setPost({ title, shortTitle });
    return () => useIslandStore.getState().setPost(null);
  }, [title, shortTitle]);

  return null;
}
