'use client';

import { useSyncExternalStore } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';

const subscribe = (change: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

/** Live, where Motion's `useReducedMotion` reads once at mount. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}
