'use client';

import {
  Children,
  type ComponentPropsWithoutRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';

import { cn } from '@/lib/utils';

import { CopyButton } from './CopyButton';

type TitleElement = ReactElement<{ children?: ReactNode }>;

function isTitle(child: ReactNode): child is TitleElement {
  return isValidElement(child) && 'data-rehype-pretty-code-title' in (child.props as object);
}

// Any other <figure> passes straight through, so only real code blocks pay for
// the hooks below.
export function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  if (!('data-rehype-pretty-code-figure' in props)) {
    return <figure {...props}>{children}</figure>;
  }
  return <CodeFigure {...props}>{children}</CodeFigure>;
}

// Distance over which an edge fade reaches full opacity.
const FADE = 24;

function CodeFigure({ className, children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  const figureRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Written as CSS custom properties via ref so scrolling never re-renders React.
  useEffect(() => {
    const container = scrollRef.current;
    const pre = container?.querySelector('pre');
    if (!container || !pre) return;
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const update = () => {
      const max = pre.scrollWidth - pre.clientWidth;
      const left = max <= 1 ? 0 : clamp(pre.scrollLeft / FADE);
      const right = max <= 1 ? 0 : clamp((max - pre.scrollLeft) / FADE);
      container.style.setProperty('--edge-left', String(left));
      container.style.setProperty('--edge-right', String(right));
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

  const childArray = Children.toArray(children);
  const title = childArray.find(isTitle);
  const body = childArray.filter((child) => !isTitle(child));
  const label = typeof title?.props.children === 'string' ? title.props.children : undefined;

  const getText = () => {
    const lines = figureRef.current?.querySelectorAll('pre [data-line]');
    // Rebuilt from the line elements so the CSS line-number counters, which live
    // in ::before, stay out of the copied text.
    return lines?.length
      ? Array.from(lines, (line) => line.textContent).join('\n')
      : (figureRef.current?.querySelector('pre')?.textContent ?? '');
  };

  return (
    <figure
      ref={figureRef}
      className={cn(
        'group relative my-6 overflow-hidden rounded-xl border border-[var(--code-border)] bg-[var(--code-bg)] shadow-sm',
        className
      )}
      {...props}
    >
      {title ? (
        // Our own header, so the copy button sits in the flex row instead of
        // floating over rehype's figcaption.
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
      {/* Names the scrollable region. The <pre> is already tab-focusable
          (rehype-pretty-code sets tabindex). */}
      <div ref={scrollRef} role="region" aria-label={label ?? 'Code'} className="relative">
        {body}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[70px] bg-gradient-to-r from-[var(--code-bg)] to-transparent transition-opacity duration-150"
          style={{ opacity: 'var(--edge-left, 0)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-[70px] bg-gradient-to-l from-[var(--code-bg)] to-transparent transition-opacity duration-150"
          style={{ opacity: 'var(--edge-right, 0)' }}
        />
      </div>
    </figure>
  );
}
