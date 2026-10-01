'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

// The island's inner height: a disc inset by the same amount on three sides is
// concentric with the cap it sits in.
const SIZE = 30;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * How far through the article the reader is. Both the arc and the number are fed
 * the motion value directly, so scrolling never re-renders React: a transform
 * drives the dash offset, and Motion writes the text content itself.
 *
 * Decorative. The reading position is not something this surface owes a screen
 * reader, and announcing it on every scroll would be noise.
 */
export function ProgressRing({ progress }: { progress: MotionValue<number> }) {
  const offset = useTransform(progress, (value) => CIRCUMFERENCE * (1 - value));
  const percent = useTransform(progress, (value) => `${Math.round(value * 100)}`);

  return (
    <div aria-hidden className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted-foreground/20"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: offset }}
          className="stroke-primary"
        />
      </svg>

      {/* Tabular, or the box width changes with the glyphs and the island morphs
          on every percent. */}
      <motion.span className="absolute inset-0 grid place-items-center font-mono text-[0.5625rem] tabular-nums text-muted-foreground">
        {percent}
      </motion.span>
    </div>
  );
}
