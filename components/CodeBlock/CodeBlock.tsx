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
import { flushSync } from 'react-dom';

import { glassSurface } from '@/components/ui/glass';
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

interface CodeStats {
  lines: number;
  added: number;
  removed: number;
  variant?: string;
}

interface CodeProps {
  children?: ReactNode;
  className?: string;
  'data-variant'?: string;
}

// Read off the markup rehype-pretty-code emits: a line is a `data-line` span, a
// diff marks it `add` or `remove`, and a fence's variant sits on its <pre>.
function readCode(node: ReactNode, stats: CodeStats = { lines: 0, added: 0, removed: 0 }) {
  Children.forEach(node, (child) => {
    if (!isValidElement<CodeProps>(child)) return;
    const { props } = child;
    stats.variant ??= props['data-variant'];
    if (!('data-line' in props)) {
      readCode(props.children, stats);
      return;
    }
    const classes = props.className?.split(' ') ?? [];
    stats.lines += 1;
    if (classes.includes('add')) stats.added += 1;
    if (classes.includes('remove')) stats.removed += 1;
  });
  return stats;
}

// A log block's level in words, its colour alone not saying it: the title when the
// fence gives none, and read before the one it gives. lib/rehype-code.mjs admits the
// same three.
const LOG_LEVELS = new Map([
  ['info', 'Info'],
  ['warning', 'Warning'],
  ['danger', 'Error'],
]);

function CodeFigure({ className, children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  const figureRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const regionId = useId();
  const [expanded, setExpanded] = useState(false);

  // Written as CSS custom properties via ref so scrolling never re-renders React.
  useEffect(() => {
    const figure = figureRef.current;
    const pre = scrollRef.current?.querySelector('pre');
    if (!figure || !pre) return;
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const update = () => {
      const max = pre.scrollWidth - pre.clientWidth;
      const left = max <= 1 ? 0 : clamp(pre.scrollLeft / FADE);
      const right = max <= 1 ? 0 : clamp((max - pre.scrollLeft) / FADE);
      figure.style.setProperty('--edge-left', String(left));
      figure.style.setProperty('--edge-right', String(right));
      figure.style.setProperty('--scrollbar', `${pre.offsetHeight - pre.clientHeight}px`);
      // Find in page scrolls a folded block down, past lines no reader could
      // scroll back to: unfold it instead.
      if (pre.scrollTop > 0) setExpanded(true);
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
  const { lines, added, removed, variant } = readCode(body);
  const foldable = lines > FOLD_ABOVE;
  const folded = foldable && !expanded;
  const level = variant ? LOG_LEVELS.get(variant) : undefined;
  const heading = title?.props.children ?? level;
  const named = title && level ? `${level}: ` : '';
  const label = typeof heading === 'string' ? named + heading : undefined;

  const toggle = () => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    // Folding pulls the button up past a reader scrolled deep into the block, so
    // the block is brought back once it has shrunk, not measured before.
    flushSync(() => setExpanded(false));
    figureRef.current?.scrollIntoView({ block: 'nearest' });
  };

  const getText = () => {
    // Rebuilt from the line elements so the CSS line-number counters, which live
    // in ::before, stay out of the copied text, and without the lines a diff
    // removes, so what is pasted is the code the post arrives at. A diff line
    // keeps the space that stood before its stripped notation.
    const lineElements = figureRef.current?.querySelectorAll('pre [data-line]:not(.remove)');
    return lineElements?.length
      ? Array.from(lineElements, (line) =>
          line.classList.contains('diff') ? (line.textContent ?? '').trimEnd() : line.textContent
        ).join('\n')
      : (figureRef.current?.querySelector('pre')?.textContent ?? '');
  };

  return (
    <figure
      ref={figureRef}
      data-variant={variant}
      className={cn(
        'group relative my-6 overflow-hidden rounded-frame-xl border border-[var(--code-border)] bg-[var(--code-bg)] shadow-sm',
        className
      )}
      {...props}
    >
      {heading ? (
        // Our own header, so the copy button sits in the flex row instead of
        // floating over rehype's figcaption.
        <div
          className={cn(
            'flex items-center justify-between gap-3 py-2 pr-2 pl-4',
            !level && 'border-b border-[var(--code-border)]'
          )}
        >
          <div className="flex min-w-0 items-baseline gap-3">
            <span
              className={cn(
                'min-w-0 font-display text-sm font-medium wrap-anywhere',
                level ? 'text-[var(--code-ink)]' : 'text-foreground'
              )}
            >
              {title && level && <span className="sr-only">{level}: </span>}
              {heading}
            </span>
            {added + removed > 0 && (
              <span className="shrink-0 font-mono text-xs tabular-nums">
                <span aria-hidden="true">
                  <span className="text-[var(--code-added-ink)]">+{added}</span>
                  <span className="text-subtle-foreground"> / </span>
                  <span className="text-[var(--code-removed-ink)]">−{removed}</span>
                </span>
                <span className="sr-only">
                  {[added && `${added} added`, removed && `${removed} removed`].filter(Boolean).join(', ')}
                </span>
              </span>
            )}
          </div>
          <CopyButton
            getText={getText}
            className={cn(
              level &&
                'text-[var(--code-ink)] hover:bg-[var(--code-wash)] hover:text-[var(--code-ink)] focus-visible:bg-[var(--code-wash)] focus-visible:text-[var(--code-ink)]'
            )}
          />
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
        data-folded={folded || undefined}
        className={cn(
          'relative data-folded:[&_pre]:max-h-[calc(16lh+0.75rem+var(--scrollbar,0px))] data-folded:[&_pre]:overflow-y-hidden print:data-folded:[&_pre]:max-h-none',
          // Room under the last line for the button floating over it. Important, to
          // beat the padding globals.css gives every fenced <pre>.
          foldable && '[&_pre]:pb-14! print:[&_pre]:pb-3!'
        )}
      >
        {body}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-[var(--scrollbar,0px)] left-0 w-[70px] bg-gradient-to-r from-[var(--code-bg)] to-transparent transition-opacity duration-150"
          style={{ opacity: 'var(--edge-left, 0)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-[var(--scrollbar,0px)] right-0 w-[70px] bg-gradient-to-l from-[var(--code-bg)] to-transparent transition-opacity duration-150"
          style={{ opacity: 'var(--edge-right, 0)' }}
        />
        {folded && (
          // The fold's veil: the background rising over the last lines, and a blur
          // that deepens with it, so they recede rather than stop.
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-[var(--scrollbar,0px)] h-48 bg-gradient-to-t from-[var(--code-bg)] from-35% to-transparent backdrop-blur-[4px] [mask-image:linear-gradient(to_top,#000_50%,transparent)] print:hidden"
          />
        )}
      </div>
      {foldable && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={toggle}
          className={cn(
            glassSurface,
            'absolute bottom-[calc(var(--scrollbar,0px)+0.75rem)] left-1/2 z-10 flex h-8 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full px-3.5 font-display text-sm text-muted-foreground shadow-sm transition-[background-color,color,scale] duration-200 outline-none hover:scale-[1.03] hover:bg-card hover:text-foreground active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 print:hidden'
          )}
        >
          {expanded ? 'Show less' : `Show all ${lines} lines`}
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
