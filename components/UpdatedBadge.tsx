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

// Reduced motion changes the timing, never the markup. Rendering a second, simpler
// tree for it was a hydration mismatch by construction: the server cannot know the
// preference, so it always sent the animated one and the client threw it away.
const AT_ONCE = { duration: 0, delay: 0 };

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
  const still = useReducedMotion();
  const current = useSyncExternalStore(
    readOnly,
    () => relativeTime(date),
    () => label
  );
  const reading = `Updated ${current}`;

  // The pill arrives out of focus with its text, rather than appearing whole and
  // waiting to be filled: it is one object, so it resolves as one.
  const badge = {
    hidden: { opacity: 0, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: still ? AT_ONCE : { delay: HOLD, duration: 0.55 },
    },
  };

  // Per letter rather than per word: four words is four arrivals, and the sweep has to
  // outlast the pill's own blur or there is nothing left to see travel.
  const sweep = {
    hidden: {},
    visible: {
      transition: still
        ? AT_ONCE
        : { delayChildren: HOLD, staggerChildren: 0.035 },
    },
  };

  const letter = {
    hidden: { opacity: 0, filter: 'blur(6px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: still ? AT_ONCE : { duration: 0.45 },
    },
  };

  return (
    <Badge variant="info" asChild className={CLASS}>
      <motion.time
        dateTime={date}
        variants={badge}
        initial="hidden"
        animate="visible"
      >
        {/* Split for the sweep, so the sentence is spoken from here instead. */}
        <span className="sr-only">{reading}</span>

        {/* One flex item, so inline flow resumes inside it. Loose in the pill, the
            letters were spaced by its `gap` and the spaces between them dropped,
            which is what a flex container does with whitespace. */}
        <motion.span aria-hidden variants={sweep}>
          {reading.split('').map((character, index) =>
            character === ' ' ? (
              <Fragment key={index}> </Fragment>
            ) : (
              <motion.span key={index} variants={letter} className="inline-block">
                {character}
              </motion.span>
            )
          )}
        </motion.span>
      </motion.time>
    </Badge>
  );
}
