'use client';

import { motionValue } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const scrollProgress = motionValue(0);

export function useScrollTracking() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const column = document.querySelector<HTMLElement>('[data-scroll-root]');

    const read = () => {
      const travel = column ? column.scrollHeight - column.clientHeight : 0;
      const passed = column?.scrollTop ?? 0;

      scrollProgress.set(travel > 0 ? Math.min(1, passed / travel) : 0);
      setScrolled(passed > 0);
    };

    column?.addEventListener('scroll', read, { passive: true });
    const resized = new ResizeObserver(read);
    resized.observe(column ?? document.documentElement);

    return () => {
      column?.removeEventListener('scroll', read);
      resized.disconnect();
    };
  }, [pathname]);

  return scrolled;
}
