'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

import {
  DEFOCUS_SECONDS,
  percent,
  SIDE,
  SWEEP_SECONDS,
  TRAVEL,
  WASH,
} from './reveal-geometry';

const DEFOCUS = '14px';

export function PanelReveal() {
  const [swept, setSwept] = useState(false);
  if (swept) return null;

  return (
    <>
      {/* A backdrop filter re-blurs its backdrop every frame it stays mounted,
          which is why the whole component goes once the sweep is over. Hidden in
          CSS rather than skipped in JS: branching the first render on a media query
          the server cannot read is a hydration mismatch. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 motion-reduce:hidden"
        style={{
          backdropFilter: `blur(${DEFOCUS})`,
          WebkitBackdropFilter: `blur(${DEFOCUS})`,
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: DEFOCUS_SECONDS, ease: 'linear' }}
        onAnimationComplete={() => setSwept(true)}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10 motion-reduce:hidden"
        style={{ width: SIDE, height: SIDE, background: WASH }}
        initial={{ x: percent(-TRAVEL), y: percent(-TRAVEL) }}
        animate={{ x: '0%', y: '0%' }}
        transition={{ duration: SWEEP_SECONDS, ease: 'linear' }}
      />
    </>
  );
}
