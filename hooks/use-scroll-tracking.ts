'use client';

import { motionValue } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { travel } from '@/lib/page-scroll';

const NEARLY_THERE = 0.98;

export const scrollProgress = motionValue(0);

export interface ScrollPosition {
  atTop: boolean;
  finished: boolean;
}

/** A page with no room to scroll is read to its end: all of it is in sight. */
export const readProgress = (room: number, passed: number) =>
  room > 0 ? Math.min(1, passed / room) : 1;

export const isFinished = (progress: number) => progress >= NEARLY_THERE;

export function useScrollTracking(): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({
    atTop: true,
    finished: false,
  });
  const pathname = usePathname();

  useEffect(() => {
    const read = () => {
      const room = travel();
      const passed = window.scrollY;
      const progress = readProgress(room, passed);

      const atTop = passed === 0;
      const finished = isFinished(progress);

      scrollProgress.set(progress);
      // Kept when unchanged, or both readers re-render on every scroll event.
      setPosition((previous) =>
        previous.atTop === atTop && previous.finished === finished
          ? previous
          : { atTop, finished }
      );
    };

    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    const resized = new ResizeObserver(read);
    resized.observe(document.documentElement);

    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
      resized.disconnect();
    };
  }, [pathname]);

  return position;
}
