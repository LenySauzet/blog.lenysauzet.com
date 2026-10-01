'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode, Ref } from 'react';

/**
 * How a state arrives and leaves. The blur lives here, on the content, and never on
 * the island itself: the container carries a `backdrop-filter` for its glass, and a
 * `filter` on an element that already has one opens a second filter context that
 * breaks the glass. The content is most of what the eye reads, so the effect is the
 * same and the surface stays intact.
 *
 * The exit is quicker than the entrance so the two never read as superimposed.
 *
 * The ref is forwarded because `AnimatePresence` in `popLayout` needs to reach the
 * node to lift the outgoing copy out of the flow. Without it the two states sit
 * side by side and the morph reads as a slide rather than one fading under the
 * other.
 */
const ENTER = [0.16, 1, 0.3, 1] as const;

export function Presentation({
  children,
  ref,
}: {
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  // Not a softer version under reduced motion: the whole apparatus goes, and what
  // is left is a plain crossfade.
  const still = useReducedMotion();

  const hidden = still
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.92, filter: 'blur(6px)' };

  const shown = still
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, filter: 'blur(0px)' };

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={shown}
      exit={hidden}
      transition={{
        duration: still ? 0.12 : 0.24,
        ease: ENTER,
        opacity: { duration: still ? 0.12 : 0.18 },
      }}
    >
      {children}
    </motion.div>
  );
}
