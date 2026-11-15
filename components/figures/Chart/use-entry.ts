"use client";

import { useEffect, useRef, useState } from "react";

export const ENTRY_MS = 650;

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

  // Derived, not stored: a preference resolving after the first render would strand the marks.
  return { ref, drawn: seen || !animated, settled: !held || !animated };
}
