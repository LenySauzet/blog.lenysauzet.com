'use client';

import { useEffect } from 'react';

import { useIslandStore } from '@/hooks/use-island-store';

import type { IslandPost } from './types';

export function AnnouncePost({ title, shortTitle }: IslandPost) {
  useEffect(() => {
    useIslandStore.getState().setPost({ title, shortTitle });
    return () => useIslandStore.getState().setPost(null);
  }, [title, shortTitle]);

  return null;
}
