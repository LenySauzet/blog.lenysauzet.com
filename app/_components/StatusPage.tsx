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
        'grid h-full grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[1fr_6rem_minmax(0,42rem)_6rem_1fr] lg:px-0',
        className
      )}
    >
      <div aria-hidden className={cn(HATCH, 'lg:col-start-2')} />

      <div className="flex flex-col items-center justify-center text-center lg:col-start-3">
        <p
          className={cn(
            'group/status cursor-default font-serif text-[clamp(9rem,44vw,15rem)] leading-none tracking-tight [mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)]',
            'animate-[status-rise_0.9s_cubic-bezier(0.22,0.61,0.36,1)_both] motion-reduce:animate-none'
          )}
        >
          <span
            className={cn(
              'bg-[linear-gradient(110deg,var(--foreground)_40%,var(--primary)_50%,var(--foreground)_60%)] bg-[length:250%_100%] bg-clip-text text-transparent [background-position:100%_0]',
              'animate-[status-shine_1.8s_cubic-bezier(0.45,0,0.2,1)_0.7s_both]',
              'group-hover/status:animate-[status-shine-again_1.8s_cubic-bezier(0.45,0,0.2,1)_both]',
              'motion-reduce:animate-none motion-reduce:group-hover/status:animate-none'
            )}
          >
            {status}
          </span>
        </p>

        <h1
          className={cn(
            '-mt-6 font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl',
            'animate-[status-rise_0.9s_cubic-bezier(0.22,0.61,0.36,1)_0.12s_both] motion-reduce:animate-none'
          )}
        >
          {title}
        </h1>

        <div
          className={cn(
            'mt-6 flex max-w-md flex-col items-center gap-6 font-display text-base leading-7 text-muted-foreground',
            'animate-[status-rise_0.9s_cubic-bezier(0.22,0.61,0.36,1)_0.24s_both] motion-reduce:animate-none'
          )}
        >
          {children}
        </div>
      </div>

      <div aria-hidden className={cn(HATCH, 'lg:col-start-4')} />
    </section>
  );
}
