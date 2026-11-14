import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface StatusPageProps {
  status: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function StatusPage({ status, title, children, className }: StatusPageProps) {
  return (
    <section className={cn('flex h-full items-center px-4', className)}>
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-mono text-sm uppercase text-subtle-foreground">{status}</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight text-balance">
          {title}
        </h1>
        <div className="mt-6 flex flex-col items-start gap-6 font-display text-base leading-7 text-muted-foreground">
          {children}
        </div>
      </div>
    </section>
  );
}
