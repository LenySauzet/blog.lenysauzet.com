'use client';

import { useEffect, useRef, useState } from 'react';

import { LONGEST_STEP, usePlayback } from '@/components/figures/Playback';

export const advance = (phase: number, seconds: number, period: number) =>
  (phase + Math.min(seconds, LONGEST_STEP) / period) % 1;

export function useTimeline(period: number, initial = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const { playing, toggle } = usePlayback();
  const [phase, setPhase] = useState(initial);
  const [visible, setVisible] = useState(false);

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

  return { ref, phase, playing, toggle };
}
