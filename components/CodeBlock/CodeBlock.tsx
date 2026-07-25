'use client';

import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type ComponentPropsWithoutRef, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function CodeBlock({ className, children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  // Every fenced block is wrapped by rehype-pretty-code; any other <figure>
  // passes straight through untouched.
  if (!('data-rehype-pretty-code-figure' in props)) {
    return (
      <figure className={className} {...props}>
        {children}
      </figure>
    );
  }

  const copy = async () => {
    const lines = ref.current?.querySelectorAll('pre [data-line]');
    // Rebuild newlines from the line elements — CSS line-number counters live in
    // ::before and never enter textContent, so the copy stays clean.
    const code = lines?.length
      ? Array.from(lines, (line) => line.textContent).join('\n')
      : (ref.current?.querySelector('pre')?.textContent ?? '');
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <figure
      ref={ref}
      className={cn(
        'group relative my-6 overflow-hidden rounded-xl border border-border bg-card',
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute top-2.5 right-2.5 z-10 grid size-8 place-items-center rounded-lg border border-border bg-card/70 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} strokeWidth={2} />
      </button>
      {children}
    </figure>
  );
}
