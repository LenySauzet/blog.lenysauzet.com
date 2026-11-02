'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Fragment } from 'react';

const WORD = {
  hidden: { opacity: 0, filter: 'blur(6px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  gone: { opacity: 0, filter: 'blur(6px)' },
};

const REVEAL = {
  hidden: {},
  visible: { transition: { delayChildren: 0.06, staggerChildren: 0.045 } },
  // Leaving mirrors arriving, last word first, inside the zoom's own exit.
  gone: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const CLASS =
  'pointer-events-none shrink-0 pt-4 text-center font-display text-sm leading-6 text-subtle-foreground';

export interface ZoomCaptionProps {
  children: string;
  /** The zoom morph has landed. */
  start: boolean;
}

/** Hidden from assistive tech: the lightbox is already named by this same text. */
export function ZoomCaption({ children, start }: ZoomCaptionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <p aria-hidden className={CLASS}>
        {children}
      </p>
    );
  }

  return (
    <motion.p
      aria-hidden
      className={CLASS}
      variants={REVEAL}
      initial="hidden"
      animate={start ? 'visible' : 'hidden'}
      exit="gone"
    >
      {children.split(' ').map((word, index) => (
        <Fragment key={index}>
          {index > 0 && ' '}
          {/* `inline-block` keeps the blur off the space, so wrapping still works. */}
          <motion.span variants={WORD} className="inline-block">
            {word}
          </motion.span>
        </Fragment>
      ))}
    </motion.p>
  );
}
