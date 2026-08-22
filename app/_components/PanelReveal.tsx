'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

// An ellipse opening out of the top left corner: the wash hides what its rim has not
// reached, while the whole panel resolves out of focus behind it. Its shape is fixed
// and only its centre moves, which keeps the arc from flattening as it crosses and
// makes the sweep a transform rather than a gradient the compositor repaints every
// frame.
//
// The ellipse sits on the layer's own top left corner, so only the quarter arc
// reaching into the panel exists: centred inside, the far arcs would follow the sweep
// and cover what had just been revealed. Those two edges are discontinuities, so the
// travel ends with them exactly on the panel's corner and never past it. Letting one
// land inside drew a visible rectangular seam.
const ELLIPSE = '74% 74% at 0% 0%';

// Far enough up and left that the panel's near corner is still washed at the first
// frame, and no further: the sweep should open, not wait.
const TRAVEL = { from: '-56%', to: '0%' };

// Scaled from that same corner, so the ellipse's centre stays where the travel puts
// it and only its radii open up. The arc is at its sharpest while it still has panel
// to cross, and softens into the landing.
const SPREAD = { from: 1, to: 1.3 };

const DURATION = 1.15;

// Even the whole way. Shaping it either way was worse: accelerating, the rim arrived
// at nearly its top speed and stopped dead. At constant speed the stop lands after
// the rim has left the panel, so there is nothing left on screen to see it happen.
const EASE = 'linear' as const;

const WASH = `radial-gradient(${ELLIPSE}, transparent 0%, transparent 94%, var(--background) 100%)`;

const DEFOCUS = '14px';

export function PanelReveal() {
  const reduceMotion = useReducedMotion();
  const [swept, setSwept] = useState(false);
  if (reduceMotion || swept) return null;

  return (
    <>
      {/* Over the panel rather than inside the travelling layer, which is two and a
          half panels tall and scaling: blurring that much surface would cost several
          times what this does. A backdrop filter re-blurs its backdrop every frame
          for as long as it is mounted, which is why the whole component goes once
          the sweep is over. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backdropFilter: `blur(${DEFOCUS})`,
          WebkitBackdropFilter: `blur(${DEFOCUS})`,
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: DURATION, ease: EASE }}
        onAnimationComplete={() => setSwept(true)}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10 h-[235%] w-[235%] origin-top-left"
        style={{ background: WASH }}
        initial={{ x: TRAVEL.from, y: TRAVEL.from, scale: SPREAD.from }}
        animate={{ x: TRAVEL.to, y: TRAVEL.to, scale: SPREAD.to }}
        transition={{ duration: DURATION, ease: EASE }}
      />
    </>
  );
}
