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
 * The frame every visual in an article shares, and nothing else: it holds a
 * surface, a row for whatever drives it, and a caption. It never knows what it
 * contains, which is what lets a chart, a drawing and a canvas sit in the same
 * family without one of them dragging its own layout in.
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
      <div className="bg-card overflow-hidden rounded-xl border p-4">
        {children}
      </div>
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
