"use client";

import { useEffect, useRef, useState } from "react";

/** Long enough to read as drawing, short enough not to delay a reader. */
export const ENTRY_MS = 650;

/**
 * Marks wait until the plot is scrolled to, which costs nothing: the static
 * HTML carries the frame and the axes but no series path.
 *
 * `settled` then clears the dash the draw-in leaves behind. Recharts sets it
 * to the path's whole length and recomputes that only at an animation's ends,
 * so a rescale lengthens the path under a stale figure and the tail falls in
 * the gap.
 */
export function useEntry(animated: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [held, setHeld] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setSeen(true);
      },
      // A tall chart on a short viewport never reaches a higher threshold.
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    const timer = setTimeout(() => setHeld(false), ENTRY_MS);
    return () => clearTimeout(timer);
  }, [seen]);

  // Derived rather than stored: a preference resolving after the first render
  // would otherwise strand the marks unmounted.
  return { ref, drawn: seen || !animated, settled: !held || !animated };
}
