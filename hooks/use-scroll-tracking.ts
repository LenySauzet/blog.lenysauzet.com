'use client';

import { motionValue } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NEARLY_THERE = 0.98;

export const SCROLL_ROOT = '[data-scroll-root]';

export const scrollProgress = motionValue(0);

export interface ScrollPosition {
  atTop: boolean;
  finished: boolean;
}

export function useScrollTracking(): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({
    atTop: true,
    finished: false,
  });
  const pathname = usePathname();

  useEffect(() => {
    const column = document.querySelector<HTMLElement>(SCROLL_ROOT);

    const read = () => {
      const travel = column ? column.scrollHeight - column.clientHeight : 0;
      const passed = column?.scrollTop ?? 0;
      const progress = travel > 0 ? Math.min(1, passed / travel) : 0;

      const atTop = passed === 0;
      const finished = progress >= NEARLY_THERE;

      scrollProgress.set(progress);
      // A fresh object every scroll event would re-render both readers sixty
      // times a second to tell them nothing had changed.
      setPosition((previous) =>
        previous.atTop === atTop && previous.finished === finished
          ? previous
          : { atTop, finished }
      );
    };

    column?.addEventListener('scroll', read, { passive: true });
    const resized = new ResizeObserver(read);
    resized.observe(column ?? document.documentElement);

    return () => {
      column?.removeEventListener('scroll', read);
      resized.disconnect();
    };
  }, [pathname]);

  return position;
}
