'use client';

import { useState, useSyncExternalStore } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';

const subscribe = (change: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function usePlayback() {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const [chosen, setChosen] = useState<boolean | null>(null);
  const playing = chosen ?? !reduced;

  return { playing, toggle: () => setChosen(!playing) };
}
