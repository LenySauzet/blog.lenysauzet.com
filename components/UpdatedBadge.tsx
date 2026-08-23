'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Fragment, useSyncExternalStore } from 'react';

import { Badge } from '@/components/ui/badge';
import { relativeTime } from '@/lib/relative-time';

/** The clock is only ever read, never pushed, so there is nothing to subscribe to. */
const readOnly = () => () => {};

// The date line beside it decodes for 1.12s and changes width as it goes, which drags
// the badge 196px sideways. Arriving once that has settled is what holds it still.
const HOLD = 1.2;

// The pill arrives out of focus with its words, rather than appearing whole and
// waiting to be filled: it is one object, so it resolves as one.
const BADGE = {
  hidden: { opacity: 0, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      delay: HOLD,
      duration: 0.5,
      delayChildren: HOLD,
      staggerChildren: 0.05,
    },
  },
};

// Lighter than the pill's, since the two stack while the sweep crosses.
const WORD = {
  hidden: { opacity: 0, filter: 'blur(5px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
};

// `overflow-visible` because the pill clips its own children, and a word arriving out
// of focus is wider than the word it becomes.
const CLASS = 'overflow-visible font-display font-normal';

/**
 * Posts are statically generated, so a relative label is only true on the day it was
 * built: months later the markup would still claim the post changed three days ago.
 * The build's value is the server snapshot, which is what the first paint carries and
 * what hydration matches, and the reader's own clock is read from then on.
 */
export function UpdatedBadge({ date, label }: { date: string; label: string }) {
  const reduceMotion = useReducedMotion();
  const current = useSyncExternalStore(
    readOnly,
    () => relativeTime(date),
    () => label
  );

  if (reduceMotion) {
    return (
      <Badge variant="info" asChild className={CLASS}>
        <time dateTime={date}>Updated {current}</time>
      </Badge>
    );
  }

  return (
    <Badge variant="info" asChild className={CLASS}>
      <motion.time
        dateTime={date}
        variants={BADGE}
        initial="hidden"
        animate="visible"
      >
        {`Updated ${current}`.split(' ').map((word, index) => (
          <Fragment key={index}>
            {index > 0 && ' '}
            {/* `inline-block` keeps the blur off the space, so wrapping still works. */}
            <motion.span variants={WORD} className="inline-block">
              {word}
            </motion.span>
          </Fragment>
        ))}
      </motion.time>
    </Badge>
  );
}
