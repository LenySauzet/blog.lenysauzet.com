'use client';

import { motion, useReducedMotion } from 'motion/react';
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
  const reduceMotion = useReducedMotion();
  const [swept, setSwept] = useState(false);
  if (reduceMotion || swept) return null;

  return (
    <>
      {/* Over the panel, not inside the travelling layer, which is several panels
          across. A backdrop filter re-blurs its backdrop every frame it stays
          mounted, which is why the whole component goes once the sweep is over. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
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
        className="pointer-events-none absolute top-0 left-0 z-10"
        style={{ width: SIDE, height: SIDE, background: WASH }}
        initial={{ x: percent(-TRAVEL), y: percent(-TRAVEL) }}
        animate={{ x: '0%', y: '0%' }}
        transition={{ duration: SWEEP_SECONDS, ease: 'linear' }}
      />
    </>
  );
}
