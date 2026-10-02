'use client';

import {
  animate,
  motionValue,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';

/** Seconds from one title to the next, so the beat holds whatever the count. */
const BEAT = 0.0375;

const FADE = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

/** How long a whole pass takes, the walk plus the last title's own fade.
    Exported because anything that should wait for the rail to empty has to
    wait on the count, not on a number someone picked. */
export const passDuration = (count: number) =>
  BEAT * Math.max(0, count - 1) + FADE.duration;

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
  count: number,
  opened: boolean,
  still: boolean
): MotionValue<number>[] {
  const shown = useMemo(
    () => Array.from({ length: count }, () => motionValue(0)),
    [count]
  );

  const boundary = useMotionValue(0);
  const told = useRef(0);

  useEffect(() => {
    if (!count) return;

    const last = (told.current || count) - 1;

    told.current = 0;
    boundary.set(0);

    const walk = animate(boundary, last, {
      duration: still ? 0 : BEAT * last,
      ease: 'linear',
      onComplete: () => boundary.set(count - 1),
    });

    return () => walk.stop();
  }, [opened, still, count, boundary]);

  useMotionValueEvent(boundary, 'change', (reached) => {
    while (told.current < count && told.current <= reached) {
      animate(shown[told.current], opened ? 1 : 0, still ? AT_ONCE : FADE);
      told.current += 1;
    }
  });

  return shown;
}
