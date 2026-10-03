'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

/** A row's own vocabulary: the same wash and the same accent it takes when
    selected, so the one target in the header reads as part of the list rather
    than as chrome bolted beside it. */
const CLASS = cn(
  'shrink-0 cursor-pointer rounded-md px-2 py-1 text-sm whitespace-nowrap',
  'text-muted-foreground/70 transition-[scale,color,background-color] duration-100',
  'hover:bg-primary/10 hover:text-primary active:scale-[0.97] motion-reduce:active:scale-100',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'focus-visible:ring-offset-background focus-visible:outline-none'
);

/**
 * Backspace leaves a page, and nothing on the surface said so. Shown only
 * while the box is empty, which is the only time the key does that: with a
 * query in hand it deletes a character, and a hint promising otherwise would
 * be worse than none.
 *
 * It is also the target, so the mouse is not left with Escape as its only way
 * out of a page.
 */
export function BackHint({ shown, onBack }: { shown: boolean; onBack: () => void }) {
  const still = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.button
          key="back"
          type="button"
          onClick={onBack}
          // cmdk reads Enter on its root and runs whatever row is highlighted,
          // so a button inside it is reachable by Tab and dead on arrival. The
          // key is kept here and the browser's own activation does the rest.
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
          }}
          className={CLASS}
          initial={still ? false : { opacity: 0, filter: 'blur(4px)', x: 4 }}
          animate={{ opacity: 1, filter: 'blur(0px)', x: 0, transitionEnd: { filter: 'none' } }}
          exit={still ? { opacity: 0 } : { opacity: 0, filter: 'blur(4px)', x: 4 }}
          transition={{ duration: still ? 0 : 0.18, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <span aria-hidden className="tracking-widest">
            ⌫
          </span>{' '}
          Back
        </motion.button>
      )}
    </AnimatePresence>
  );
}
