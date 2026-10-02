'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SCROLL_ROOT } from '@/hooks/use-scroll-tracking';

import type { Section } from './rail';

const read = (): Section[] => {
  const column = document.querySelector<HTMLElement>(SCROLL_ROOT);
  const travel = column ? column.scrollHeight - column.clientHeight : 0;
  if (!column || travel <= 0) return [];

  const top = column.getBoundingClientRect().top - column.scrollTop;

  return [...column.querySelectorAll<HTMLElement>('h2[id]')].map((heading) => ({
    id: heading.id,
    label: heading.textContent?.trim() ?? '',
    progress: Math.min(1, (heading.getBoundingClientRect().top - top) / travel),
  }));
};

const same = (a: Section[], b: Section[]) =>
  a.length === b.length &&
  a.every((section, index) => section.id === b[index].id && section.progress === b[index].progress);

/** Measured rather than built: the rail needs where a section sits, and the
    headings carry their own titles and ids already. */
export function useSections(): Section[] {
  const [sections, setSections] = useState<Section[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const measure = () => setSections((held) => {
      const found = read();
      return same(held, found) ? held : found;
    });

    measure();

    const column = document.querySelector<HTMLElement>(SCROLL_ROOT);
    const resized = new ResizeObserver(measure);
    // The column's own box answers the viewport; its content answers an image
    // or a formula landing late and moving every section below it.
    if (column) resized.observe(column);
    if (column?.firstElementChild) resized.observe(column.firstElementChild);

    return () => resized.disconnect();
  }, [pathname]);

  return sections;
}
