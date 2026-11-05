'use client';

import {
  animate,
  motionValue,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';

import type { Section } from './rail';

/** The longest gap between two titles, in seconds. */
const BEAT = 0.0375;

/** A ceiling, in seconds, never a fixed length. */
const WALK = 0.22;

const beatOf = (count: number) => Math.min(BEAT, WALK / Math.max(1, count - 1));

const FADE = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

export const walkDuration = (count: number) =>
  beatOf(count) * Math.max(0, count - 1);

export const passDuration = (count: number) =>
  walkDuration(count) + FADE.duration;

export function useCascade(
  sections: Section[],
  opened: boolean,
  still: boolean
): Map<Section, MotionValue<number>> {
  const shown = useMemo(
    () => new Map(sections.map((section) => [section, motionValue(0)] as const)),
    [sections]
  );
  const walk = useMemo(() => [...shown.values()], [shown]);

  const boundary = useMotionValue(0);
  const told = useRef(0);
  const count = walk.length;

  useEffect(() => {
    if (!count) return;

    const last = (told.current || count) - 1;

    told.current = 0;
    boundary.set(0);

    const running = animate(boundary, last, {
      duration: still ? 0 : beatOf(count) * last,
      ease: 'linear',
      onComplete: () => boundary.set(count - 1),
    });

    return () => running.stop();
  }, [opened, still, count, boundary]);

  useMotionValueEvent(boundary, 'change', (reached) => {
    while (told.current < count && told.current <= reached) {
      animate(walk[told.current], opened ? 1 : 0, still ? AT_ONCE : FADE);
      told.current += 1;
    }
  });

  return shown;
}
