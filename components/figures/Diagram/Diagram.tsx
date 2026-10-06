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
 * A plane to draw a figure on: the coordinate space and the type, nothing else.
 * It never shrinks below its own width, scrolling instead, because text scales
 * with the box and a label is unreadable long before the drawing is.
 */
/* Four ramps intersected, not one radial, which pulls the corners in on a wide
   drawing. Narrow: it has to catch a line leaving and nothing named. */
const FADE = ['to right', 'to left', 'to bottom', 'to top']
  .map((direction) => blurRamp(direction, 94, EASED))
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
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
        style={{ maskImage: FADE, maskComposite: 'intersect', minWidth: width }}
        className={cn(
          'h-auto w-full [&_*]:[vector-effect:non-scaling-stroke]',
          'font-mono text-[13px]',
          className,
        )}
      >
        <title>{title}</title>
        {description ? <desc>{description}</desc> : null}
        {children}
      </svg>
    </div>
  );
}
