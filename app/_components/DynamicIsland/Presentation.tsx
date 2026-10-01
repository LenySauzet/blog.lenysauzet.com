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
      initial={{ opacity: 0, scale: 0.84, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ scale: MORPH, opacity: FADE, filter: FADE }}
      className="flex items-center"
    >
      {children}
    </motion.div>
  );
}
