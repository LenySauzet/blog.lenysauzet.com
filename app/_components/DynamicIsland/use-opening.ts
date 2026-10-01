'use client';

import { useEffect, useState } from 'react';

import { RESTS_BEFORE_OPENING } from './motion';
import type { IslandState } from './types';

export function useOpening(resolved: IslandState, resting: IslandState) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (opened) return;

    const timer = window.setTimeout(() => setOpened(true), RESTS_BEFORE_OPENING);
    return () => window.clearTimeout(timer);
  }, [opened]);

  return opened ? resolved : resting;
}
