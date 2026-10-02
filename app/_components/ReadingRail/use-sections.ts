'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { headingsOf, scrollColumn, travelOf } from '@/lib/scroll-column';

import type { Section } from './rail';

/**
 * Clear of the island, which a heading landing at the very top would sit under.
 * The rail owns it for every level: a heading's own scroll margin is for its
 * anchor link, and counting both put an h2 twice as far down as an h3. A
 * section's place on the ruler is measured from here too, or the mark would not
 * land on the title the reader just clicked.
 */
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

const same = (a: Section[], b: Section[]) =>
  a.length === b.length &&
  a.every((section, index) => section.top === b[index].top && section.label === b[index].label);

/** Measured rather than built: the rail needs where a section sits, and the
    headings carry their own titles already. */
export function useSections(): Section[] {
  const [sections, setSections] = useState<Section[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const measure = () =>
      setSections((held) => {
        const found = read();
        return same(held, found) ? held : found;
      });

    measure();

    const column = scrollColumn();
    const resized = new ResizeObserver(measure);
    // The column's own box answers the viewport; its content answers an image
    // or a formula landing late and moving every section below it.
    if (column) resized.observe(column);
    if (column?.firstElementChild) resized.observe(column.firstElementChild);

    return () => resized.disconnect();
  }, [pathname]);

  return sections;
}
