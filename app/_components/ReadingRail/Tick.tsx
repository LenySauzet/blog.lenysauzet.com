'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { Section } from './rail';

const SECTION_WIDTH = 'w-4';
const SUBSECTION_WIDTH = 'w-3';
const PLAIN_WIDTH = 'w-2';

const BLUR = 6;

/** Lifts a title off whatever the veil has not taken. Invisible above `xl`,
    where nothing passes behind the rail at all. */
const HALO =
  '[text-shadow:0_0_5px_var(--background),0_0_10px_var(--background),0_0_18px_var(--background)]';

/** The reader's place is a tick wearing `--primary`, never a line laid over
    one: two marks at one place cannot stay lined up. */
const lineOf = (section: Section | undefined, pointed: boolean, reached: boolean) => {
  if (reached) return cn(SECTION_WIDTH, 'bg-primary');

  if (section) {
    return cn(
      section.level === 3 ? SUBSECTION_WIDTH : SECTION_WIDTH,
      'bg-muted-foreground'
    );
  }

  return cn(PLAIN_WIDTH, 'bg-muted-foreground/30', pointed && `${SECTION_WIDTH} bg-foreground`);
};

function Title({
  label,
  shown,
  pointed,
}: {
  label: string;
  shown: MotionValue<number>;
  pointed: boolean;
}) {
  // `none` at either end, or every title holds a composited blur layer for the
  // whole life of the page to draw a radius of zero, or one it cannot be seen
  // through at an opacity of zero.
  const blurred = useTransform(shown, (value) =>
    value <= 0 || value >= 1 ? 'none' : `blur(${(1 - value) * BLUR}px)`
  );

  return (
    <motion.span
      data-title
      style={{ opacity: shown, filter: blurred }}
      // Only `translate` transitions. Eased, the colour would answer none of
      // several sections crossed quickly.
      className={cn(
        'font-mono text-[0.6875rem] tracking-wider whitespace-nowrap text-foreground uppercase transition-[translate] duration-200 motion-reduce:transition-none',
        HALO,
        pointed && '-translate-x-1 text-primary'
      )}
    >
      {label}
    </motion.span>
  );
}

interface TickProps {
  progress: number;
  section?: Section;
  pointed: boolean;
  reached: boolean;
  shown?: MotionValue<number>;
}

/** Memoised: the mark moves as the reader scrolls, and redrawing fifty ticks to
    light one of them was measurable. */
export const Tick = memo(function Tick({
  progress,
  section,
  pointed,
  reached,
  shown,
}: TickProps) {
  return (
    <div
      style={{ top: `${progress * 100}%` }}
      className="absolute right-0 flex -translate-y-1/2 items-center justify-end gap-3 pr-5"
    >
      {section && shown && (
        <Title label={section.label} shown={shown} pointed={pointed} />
      )}

      <span
        className={cn(
          'h-px transition-[width] duration-150 motion-reduce:transition-none',
          lineOf(section, pointed, reached)
        )}
      />
    </div>
  );
});
