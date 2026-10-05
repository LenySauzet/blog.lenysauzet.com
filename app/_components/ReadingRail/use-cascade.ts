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

/** Seconds from one title to the next, where the walk has room for it. */
const BEAT = 0.0375;

/**
 * The walk is bounded, so revealing a long article costs what revealing a
 * short one does. Paced per title alone, the design system's twenty-five
 * sections took 1200ms to unfold, which reads as the rail labouring rather
 * than as a cascade.
 *
 * Bounded rather than fixed: a fixed walk would put this whole span between
 * the only two titles of a short post, where the beat should stay brisk.
 */
const WALK = 0.22;

const beatOf = (count: number) => Math.min(BEAT, WALK / Math.max(1, count - 1));

const FADE = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

/** The walk plus the last title's own fade. Anything waiting for the rail to
    empty waits on this. */
export const passDuration = (count: number) =>
  beatOf(count) * Math.max(0, count - 1) + FADE.duration;

/**
 * A boundary walks the titles and tells each one, once, what to do as it
 * reaches it, so every pass runs top to bottom, a reversal being a new walk
 * rather than the last one rewinding. Nothing holds a delay, which is what
 * would otherwise strand a title mid-fade.
 *
 * A reversal walks only as far as the last pass reached, that being all it can
 * have left wrong, then tells the rest at once.
 */
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
