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

const DURATION = 2.2;

// Near linear while the rim crosses, easing only once it is off the bottom. The
// previous curve put the crossing in the first 46% and stalled for the rest.
const EASE = [0.35, 0.08, 0.6, 1] as const;

// The rim clears the panel here, which is where the blur has nothing left to reveal.
const SETTLE = 0.55;

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
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[250%]"
      initial={{ y: TRAVEL.from }}
      animate={{ y: TRAVEL.to }}
      transition={{ duration: DURATION, ease: EASE }}
      onAnimationComplete={() => setSwept(true)}
    >
      {/* The rim leaves the corners last, so the mask still holds blur there when the
          travel ends. Fading it out is what keeps the layer from vanishing on a
          frame. A backdrop filter also re-blurs its backdrop for as long as it is
          mounted, which is why the whole component goes once the sweep is over. */}
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
          duration: DURATION * (1 - SETTLE),
          delay: DURATION * SETTLE,
          ease: 'easeInOut',
        }}
      />
      <div className="absolute inset-0" style={{ background: WASH }} />
    </motion.div>
  );
}
