import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface FigureProps {
  children: ReactNode;
  /** Sits under the surface, in the article's own caption type. */
  caption?: ReactNode;
  /** Inputs that drive the content, laid out in a row under it. */
  controls?: ReactNode;
  className?: string;
}

/**
 * The frame every visual in an article shares, and nothing else: a block of
 * rhythm, a row for whatever drives it, and a caption. It never knows what it
 * contains, which is what lets a chart, a drawing and a canvas sit in the same
 * family without one of them dragging its own layout in.
 *
 * **It draws no surface.** A figure sits in the prose rather than in a box:
 * a card around it fences it off from the paragraph that introduces it, and
 * two framed things in a row (a figure above a `Card`) read as a list of
 * panels rather than as an article. A figure that genuinely needs an edge,
 * such as a canvas whose content runs to its own bounds, draws its own.
 *
 * Server Component. Content that needs state brings its own `'use client'`.
 */
export default function Figure({
  children,
  caption,
  controls,
  className,
}: FigureProps) {
  return (
    <figure className={cn('my-6 flex flex-col gap-3', className)}>
      {children}
      {controls ? (
        // Each control stretches rather than shrinking to its content: a
        // slider with no width is a label and a readout jammed together, which
        // is what a row of `flex` children defaults to.
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 [&>*]:min-w-0 [&>*]:flex-1">
          {controls}
        </div>
      ) : null}
      {caption ? (
        <figcaption className="text-subtle-foreground text-sm leading-6">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
