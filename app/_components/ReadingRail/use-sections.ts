'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { headingsOf, scrollColumn, travelOf } from '@/lib/scroll-column';

import { sameSections, type Section } from './rail';

/** Pixels clear of the island; never add a heading's own scroll margin. */
export const LANDING = 88;

const read = (): Section[] => {
  const column = scrollColumn();
  const travel = column ? travelOf(column) : 0;
  if (!column || travel <= 0) return [];

  const origin = column.getBoundingClientRect().top - column.scrollTop;

  return headingsOf(column).map((heading) => {
    const top = Math.max(0, heading.getBoundingClientRect().top - origin);

    return {
      label: heading.textContent?.trim() ?? '',
      level: Number(heading.tagName.slice(1)),
      progress: Math.min(1, Math.max(0, (top - LANDING) / travel)),
      top,
    };
  });
};

export function useSections(): Section[] {
  const [sections, setSections] = useState<Section[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const measure = () =>
      setSections((held) => {
        const found = read();
        return sameSections(held, found) ? held : found;
      });

    measure();

    const column = scrollColumn();
    const resized = new ResizeObserver(measure);
    // Content too: an image or formula landing late moves every section below it.
    if (column) resized.observe(column);
    if (column?.firstElementChild) resized.observe(column.firstElementChild);

    return () => resized.disconnect();
  }, [pathname]);

  return sections;
}
