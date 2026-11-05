'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const CLASS = [
  'shrink-0 cursor-pointer rounded-md px-2 py-1 text-sm whitespace-nowrap',
  'text-muted-foreground/70 transition-[scale] duration-100',
  'hover:bg-foreground/5 hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'focus-visible:ring-offset-background focus-visible:outline-none',
].join(' ');

export function BackHint({ shown, onBack }: { shown: boolean; onBack: () => void }) {
  const still = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.button
          key="back"
          type="button"
          onClick={onBack}
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
