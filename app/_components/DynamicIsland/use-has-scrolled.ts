'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Whether the reader has left the top of the page.
 *
 * A boolean rather than the progress itself, because this is what decides which
 * state applies: at the top of an article there is no progress worth reporting, so
 * the island introduces the site instead. The progress that draws the ring stays
 * where it is drawn, as a motion value nobody re-renders for.
 *
 * Read from the observer rather than from the effect body, which also covers the
 * first read: a `ResizeObserver` fires once on `observe`.
 */
export function useHasScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-scroll-root]');
    if (!root) return;

    const read = () => setScrolled(root.scrollTop > 0);

    root.addEventListener('scroll', read, { passive: true });
    const resized = new ResizeObserver(read);
    resized.observe(root);

    return () => {
      root.removeEventListener('scroll', read);
      resized.disconnect();
    };
  }, [pathname]);

  return scrolled;
}
