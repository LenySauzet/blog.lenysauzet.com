'use client';

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

import { cn } from '@/lib/utils';

import { CodeHeader } from './CodeHeader';
import { CopyButton } from './CopyButton';
import { FoldButton } from './FoldButton';
import { LOG_LEVELS, readCode } from './read-code';

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

// A block longer than this folds to its first 16 lines (globals.css): folding less
// than a third of it would hide too little to be worth the click.
const FOLD_ABOVE = 24;

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
  const heading = title?.props.children ?? level?.label;
  const named = title && level ? `${level.label}: ` : '';
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

  // From the line elements, so the line numbers in ::before stay out, and without
  // the lines a diff removes: what is pasted is the code the post arrives at.
  const getText = () => {
    const lineElements = figureRef.current?.querySelectorAll('pre [data-line]:not(.remove)');
    return lineElements?.length
      ? Array.from(lineElements, (line) => (line.textContent ?? '').trimEnd()).join('\n')
      : (figureRef.current?.querySelector('pre')?.textContent ?? '');
  };

  return (
    <figure
      ref={figureRef}
      data-variant={variant}
      className={cn(
        'group relative my-6 overflow-hidden rounded-frame-xl border border-[var(--code-border)] bg-[var(--code-bg)] shadow-sm',
        level?.accent,
        className
      )}
      {...props}
    >
      {heading ? (
        <CodeHeader
          heading={heading}
          titled={Boolean(title)}
          level={level}
          added={added}
          removed={removed}
          getText={getText}
        />
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
        data-foldable={foldable || undefined}
        data-folded={folded || undefined}
        className="relative"
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
            className="pointer-events-none absolute inset-x-0 bottom-[var(--scrollbar,0px)] h-48 bg-gradient-to-t from-[var(--code-bg)] from-35% to-transparent backdrop-blur-[4px] [mask-image:linear-gradient(to_top,#000_50%,transparent)] print:hidden [@media(scripting:none)]:hidden"
          />
        )}
      </div>
      {foldable && (
        <FoldButton expanded={expanded} lines={lines} controls={regionId} onToggle={toggle} />
      )}
    </figure>
  );
}
