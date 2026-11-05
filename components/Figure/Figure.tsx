import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface FigureProps {
  children: ReactNode;
  caption?: ReactNode;
  className?: string;
}

export default function Figure({
  children,
  caption,
  className,
}: FigureProps) {
  return (
    <figure className={cn('my-6 flex flex-col gap-3', className)}>
      {children}
      {caption ? (
        <figcaption className="text-subtle-foreground text-sm leading-6">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
