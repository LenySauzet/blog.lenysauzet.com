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

// The pill arrives out of focus with its text, rather than appearing whole and waiting
// to be filled: it is one object, so it resolves as one.
const BADGE = {
  hidden: { opacity: 0, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { delay: HOLD, duration: 0.55 },
  },
};

// Per letter rather than per word: four words is four arrivals, and the sweep has to
// outlast the pill's own blur or there is nothing left to see travel.
const SWEEP = {
  hidden: {},
  visible: { transition: { delayChildren: HOLD, staggerChildren: 0.035 } },
};

const LETTER = {
  hidden: { opacity: 0, filter: 'blur(6px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.45 } },
};

// `overflow-visible` because the pill clips its own children, and a letter arriving
// out of focus is wider than the letter it becomes.
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
  const reading = `Updated ${current}`;

  if (reduceMotion) {
    return (
      <Badge variant="info" asChild className={CLASS}>
        <time dateTime={date}>{reading}</time>
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
        {/* Split for the sweep, so the sentence is spoken from here instead. */}
        <span className="sr-only">{reading}</span>

        {/* One flex item, so inline flow resumes inside it. Loose in the pill, the
            letters were spaced by its `gap` and the spaces between them dropped,
            which is what a flex container does with whitespace. */}
        <motion.span aria-hidden variants={SWEEP}>
          {reading.split('').map((letter, index) =>
            letter === ' ' ? (
              <Fragment key={index}> </Fragment>
            ) : (
              <motion.span key={index} variants={LETTER} className="inline-block">
                {letter}
              </motion.span>
            )
          )}
        </motion.span>
      </motion.time>
    </Badge>
  );
}
