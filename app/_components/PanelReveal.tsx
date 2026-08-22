'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

// One ellipse travelling down, read twice: the wash hides what its rim has not
// reached, and the blur trails just inside that rim, so the panel surfaces out of
// focus and settles. Its shape is fixed and only its centre moves, which keeps the
// arc from flattening as it crosses and makes the sweep a transform rather than a
// gradient the compositor repaints every frame.
//
// The ellipse sits on the layer's top edge, so only its lower arc exists: centred
// inside, the upper arc would follow the sweep down and cover what it had just
// revealed. That edge is a discontinuity, so the travel ends with it still above the
// panel. Letting it land inside drew a visible rectangular seam.
const ELLIPSE = '95% 56% at 50% 0%';

// Starts with the rim already on the panel's top edge. Any earlier and the opening
// of the sweep is a covered panel holding still.
const TRAVEL = { from: '-53%', to: '0%' };

// Scaled from the top edge, so the ellipse's centre stays where the travel puts it
// and only its radii open up. The arc is at its sharpest while it still has panel to
// cross, and softens into the landing.
const SPREAD = { from: 1, to: 1.3 };

const DURATION = 1.45;

// Barely moving, then away: an accelerating rim reaches the corners at the very end
// of its travel, which is why the blur outlives it rather than sharing its timing.
const EASE = [0.4, 0, 0.7, 0.25] as const;

const SETTLE = { at: 0.9, tail: 0.36 };

const WASH = `radial-gradient(${ELLIPSE}, transparent 0%, transparent 94%, var(--background) 100%)`;

// Ramps in well ahead of the wash, so a band emerges blurred before it is uncovered.
// Its first stop clears the layer's top edge, where the mask would otherwise be
// opaque along a straight line and cut the blur off square.
const BLUR_MASK = `radial-gradient(${ELLIPSE}, transparent 0%, transparent 58%, black 115%)`;

const BLUR = '20px';

export function PanelReveal() {
  const reduceMotion = useReducedMotion();
  const [swept, setSwept] = useState(false);
  if (reduceMotion || swept) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[250%] origin-top"
      initial={{ y: TRAVEL.from, scale: SPREAD.from }}
      animate={{ y: TRAVEL.to, scale: SPREAD.to }}
      transition={{ duration: DURATION, ease: EASE }}
    >
      {/* The rim leaves the corners last, so the mask still holds blur there once the
          travel is over. Fading it out is what keeps the layer from vanishing on a
          frame, and it is the last thing to finish, so it owns the unmount. A
          backdrop filter re-blurs its backdrop for as long as it is mounted. */}
      <motion.div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${BLUR})`,
          WebkitBackdropFilter: `blur(${BLUR})`,
          maskImage: BLUR_MASK,
          WebkitMaskImage: BLUR_MASK,
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{
          duration: DURATION * (1 - SETTLE.at) + SETTLE.tail,
          delay: DURATION * SETTLE.at,
          ease: 'easeInOut',
        }}
        onAnimationComplete={() => setSwept(true)}
      />
      <div className="absolute inset-0" style={{ background: WASH }} />
    </motion.div>
  );
}
