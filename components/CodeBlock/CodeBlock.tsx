'use client';

import {
  Children,
  type ComponentPropsWithoutRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

import { CopyButton } from './CopyButton';

type TitleElement = ReactElement<{ children?: ReactNode }>;

function isTitle(child: ReactNode): child is TitleElement {
  return isValidElement(child) && 'data-rehype-pretty-code-title' in (child.props as object);
}

// Distance over which an edge fade reaches full opacity.
const FADE = 24;

export function CodeBlock({ className, children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: 0, right: 0 });

  // Fade the horizontal-overflow shadows in and out with the scroll position.
  useEffect(() => {
    const pre = scrollRef.current?.querySelector('pre');
    if (!pre) return;
    const update = () => {
      const max = pre.scrollWidth - pre.clientWidth;
      if (max <= 1) return setEdges({ left: 0, right: 0 });
      setEdges({
        left: Math.min(pre.scrollLeft / FADE, 1),
        right: Math.min((max - pre.scrollLeft) / FADE, 1),
      });
    };
    update();
    pre.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(pre);
    return () => {
      pre.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

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
      <div ref={scrollRef} className="relative">
        {body}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[70px] bg-gradient-to-r from-[var(--code-bg)] to-transparent transition-opacity duration-150"
          style={{ opacity: edges.left }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-[70px] bg-gradient-to-l from-[var(--code-bg)] to-transparent transition-opacity duration-150"
          style={{ opacity: edges.right }}
        />
      </div>
    </figure>
  );
}
