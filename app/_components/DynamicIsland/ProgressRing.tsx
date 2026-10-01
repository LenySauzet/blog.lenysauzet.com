'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

const SIZE = 30;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ progress }: { progress: MotionValue<number> }) {
  const offset = useTransform(progress, (value) => CIRCUMFERENCE * (1 - value));
  const percent = useTransform(progress, (value) => `${Math.round(value * 100)}`);

  return (
    <div
      aria-hidden
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
    >
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

      <motion.span className="absolute inset-0 grid place-items-center font-mono text-[0.5625rem] tabular-nums text-muted-foreground">
        {percent}
      </motion.span>
    </div>
  );
}
