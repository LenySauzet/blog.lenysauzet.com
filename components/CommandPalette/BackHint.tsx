'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const CLASS =
  'pointer-events-none shrink-0 text-xs whitespace-nowrap text-muted-foreground/70';

/**
 * Backspace leaves a page, and nothing on the surface said so. It is shown
 * only while the box is empty, which is the only time the key does that: with
 * a query in hand it deletes a character, and a hint promising otherwise would
 * be worse than none.
 */
export function BackHint({ shown }: { shown: boolean }) {
  const still = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.span
          key="back"
          aria-hidden
          className={CLASS}
          initial={still ? false : { opacity: 0, filter: 'blur(4px)', x: 4 }}
          animate={{ opacity: 1, filter: 'blur(0px)', x: 0, transitionEnd: { filter: 'none' } }}
          exit={still ? { opacity: 0 } : { opacity: 0, filter: 'blur(4px)', x: 4 }}
          transition={{ duration: still ? 0 : 0.18, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <span className="tracking-widest">⌫</span> Back
        </motion.span>
      )}
    </AnimatePresence>
  );
}
