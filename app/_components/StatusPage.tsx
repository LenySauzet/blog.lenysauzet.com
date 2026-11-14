import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const HATCH =
  'hidden border-x border-border bg-[repeating-linear-gradient(-45deg,var(--border)_0_1px,transparent_1px_12px)] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] lg:block';

interface StatusPageProps {
  status: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function StatusPage({ status, title, children, className }: StatusPageProps) {
  return (
    <section
      className={cn(
        'grid h-full grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[6rem_1fr_minmax(0,42rem)_1fr_6rem] lg:px-0',
        className
      )}
    >
      <div aria-hidden className={HATCH} />

      <div className="flex flex-col items-center justify-center text-center lg:col-start-3">
        <p
          className={cn(
            'font-mono text-[clamp(8rem,40vw,14rem)] leading-none text-subtle-foreground [mask-image:linear-gradient(to_bottom,black_20%,transparent_85%)]',
            'animate-[status-rise_0.9s_cubic-bezier(0.22,0.61,0.36,1)_both] motion-reduce:animate-none'
          )}
        >
          {status}
        </p>

        <h1
          className={cn(
            'relative -mt-12 font-serif text-4xl leading-tight tracking-tight text-balance sm:-mt-20 sm:text-5xl',
            'animate-[status-rise_0.9s_cubic-bezier(0.22,0.61,0.36,1)_0.12s_both] motion-reduce:animate-none'
          )}
        >
          {title}
        </h1>

        <div
          className={cn(
            'mt-6 flex items-center gap-2 font-display text-base text-muted-foreground',
            'animate-[status-rise_0.9s_cubic-bezier(0.22,0.61,0.36,1)_0.24s_both] motion-reduce:animate-none'
          )}
        >
          {children}
        </div>
      </div>

      <div aria-hidden className={cn(HATCH, 'lg:col-start-5')} />
    </section>
  );
}
