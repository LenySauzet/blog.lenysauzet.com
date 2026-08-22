'use client';

import { motion, useReducedMotion } from 'motion/react';

// An ellipse of clear, anchored above the panel and growing down through it. What
// it has passed stays revealed, and its own soft rim is the only edge, so nothing
// arrives on a hard line. The softness is the ramp rather than a filter: blurring a
// moving layer over a canvas that redraws every frame costs whole frames.
const CURTAIN =
  'radial-gradient(150% var(--reveal) at 50% -35%, transparent 0%, transparent 72%, oklch(from var(--background) l c h / 0.85) 88%, var(--background) 100%)';

export function PanelReveal() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
      style={{ background: CURTAIN }}
      initial={{ '--reveal': '0%' }}
      animate={{ '--reveal': '260%' }}
      transition={{ duration: 2.1, ease: [0.45, 0, 0.15, 1], delay: 0.15 }}
    />
  );
}
