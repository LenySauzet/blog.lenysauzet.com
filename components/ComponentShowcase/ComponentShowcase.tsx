import type { ReactNode } from 'react';

export interface ShowcaseProps {
  label?: ReactNode;
  children: ReactNode;
}

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
