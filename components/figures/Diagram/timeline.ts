'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const LONGEST_STEP = 0.1;
const REDUCED = '(prefers-reduced-motion: reduce)';

export const advance = (phase: number, seconds: number, period: number) =>
  (phase + Math.min(seconds, LONGEST_STEP) / period) % 1;

const subscribe = (change: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function useTimeline(period: number, initial = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const [phase, setPhase] = useState(initial);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const playing = chosen ?? !reduced;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;

    let frame = 0;
    let last: number | undefined;
    const tick = (now: number) => {
      if (last !== undefined) {
        const seconds = (now - last) / 1000;
        setPhase((phase) => advance(phase, seconds, period));
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, visible, period]);

  return { ref, phase, playing, toggle: () => setChosen(!playing) };
}
