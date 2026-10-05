"use client";

import { useEffect, useRef, useState } from "react";

/** Long enough to read as drawing, short enough not to delay a reader. */
export const ENTRY_MS = 650;

/**
 * A chart's marks wait until the plot is scrolled to, then mount and draw
 * themselves in. Holding them back costs nothing: measured, the static HTML
 * carries the frame, the grid, the axes and the legend but no series path at
 * all, so there is no server-rendered curve for an entry to reset and no
 * layout to shift when one arrives.
 *
 * Nothing needs to stop afterwards. Recharts interpolates a path toward its
 * new shape rather than redrawing it from the start, measured on a toggle:
 * the surviving series keep a `stroke-dasharray` equal to their own length
 * throughout, and what moves is the axis rescaling under them, which is the
 * transition worth seeing.
 */
export function useEntry(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      // Off the microtask queue rather than inline: a state change during an
      // effect's own pass is a cascading render, and this one only ever fires
      // where the observer is missing.
      queueMicrotask(() => setDrawn(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setDrawn(true);
      },
      // A sliver is enough: waiting for the whole chart means a tall one
      // never draws on a short viewport.
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, drawn };
}
