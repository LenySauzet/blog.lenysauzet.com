import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface ShowcaseProps {
  /** Optional caption for the row, in the dimmest tier. */
  label?: ReactNode;
  /** Lay children out in a column instead of a wrapping row. */
  stack?: boolean;
  children: ReactNode;
}

/**
 * A neutral bed for showing a component's variants and states side by side in
 * the design-system post. Deliberately styleless beyond layout: anything it
 * added would be indistinguishable, on screen, from the component under test.
 */
export default function Showcase({ label, stack, children }: ShowcaseProps) {
  return (
    <div className="my-6 flex flex-col gap-3">
      {label ? (
        <span className="font-mono text-xs uppercase tracking-widest text-subtle-foreground">
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          'flex items-center gap-3',
          stack ? 'flex-col items-start' : 'flex-wrap'
        )}
      >
        {children}
      </div>
    </div>
  );
}
