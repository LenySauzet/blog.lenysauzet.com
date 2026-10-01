'use client';

import { useMotionValue } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * How far through the scrolling column the reader is, as a motion value so nothing
 * re-renders while they scroll.
 *
 * `body` is fixed here and each column owns its overflow, so the window never
 * scrolls: the marked column is the thing to read. It is found again on every
 * navigation, since the node belongs to the route, not to this component.
 */
export function useScrollProgress() {
  const progress = useMotionValue(0);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-scroll-root]');
    if (!root) {
      progress.set(0);
      return;
    }

    const read = () => {
      const travel = root.scrollHeight - root.clientHeight;
      progress.set(travel > 0 ? Math.min(1, root.scrollTop / travel) : 0);
    };

    read();
    root.addEventListener('scroll', read, { passive: true });
    // An article grows as its images land, which moves the end without moving the
    // reader.
    const resized = new ResizeObserver(read);
    resized.observe(root);

    return () => {
      root.removeEventListener('scroll', read);
      resized.disconnect();
    };
  }, [pathname, progress]);

  return progress;
}
