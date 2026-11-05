'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Fragment, useSyncExternalStore } from 'react';

import { Badge } from '@/components/ui/badge';
import { relativeTime } from '@/lib/relative-time';

const subscribeToNothing = () => () => {};

// Outlasts the date line's 1.12s decode, which drags the badge sideways while it runs.
const HOLD = 1.2;

// Reduced motion changes the timing only: a second tree would not match the server's.
const AT_ONCE = { duration: 0, delay: 0 };

// The pill clips its children, and a blurred letter is wider than the sharp one.
const CLASS = 'overflow-visible font-display font-normal';

export function UpdatedBadge({ date, label }: { date: string; label: string }) {
  const still = useReducedMotion();
  const current = useSyncExternalStore(
    subscribeToNothing,
    () => relativeTime(date),
    () => label
  );
  const reading = `Updated ${current}`;

  const badge = {
    hidden: { opacity: 0, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: still ? AT_ONCE : { delay: HOLD, duration: 0.55 },
    },
  };

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
        <span className="sr-only">{reading}</span>

        {/* One flex item, or the pill's flex layout drops the spaces between letters. */}
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
