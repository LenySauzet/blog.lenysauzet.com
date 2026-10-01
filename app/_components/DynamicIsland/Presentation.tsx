'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { FADE } from './motion';

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
 * Full width and laid out as a flex row. The width is not cosmetic either: a state
 * that pushes its content to both caps resolves its own `w-full` against this
 * element, and against an automatically sized one it collapses back to the width of
 * its content, which is the whole thing it was trying not to be.
 *
 * The row is not cosmetic: as a block it would raise a line
 * box from its own inherited font rather than from the state's, so a state set in
 * 12px stood on a 24px strut. That is six pixels of height nobody asked for, and a
 * baseline that sits the glyphs off centre.
 *
 * No scale of its own, and no correction of the island's. Motion projects the pill
 * from the box it held a frame ago into the one it holds now, which stretches
 * everything inside on both axes, and that stretch is the effect: the content is
 * laid out once at its final size and squashed into the shape of the moment.
 * Counter-scaling it holds its proportions and loses the effect; adding a scale of
 * its own puts a second, disagreeing movement on top. So the entrance is opacity
 * and blur alone.
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
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ opacity: FADE, filter: FADE }}
      className="flex w-full items-center"
    >
      {children}
    </motion.div>
  );
}
