'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode, Ref } from 'react';

import { FADE, LEAVE } from './motion';

interface PresentationProps {
  children: ReactNode;
  /** Claimed by `AnimatePresence` under `popLayout`, which needs the node itself. */
  ref?: Ref<HTMLDivElement>;
}

export function Presentation({ children, ref }: PresentationProps) {
  const still = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{
        opacity: 0,
        filter: 'blur(10px)',
        transition: still ? { duration: 0 } : LEAVE,
      }}
      transition={still ? { duration: 0 } : { opacity: FADE, filter: FADE }}
      className="flex w-full items-center"
    >
      {children}
    </motion.div>
  );
}
