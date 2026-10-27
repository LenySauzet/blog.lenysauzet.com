import type { ReactNode } from 'react';

import Fullbleed from '@/components/Fullbleed';
import { cn } from '@/lib/utils';

export interface PlaygroundProps {
  controls: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Playground({ controls, className, children }: PlaygroundProps) {
  return (
    <Fullbleed widthPercent={85}>
      <div
        className={cn(
          'grid overflow-hidden rounded-xl border border-(--code-border) bg-(--code-bg) md:grid-cols-[minmax(0,1fr)_minmax(0,2.25fr)]',
          className,
        )}
      >
        <div className="border-b border-(--code-border) md:order-last md:border-b-0 md:border-l">
          {children}
        </div>
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-subtle-foreground">Uniforms</p>
          {controls}
        </div>
      </div>
    </Fullbleed>
  );
}
