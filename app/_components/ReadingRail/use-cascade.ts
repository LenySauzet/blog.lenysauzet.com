'use client';

import {
  animate,
  motionValue,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';

/** The boundary crosses the rail at a constant rate, so the titles arrive on an
    even beat; the easing belongs to each title's own fade, not to the order. */
const SWEEP_SECONDS = 0.45;
const FADE = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

/**
 * One boundary sweeps down the rail and tells each title, once, what to do when
 * it reaches it. Every pass runs top to bottom, including one that interrupts
 * another: a reversal is a new sweep rather than the old one rewinding, which
 * is what used to bring the titles back up from the bottom.
 *
 * Nothing holds a delay, so nothing can be stranded by one: a title is always
 * on its way to the only two values it has.
 */
export function useCascade(
  count: number,
  opened: boolean,
  still: boolean
): MotionValue<number>[] {
  const shown = useMemo(
    () => Array.from({ length: count }, () => motionValue(0)),
    [count]
  );

  const boundary = useMotionValue(0);
  const told = useRef(-1);

  useEffect(() => {
    // Only the titles the last pass reached are now wrong, and they are the
    // ones at the top, so the new pass need travel no further than that. It
    // keeps the beat and ends as soon as the last wrong title is put right,
    // rather than walking the rest of the rail to tell it what it already is.
    const wrong = Math.min(1, (told.current + 1) / count) || 1;

    told.current = -1;
    boundary.set(0);

    const sweep = animate(boundary, wrong, {
      duration: still ? 0 : SWEEP_SECONDS * wrong,
      ease: 'linear',
      onComplete: () => boundary.set(1),
    });

    return () => sweep.stop();
  }, [opened, still, count, boundary, shown]);

  useMotionValueEvent(boundary, 'change', (reached) => {
    const place = (index: number) => (count < 2 ? 0 : index / (count - 1));

    while (told.current + 1 < count && place(told.current + 1) <= reached) {
      told.current += 1;
      animate(shown[told.current], opened ? 1 : 0, still ? AT_ONCE : FADE);
    }
  });

  return shown;
}
