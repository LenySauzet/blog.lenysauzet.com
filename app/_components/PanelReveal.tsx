'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

// One ellipse travelling down, read twice: the wash hides what its rim has not
// reached, and the blur trails just inside that rim, so the panel surfaces out of
// focus and settles. Its shape is fixed and only its centre moves, which keeps the
// arc from flattening as it crosses and makes the sweep a transform rather than a
// gradient the compositor repaints every frame.
//
// It sits on the layer's top edge, so only its lower arc exists: centred inside, the
// upper arc would follow the sweep down and cover the panel it had just revealed.
// Everything above the layer is therefore revealed for good, which is why the layer
// runs to twice the panel and starts well above it.
const ELLIPSE = '75% 35% at 50% 0%';
const TRAVEL = { from: '-28%', to: '42%' };

const WASH = `radial-gradient(${ELLIPSE}, transparent 0%, transparent 72%, oklch(from var(--background) l c h / 0.88) 88%, var(--background) 100%)`;

// Ramps in well ahead of the wash, so a band emerges blurred before it is uncovered.
const BLUR_MASK = `radial-gradient(${ELLIPSE}, transparent 0%, transparent 38%, black 70%, black 100%)`;

const BLUR = '20px';

export function PanelReveal() {
  const reduceMotion = useReducedMotion();
  const [swept, setSwept] = useState(false);
  if (reduceMotion || swept) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[200%]"
      initial={{ y: TRAVEL.from }}
      animate={{ y: TRAVEL.to }}
      transition={{ duration: 2.8, ease: [0.3, 0.2, 0.35, 1] }}
      onAnimationComplete={() => setSwept(true)}
    >
      {/* A backdrop filter re-blurs its backdrop every frame for as long as it is
          mounted, so it leaves with the sweep rather than lingering transparent. */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${BLUR})`,
          WebkitBackdropFilter: `blur(${BLUR})`,
          maskImage: BLUR_MASK,
          WebkitMaskImage: BLUR_MASK,
        }}
      />
      <div className="absolute inset-0" style={{ background: WASH }} />
    </motion.div>
  );
}
