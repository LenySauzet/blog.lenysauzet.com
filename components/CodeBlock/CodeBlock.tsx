'use client';

import {
  Children,
  type ComponentPropsWithoutRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useRef,
} from 'react';

import { cn } from '@/lib/utils';

import { CopyButton } from './CopyButton';

type TitleElement = ReactElement<{ children?: ReactNode }>;

function isTitle(child: ReactNode): child is TitleElement {
  return isValidElement(child) && 'data-rehype-pretty-code-title' in (child.props as object);
}

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

  const childArray = Children.toArray(children);
  const title = childArray.find(isTitle);
  const body = childArray.filter((child) => !isTitle(child));

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
      {title ? (
        // Own the header so the copy button sits centered in the flex row,
        // rather than floating over a rehype-rendered figcaption.
        <div className="flex items-center justify-between gap-3 border-b border-[var(--code-border)] py-2 pr-2 pl-4">
          <span className="font-display text-sm font-medium text-foreground">
            {title.props.children}
          </span>
          <CopyButton getText={getText} />
        </div>
      ) : (
        <CopyButton
          getText={getText}
          className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        />
      )}
      {body}
    </figure>
  );
}
