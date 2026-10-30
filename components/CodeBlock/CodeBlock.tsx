'use client';

import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Children,
  type ComponentPropsWithoutRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
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

// A block longer than this folds to its first 16 lines, the `16lh` below: folding
// less than a third of it would hide too little to be worth the click.
const FOLD_ABOVE = 24;

function countLines(node: ReactNode): number {
  return Children.toArray(node).reduce<number>((count, child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return count;
    return count + ('data-line' in child.props ? 1 : countLines(child.props.children));
  }, 0);
}

function CodeFigure({ className, children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  const figureRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const regionId = useId();
  const [expanded, setExpanded] = useState(false);

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
  const lineCount = countLines(body);
  const folded = lineCount > FOLD_ABOVE && !expanded;

  const toggle = () => {
    setExpanded(!expanded);
    // Folding pulls the button up past a reader scrolled deep into the block.
    if (expanded) figureRef.current?.scrollIntoView({ block: 'nearest' });
  };

  const getText = () => {
    // Rebuilt from the line elements so the CSS line-number counters, which live
    // in ::before, stay out of the copied text, and without the lines a diff
    // removes, so what is pasted is the code the post arrives at.
    const lines = figureRef.current?.querySelectorAll('pre [data-line]:not(.remove)');
    return lines?.length
      ? Array.from(lines, (line) => line.textContent).join('\n')
      : (figureRef.current?.querySelector('pre')?.textContent ?? '');
  };

  return (
    <figure
      ref={figureRef}
      className={cn(
        'group relative my-6 overflow-hidden rounded-frame-xl border border-[var(--code-border)] bg-[var(--code-bg)] shadow-sm',
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
          className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 any-pointer-coarse:opacity-100"
        />
      )}
      {/* Names the scrollable region. The <pre> is already tab-focusable
          (rehype-pretty-code sets tabindex). */}
      <div
        ref={scrollRef}
        id={regionId}
        role="region"
        aria-label={label ?? 'Code'}
        className={cn(
          'relative',
          folded && '[&_pre]:max-h-[calc(16lh+0.75rem)] [&_pre]:overflow-y-hidden print:[&_pre]:max-h-none'
        )}
      >
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
        {folded && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--code-bg)] to-transparent print:hidden"
          />
        )}
      </div>
      {lineCount > FOLD_ABOVE && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={toggle}
          className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--code-border)] py-2 font-display text-sm text-muted-foreground transition-colors outline-none hover:bg-foreground/[0.04] hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset print:hidden"
        >
          {expanded ? 'Show less' : `Show all ${lineCount} lines`}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden="true"
            className={cn('size-4 transition-transform motion-reduce:transition-none', expanded && 'rotate-180')}
          />
        </button>
      )}
    </figure>
  );
}
