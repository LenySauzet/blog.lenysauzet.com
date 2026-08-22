'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Fragment } from 'react';

// A beat after the morph reports done, so the caption reads as arriving rather than
// as competing with it. Not a delay measured against the morph: the cold open blocks
// the main thread for ~330ms decoding the image, and a fixed delay lands inside that
// stall, eating the first words of the cascade.
const LEAD_IN = 0.06;

// Per word, so the blur front crosses a short caption in roughly a third of a second.
const PER_WORD = 0.045;

// `blur(0px)`, never `blur(0)`: the second is not interpolable from a blur length.
const WORD = {
  hidden: { opacity: 0, filter: 'blur(6px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
};

const REVEAL = {
  hidden: {},
  visible: { transition: { delayChildren: LEAD_IN, staggerChildren: PER_WORD } },
};

/**
 * The zoomed image's caption, revealed a word at a time from the left.
 *
 * Split into spans and hidden from assistive tech: the lightbox is already named by
 * the same text, so announcing it word by word would only repeat it in pieces.
 */
export function ZoomCaption({
  children,
  start,
}: {
  children: string;
  /** The zoom morph has landed. */
  start: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const className =
    'pointer-events-none pt-4 text-center font-display text-sm leading-6 text-subtle-foreground';

  if (reduceMotion) {
    return (
      <p aria-hidden className={className}>
        {children}
      </p>
    );
  }

  return (
    <motion.p
      aria-hidden
      className={className}
      variants={REVEAL}
      initial="hidden"
      animate={start ? 'visible' : 'hidden'}
    >
      {children.split(' ').map((word, index) => (
        // Words repeat, so the index is the only stable key. The space sits outside
        // the span so wrapping still works and the blur cannot bleed across it.
        <Fragment key={index}>
          {index > 0 && ' '}
          <motion.span variants={WORD} className="inline-block">
            {word}
          </motion.span>
        </Fragment>
      ))}
    </motion.p>
  );
}
