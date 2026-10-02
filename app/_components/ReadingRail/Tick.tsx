'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { Section } from './rail';

const SECTION_WIDTH = 'w-4';
const SUBSECTION_WIDTH = 'w-3';
const PLAIN_WIDTH = 'w-2';

const BLUR = 6;

/** The reader's place is a tick wearing `--primary`, never a line laid over
    one. A section answers the pointer with its title; a plain tick has none,
    so its mark reaches out instead. */
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
  const blurred = useTransform(shown, (value) => `blur(${(1 - value) * BLUR}px)`);

  return (
    <motion.span
      style={{ opacity: shown, filter: blurred }}
      // The colour is not transitioned: eased, a quick pass over several
      // sections answers none of them.
      className={cn(
        'font-mono text-[0.6875rem] tracking-wider whitespace-nowrap text-foreground uppercase transition-[translate] duration-200 motion-reduce:transition-none',
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

/** Memoised because the mark moves as the reader scrolls, and redrawing fifty
    ticks to light one of them was measurable. */
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
      className="absolute right-0 flex -translate-y-1/2 items-center justify-end gap-3 py-2 pr-5"
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
