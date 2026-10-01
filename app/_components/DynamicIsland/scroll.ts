'use client';

import { motionValue } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * How far through the scrolling column the reader is, held at module scope rather
 * than in whichever state happens to be drawing it.
 *
 * A state unmounts every time the island changes shape. Owned by the ring, the
 * progress was therefore rebuilt at zero each time and the arc fell back to the top
 * of an article the reader was halfway down. Held here, it survives the states that
 * come and go, and the island subscribes once for as long as it is mounted.
 *
 * A motion value and not React state: scrolling writes it on every frame, and
 * nothing re-renders for it.
 */
export const scrollProgress = motionValue(0);

/**
 * Subscribes for the life of the island, and reports the one thing resolution needs
 * from the scroll: whether the reader has left the top. The progress itself goes to
 * the value above, which the ring reads directly.
 *
 * `body` is fixed here and each column owns its overflow, so the window never
 * scrolls: the marked column is the thing to read, and it belongs to the route, so
 * it is found again on every navigation.
 *
 * Read from the observer rather than from the effect body, which also covers the
 * first read: a `ResizeObserver` fires once on `observe`.
 */
export function useScrollTracking() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-scroll-root]');

    const read = () => {
      if (!root) {
        scrollProgress.set(0);
        setScrolled(false);
        return;
      }

      const travel = root.scrollHeight - root.clientHeight;
      scrollProgress.set(travel > 0 ? Math.min(1, root.scrollTop / travel) : 0);
      setScrolled(root.scrollTop > 0);
    };

    root?.addEventListener('scroll', read, { passive: true });
    // Observed even where there is no column, so that a route without one is
    // reported rather than left holding the last one's progress. An article also
    // grows as its images land, which moves the end without moving the reader.
    const resized = new ResizeObserver(read);
    resized.observe(root ?? document.documentElement);

    return () => {
      root?.removeEventListener('scroll', read);
      resized.disconnect();
    };
  }, [pathname]);

  return scrolled;
}
