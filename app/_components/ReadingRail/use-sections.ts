"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { headingsOf, scrollColumn, travelOf } from "@/lib/scroll-column";

import { sameSections, type Section } from "./rail";

/**
 * Clear of the island, and the rail's alone: a heading's own scroll margin is
 * for its anchor link, and counting both put an h2 twice as far down as an h3.
 * A section's place on the ruler is measured from here too, or the mark would
 * miss the title the reader just clicked.
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
      label: heading.textContent?.trim() ?? "",
      level: Number(heading.tagName.slice(1)),
      progress: Math.min(1, Math.max(0, (top - LANDING) / travel)),
      top,
    };
  });
};

/** Measured rather than built: the rail needs where a section sits, which only
    the page knows. */
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
    // The column's own box answers the viewport; its content answers an image
    // or a formula landing late and moving every section below it.
    if (column) resized.observe(column);
    if (column?.firstElementChild) resized.observe(column.firstElementChild);

    return () => resized.disconnect();
  }, [pathname]);

  return sections;
}
