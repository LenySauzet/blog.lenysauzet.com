'use client';

import { useEffect, useState } from 'react';

import { COLLAPSE } from './motion';
import type { IslandState } from './types';

/**
 * What the island shows, which is not always what the page resolves to.
 *
 * Every change passes through the resting shape first, so the island closes and
 * opens into its new form rather than snapping from one width to another. It is
 * also what gives the first paint something to morph from: a layout animation
 * interpolates between two boxes, and on mount there is only one, so the island
 * arrived at full size without ever having grown.
 *
 * The changes are made from timers rather than from the effect body on purpose.
 * This is a sequencer: each step is an event that happens later, including the
 * collapse, which merely happens as soon as possible.
 */
export function useStagedState(resolved: IslandState, resting: IslandState) {
  const [shown, setShown] = useState(resting);

  useEffect(() => {
    if (shown.id === resolved.id) return;

    const closing = shown.id !== resting.id;
    const timer = window.setTimeout(
      () => setShown(closing ? resting : resolved),
      closing ? 0 : COLLAPSE
    );

    return () => window.clearTimeout(timer);
  }, [resolved, resting, shown]);

  return shown;
}
