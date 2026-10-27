import type { ReactNode } from 'react';

import Fullbleed from '@/components/Fullbleed';
import { cn } from '@/lib/utils';

const PANEL = 'rounded-xl border border-(--code-border) bg-(--code-bg)';

export interface PlaygroundProps {
  controls: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Playground({ controls, action, className, children }: PlaygroundProps) {
  return (
    <Fullbleed widthPercent={85}>
      <div
        className={cn(
          'grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2.25fr)]',
          className,
        )}
      >
        <div className={cn(PANEL, 'overflow-hidden md:order-last')}>{children}</div>
        <div className={cn(PANEL, 'flex flex-col gap-4 p-5')}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-subtle-foreground">Uniforms</p>
            {action}
          </div>
          {controls}
        </div>
      </div>
    </Fullbleed>
  );
}
