import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface DiagramProps {
  /** The space the figure is authored in. Everything inside is in these units. */
  width: number;
  height: number;
  /** Read in place of the drawing by anything that cannot see it. */
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A plane to draw a figure on. It owns the coordinate space and the type, and
 * nothing else: no surface, no caption, no state. `Figure` frames it.
 *
 * The box scales with the column while the figure keeps its own units, so a
 * drawing is authored once at whatever size suits it. Lines hold their width
 * through that scaling, which is what `vector-effect` is for; text does not,
 * being the one thing a reader has to read at any width.
 */
export default function Diagram({
  width,
  height,
  title,
  description,
  children,
  className,
}: DiagramProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
      className={cn(
        'h-auto w-full [&_*]:[vector-effect:non-scaling-stroke]',
        'font-mono text-[13px]',
        className
      )}
    >
      <title>{title}</title>
      {description ? <desc>{description}</desc> : null}
      {children}
    </svg>
  );
}
