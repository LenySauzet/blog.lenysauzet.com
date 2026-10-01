'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { FADE } from './motion';

export function Presentation({ children }: { children: ReactNode }) {
  const still = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={still ? { duration: 0 } : { opacity: FADE, filter: FADE }}
      className="flex w-full items-center"
    >
      {children}
    </motion.div>
  );
}
