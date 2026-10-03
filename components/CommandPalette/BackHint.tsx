'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/** A row's own wash and accent, so the one target in the header belongs to
    the list rather than sitting beside it. */
const CLASS = [
  'shrink-0 cursor-pointer rounded-md px-2 py-1 text-sm whitespace-nowrap',
  'text-muted-foreground/70 transition-[scale] duration-100',
  'hover:bg-primary/10 hover:text-primary active:scale-[0.97] motion-reduce:active:scale-100',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'focus-visible:ring-offset-background focus-visible:outline-none',
].join(' ');

/**
 * Shown only while the box is empty, which is the only time Backspace leaves
 * a page: with a query in hand it deletes a character. It is the target as
 * well, so a mouse is not left with Escape alone.
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
