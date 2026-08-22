'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

// A circle opening out of the top left corner: the wash hides what its rim has not
// reached, while the whole panel resolves out of focus behind it. Its radius is fixed
// and only its centre moves, so the sweep is a transform rather than a gradient the
// compositor repaints every frame.
//
// The circle sits on the layer's own top left corner, so only the quarter arc reaching
// into the panel exists: centred inside, the far arcs would follow the sweep and cover
// what had just been revealed. Those two edges are discontinuities, so the travel ends
// with them exactly on the panel's corner and never past it. Letting one land inside
// drew a visible rectangular seam.
//
// The layer is square and sized off whichever axis the panel is longer on, so the
// travel is a true diagonal and the far corner is still reached on a wide screen: in
// viewport height alone, a panel wider than tall was left with a corner the rim never
// covered. Being square is also what makes the gradient below a circle, since a radius
// given as a percentage has no meaning for `circle`.
const SIDE = 'max(240vh, 130vw)';
const RADIUS = '75%';
const TRAVEL = { from: '-55%', to: '0%' };

// A quarter of the radius of falloff, which on a 900px panel is some 400px. Widening
// it is what forces the circle to be this large: every panel corner has to sit inside
// the clear stop by the end, not merely inside the circle.
const WASH = `radial-gradient(${RADIUS} ${RADIUS} at 0% 0%, transparent 0%, transparent 75%, oklch(from var(--background) l c h / 0.35) 87%, var(--background) 100%)`;

const DURATION = 1.15;

// Even the whole way. Shaping it either way was worse: accelerating, the rim arrived
// at nearly its top speed and stopped dead. At constant speed the stop lands after
// the rim has left the panel, so there is nothing left on screen to see it happen.
const EASE = 'linear' as const;

const DEFOCUS = '14px';

// Outlasts the sweep: pulling focus in step with the rim resolved the panel before
// the eye had settled on it.
const DEFOCUS_FADE = 1.95;

export function PanelReveal() {
  const reduceMotion = useReducedMotion();
  const [swept, setSwept] = useState(false);
  if (reduceMotion || swept) return null;

  return (
    <>
      {/* Over the panel rather than inside the travelling layer, which is several
          panels across: blurring that much surface would cost several times what this
          does. A backdrop filter re-blurs its backdrop every frame for as long as it
          is mounted, which is why the whole component goes once the sweep is over. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backdropFilter: `blur(${DEFOCUS})`,
          WebkitBackdropFilter: `blur(${DEFOCUS})`,
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: DEFOCUS_FADE, ease: EASE }}
        onAnimationComplete={() => setSwept(true)}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10"
        style={{ width: SIDE, height: SIDE, background: WASH }}
        initial={{ x: TRAVEL.from, y: TRAVEL.from }}
        animate={{ x: TRAVEL.to, y: TRAVEL.to }}
        transition={{ duration: DURATION, ease: EASE }}
      />
    </>
  );
}
