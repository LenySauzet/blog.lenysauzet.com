'use client';

import { useEffect, useRef, useState } from 'react';

/** Long enough to read as drawing, short enough not to delay a reader. */
export const ENTRY_MS = 650;

type Phase = 'hidden' | 'drawing' | 'settled';

/**
 * A chart draws itself once, when it is first scrolled to, and never again.
 *
 * Holding the marks back until then costs nothing: the static HTML carries
 * the frame, the grid, the axes and the legend, but no series path, so there
 * is no server-rendered curve for an entry animation to reset and no layout
 * to shift when one arrives.
 *
 * It has to stop after that pass. Recharts redraws a line from its start on
 * every data change, so a legend toggle would otherwise show every other
 * series half-drawn, which reads as a glitch rather than as a transition.
 */
export function useEntry(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>(enabled ? 'hidden' : 'settled');

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      // Off the microtask queue rather than inline: a state change during an
      // effect's own pass is a cascading render, and this one only ever fires
      // where the observer is missing.
      queueMicrotask(() => setPhase('settled'));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setPhase('drawing');
      },
      // A sliver is enough: waiting for the whole chart means a tall one
      // never draws on a short viewport.
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (phase !== 'drawing') return;
    const timer = setTimeout(() => setPhase('settled'), ENTRY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  return { ref, drawn: phase !== 'hidden', animating: phase === 'drawing' };
}
