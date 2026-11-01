'use client';

import { useSyncExternalStore } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';

const subscribe = (change: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

/**
 * The reader's preference, live and safe to hydrate. Motion's `useReducedMotion`
 * reads it once at mount, so a change made while reading would wait for the next
 * page; the server renders `false`, as the page does before any script.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}
