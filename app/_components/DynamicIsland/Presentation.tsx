'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { FADE, MORPH } from './motion';

/**
 * How a state arrives. It only arrives: the outgoing one is dropped on the spot,
 * with nothing to watch, so the eye has a single thing to follow rather than two
 * contents trading places. That is also what Apple's island does, and why its
 * transitions read as one object changing rather than as a crossfade.
 *
 * The blur lives here, on the content, and never on the island itself: the
 * container carries a `backdrop-filter` for its glass, and a `filter` on an element
 * that already has one opens a second filter context that breaks it.
 *
 * Laid out as a flex row, which is not cosmetic: as a block it would raise a line
 * box from its own inherited font rather than from the state's, so a state set in
 * 12px stood on a 24px strut. That is six pixels of height nobody asked for, and a
 * baseline that sits the glyphs off centre.
 *
 * It carries `layout` for a reason that is invisible until measured. Motion does
 * not resize the pill, it scales it: mid-morph the container was reading
 * `matrix(1.2577, 0, 0, 1)`, stretching everything inside it by a quarter. Only a
 * child that also claims `layout` is counter-scaled, which is what lets the content
 * hold its proportions while the island changes shape around it. A scale of its own
 * on top of that is a second, disagreeing movement, which is why the entrance is
 * now opacity and blur alone.
 */
export function Presentation({ children }: { children: ReactNode }) {
  // Not a softer version under reduced motion: the whole apparatus goes, and what
  // is left is the content appearing.
  const still = useReducedMotion();

  if (still) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ layout: MORPH, opacity: FADE, filter: FADE }}
      className="flex items-center"
    >
      {children}
    </motion.div>
  );
}
