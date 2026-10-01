'use client';

import { motionValue } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NEARLY_THERE = 0.98;

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
    const column = document.querySelector<HTMLElement>('[data-scroll-root]');

    const read = () => {
      const travel = column ? column.scrollHeight - column.clientHeight : 0;
      const passed = column?.scrollTop ?? 0;
      const progress = travel > 0 ? Math.min(1, passed / travel) : 0;

      scrollProgress.set(progress);
      setPosition({ atTop: passed === 0, finished: progress >= NEARLY_THERE });
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
