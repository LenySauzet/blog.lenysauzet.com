'use client';

import { motion } from 'motion/react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { Section } from './rail';

const SECTION_WIDTH = 'w-4';
const SUBSECTION_WIDTH = 'w-3';
const PLAIN_WIDTH = 'w-2';

/**
 * Where the reader is, is a tick wearing `--primary`, not a line laid over one:
 * two marks at one place can never stay lined up, and there is only ever one
 * line here to get wrong.
 *
 * A section answers the pointer with its title alone; a plain tick has none, so
 * the mark itself reaches out.
 */
const lineOf = (section: Section | undefined, pointed: boolean, reached: boolean) => {
  if (reached) return cn(SECTION_WIDTH, 'bg-primary');

  if (section) {
    const width = section.level === 3 ? SUBSECTION_WIDTH : SECTION_WIDTH;
    return cn(width, 'bg-muted-foreground');
  }

  return cn(PLAIN_WIDTH, 'bg-muted-foreground/30', pointed && `${SECTION_WIDTH} bg-foreground`);
};

interface TickProps {
  progress: number;
  section?: Section;
  pointed: boolean;
  reached: boolean;
  opened: boolean;
  /** Carries the cascade's delay, which is the section's place in the order. */
  reveal: object;
}

/** Memoised because the mark moves as the reader scrolls, and redrawing sixty
    ticks to light one of them was measurable. */
export const Tick = memo(function Tick({
  progress,
  section,
  pointed,
  reached,
  opened,
  reveal,
}: TickProps) {
  return (
    <div
      style={{ top: `${progress * 100}%` }}
      className="absolute right-0 flex -translate-y-1/2 items-center justify-end gap-3 pr-5"
    >
      {section && (
        <motion.span
          initial={false}
          animate={{
            opacity: opened ? 1 : 0,
            filter: opened ? 'blur(0px)' : 'blur(6px)',
          }}
          transition={reveal}
          // The colour is not transitioned: eased, a quick pass over several
          // sections answers none of them.
          className={cn(
            'font-mono text-[0.6875rem] tracking-wider whitespace-nowrap text-foreground uppercase transition-[translate] duration-200 motion-reduce:transition-none',
            pointed && '-translate-x-1 text-primary'
          )}
        >
          {section.label}
        </motion.span>
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
