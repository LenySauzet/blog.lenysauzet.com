import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

function Band({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative hidden border-x border-border [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] lg:block',
        className
      )}
    >
      <div className="hatch absolute inset-0" />
    </div>
  );
}

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
        'grid h-full grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[6rem_1fr_minmax(0,42rem)_1fr_6rem] lg:px-20',
        className
      )}
    >
      <Band />

      <div className="flex flex-col items-center justify-center text-center lg:col-start-3">
        <p
          className={cn(
            'relative font-mono text-[clamp(6rem,30vw,9rem)] leading-none text-transparent [mask-image:linear-gradient(to_bottom,black_40%,transparent_80%)]',
            'animate-[status-rise_0.9s_cubic-bezier(0.22,0.61,0.36,1)_both] motion-reduce:animate-none'
          )}
        >
          {/* Stroked twice as wide, then filled with the page: only the outer half shows. */}
          <span className="[-webkit-text-stroke:2px_var(--subtle-foreground)]">{status}</span>
          <span aria-hidden className="absolute inset-0 text-background">
            {status}
          </span>
        </p>

        <h1
          className={cn(
            'relative mt-4 font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl',
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

      <Band className="lg:col-start-5" />
    </section>
  );
}
