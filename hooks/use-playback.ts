'use client';

import { useState } from 'react';

import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

export function usePlayback() {
  const reduced = usePrefersReducedMotion();
  const [chosen, setChosen] = useState<boolean | null>(null);
  const playing = chosen ?? !reduced;

  return { playing, toggle: () => setChosen(!playing), pause: () => setChosen(false) };
}
