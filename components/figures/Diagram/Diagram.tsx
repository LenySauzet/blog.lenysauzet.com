import type { ReactNode } from 'react';

import { EASED, blurRamp } from '@/components/ScrollFade/gradients';
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
 *
 * Every edge dissolves. A ray leaving the frame is cut by the viewBox whatever
 * is drawn, and a line stopping dead at an invisible boundary reads as a bug
 * where a fade reads as the figure continuing past what is shown. Four ramps
 * intersected rather than one: a radial mask would pull the corners in on a
 * drawing that is wider than it is tall. A mask and not a colour ramp, for the
 * banding `ScrollFade` was built around.
 */
const FADE = ['to right', 'to left', 'to bottom', 'to top']
  .map((direction) => blurRamp(direction, 88, EASED))
  .join(', ');
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
      style={{ maskImage: FADE, maskComposite: 'intersect' }}
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
