'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { headings, travel } from '@/lib/page-scroll';

import { sameSections, type Section } from './rail';

/** Pixels clear of the island; never add a heading's own scroll margin. */
export const LANDING = 88;

const read = (): Section[] => {
  const room = travel();
  if (room <= 0) return [];

  return headings().map((heading) => {
    const top = Math.max(0, heading.getBoundingClientRect().top + window.scrollY);

    return {
      label: heading.textContent?.trim() ?? '',
      level: Number(heading.tagName.slice(1)),
      progress: Math.min(1, Math.max(0, (top - LANDING) / room)),
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

    // The page grows as an image or formula lands late; the window's height changes the travel.
    const resized = new ResizeObserver(measure);
    resized.observe(document.documentElement);
    window.addEventListener('resize', measure);

    return () => {
      resized.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pathname]);

  return sections;
}
