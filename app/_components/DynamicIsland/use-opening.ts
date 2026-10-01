'use client';

import { useEffect, useState } from 'react';

import { OPENS_AFTER } from './motion';
import type { IslandState } from './types';

/**
 * The island opens once, from rest, and then simply follows the page.
 *
 * A layout animation interpolates between two boxes, and the first paint has only
 * one: without a shape to grow from, the island arrived at full size having never
 * opened. Holding the resting shape for a beat gives it that first box.
 *
 * Only the first change is staged. Passing every later one through rest as well was
 * tried and makes the island answer a hover two tenths of a second late, which
 * costs more than the flourish is worth.
 *
 * The change is made from a timer rather than from the effect body on purpose: it
 * is an event that happens later, not state derived from a render.
 */
export function useOpening(resolved: IslandState, resting: IslandState) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (opened) return;

    const timer = window.setTimeout(() => setOpened(true), OPENS_AFTER);
    return () => window.clearTimeout(timer);
  }, [opened]);

  return opened ? resolved : resting;
}
