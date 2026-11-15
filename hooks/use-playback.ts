'use client';

import { useState } from 'react';

import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

export function usePlayback() {
  const still = usePrefersReducedMotion();
  const [chosen, setChosen] = useState<boolean | null>(null);
  const playing = chosen ?? !still;

  return { playing, toggle: () => setChosen(!playing), pause: () => setChosen(false) };
}
