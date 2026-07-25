'use client';

import { Children, type ComponentPropsWithoutRef, isValidElement, useRef } from 'react';

import { cn } from '@/lib/utils';

import { CopyButton } from './CopyButton';

export function CodeBlock({ className, children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  const ref = useRef<HTMLElement>(null);

  // Every fenced block is wrapped by rehype-pretty-code; any other <figure>
  // passes straight through untouched.
  if (!('data-rehype-pretty-code-figure' in props)) {
    return (
      <figure className={className} {...props}>
        {children}
      </figure>
    );
  }

  const hasTitle = Children.toArray(children).some(
    (child) => isValidElement(child) && 'data-rehype-pretty-code-title' in (child.props as object)
  );

  const getText = () => {
    const lines = ref.current?.querySelectorAll('pre [data-line]');
    // Rebuild newlines from the line elements — CSS line-number counters live in
    // ::before and never enter textContent, so the copy stays clean.
    return lines?.length
      ? Array.from(lines, (line) => line.textContent).join('\n')
      : (ref.current?.querySelector('pre')?.textContent ?? '');
  };

  return (
    <figure
      ref={ref}
      className={cn(
        'group relative my-6 overflow-hidden rounded-xl border border-[var(--code-border)] bg-[var(--code-bg)] shadow-sm',
        className
      )}
      {...props}
    >
      <CopyButton
        getText={getText}
        className={cn(
          'absolute top-2 right-2 z-10 backdrop-blur',
          hasTitle ? '' : 'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
        )}
      />
      {children}
    </figure>
  );
}
