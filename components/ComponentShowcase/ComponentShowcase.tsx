import type { ReactNode } from 'react';

export interface ShowcaseProps {
  /** Names the row in the dimmest tier. */
  label?: ReactNode;
  children: ReactNode;
}

/**
 * A bed for showing a component's variants and states side by side in the
 * design-system post. Deliberately styleless beyond layout: anything it added
 * would be indistinguishable, on screen, from the component under test.
 */
export default function Showcase({ label, children }: ShowcaseProps) {
  return (
    <div className="my-6 flex flex-col gap-3">
      {label ? (
        <span className="font-mono text-xs uppercase tracking-widest text-subtle-foreground">
          {label}
        </span>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
