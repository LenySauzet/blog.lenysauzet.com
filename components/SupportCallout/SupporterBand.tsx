'use client';

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import {
  formatAmount,
  type Supporter,
  type SupportersResponse,
} from '@/lib/supporters';
import { cn } from '@/lib/utils';

const PIXELS_PER_SECOND = 32;

// Sized in names, not pixels, so restyling a row cannot leave four and a sliver.
const ROWS_IN_VIEW = 5;

/** First paint only, until the row is measured. */
const ESTIMATED_ROW_HEIGHT = 41;

// Damping ratio 1.18. Under 1 the speed overshoots, which runs the list backwards; at 1
// it stops as abruptly as it can without that. Over-damped buys the slow tail.
const SPEED_SPRING = { stiffness: 26, damping: 12, mass: 1 };

// Mask ramps the opacity, the blur bands ramp the focus, as `ScrollFade` does it.
const EDGE_MASK =
  'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)';

const blurRamp = (direction: string) =>
  `linear-gradient(${direction}, black 0%, transparent 100%)`;

const EDGE_BLUR = '3px';

// A ratio of names, not of pixels: row height is on both sides and cancels. Measuring
// it instead fed the answer back into its own input and ran away to 317 repeats.
export const repeatsToFill = (count: number) =>
  count > 0 ? Math.max(1, Math.ceil(ROWS_IN_VIEW / count)) : 1;

// Space-grouped: in monospace a comma beside "total" reads as punctuation.
const groupThousands = (value: number) =>
  value.toLocaleString('en-US').replace(/,/g, ' ');

export default function SupporterBand() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [total, setTotal] = useState(0);
  // Hover and focus are tracked apart, then combined. One flag lets a pointer leaving
  // resume a band that still has focus, and a blur resume one still under the pointer.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [rowHeight, setRowHeight] = useState(ESTIMATED_ROW_HEIGHT);
  const reduceMotion = useReducedMotion();

  const listRef = useRef<HTMLUListElement>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const offset = useMotionValue(0);
  const count = supporters.length;
  const speed = useSpring(1, SPEED_SPRING);

  // Reduced motion drops the apparatus, not just the movement: a frozen window of
  // repeated names reads as a duplication bug.
  const paused = hovered || focused;
  const scrolls = !reduceMotion;
  const copies = scrolls ? 2 * repeatsToFill(count) : 1;
  const bandHeight = rowHeight * ROWS_IN_VIEW;

  // Fetched from the browser, not passed down: posts are statically generated, so a
  // build-time read would freeze the names until the next deploy.
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/supporters', { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<SupportersResponse>) : null))
      .then((data) => {
        if (!data) return;
        setSupporters(data.supporters);
        setTotal(data.total);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // The observer measures, including the first time, since it fires on observe.
  // Reading inline here would be a render feeding a render.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !scrolls) return;

    const observer = new ResizeObserver(() => {
      if (row.offsetHeight) setRowHeight(row.offsetHeight);
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [scrolls]);

  useEffect(() => {
    speed.set(paused ? 0 : 1);
  }, [paused, speed]);

  // Wrapped against one copy, not the window, so the seam lands where the copy ended.
  useAnimationFrame((_, delta) => {
    const list = listRef.current;
    if (!list || !scrolls) return;
    const copy = list.scrollHeight / 2;
    if (!copy) return;
    const next = offset.get() - (speed.get() * PIXELS_PER_SECOND * delta) / 1000;
    offset.set(next <= -copy ? next + copy : next);
  });

  if (!supporters.length) return null;

  return (
    <div data-slot="supporter-band" className="border-t border-border">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        <span className="flex items-center gap-2.5">
          <PulseDot />
          Recent supporters
        </span>
        <span className="text-foreground tabular-nums">
          {groupThousands(total)}{' '}
          <span className="text-muted-foreground">total</span>
        </span>
      </div>

      {/* Endless motion needs a stop that is not the mouse (WCAG 2.2.2). No
          `outline-none` here: in Tailwind v4 it sets `outline-style: none` for the
          element, which the focus-visible width then inherits and never paints. Inset
          because the card clips its overflow. */}
      <div
        data-slot="supporter-scroller"
        data-paused={(scrolls && paused) || undefined}
        data-still={!scrolls || undefined}
        {...(scrolls && {
          tabIndex: 0,
          role: 'group',
          'aria-label': 'Recent supporters, scrolling. Hover or focus to pause.',
        })}
        className="relative focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        style={scrolls ? { height: bandHeight } : undefined}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <div
          className={cn('overflow-hidden', scrolls && 'absolute inset-0')}
          style={
            scrolls
              ? { maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }
              : undefined
          }
        >
          <motion.ul ref={listRef} style={{ y: scrolls ? offset : 0 }}>
            {/* Twice, so the list wraps without a gap. Only the first pass is
                announced; the rest are the same names again. */}
            {Array.from({ length: copies }, (_, pass) =>
              supporters.map((supporter, index) => (
                <li
                  key={`${pass}-${index}`}
                  ref={pass === 0 && index === 0 ? rowRef : undefined}
                  aria-hidden={pass > 0 || undefined}
                  // `mx-5`, not `px-5`: padding would leave the rule spanning the card.
                  className="flex items-center justify-between border-b border-border/60 mx-5 py-2.5 font-mono text-sm"
                >
                  <span className="text-muted-foreground">{supporter.name}</span>
                  <span className="text-primary tabular-nums">
                    {formatAmount(supporter)}
                    {supporter.recurring && (
                      <span className="text-subtle-foreground"> / mo</span>
                    )}
                  </span>
                </li>
              ))
            )}
          </motion.ul>
        </div>

        {/* Siblings of the masked list: a child would be erased by that mask. */}
        {scrolls && (
          <>
            <EdgeBlur edge="top" />
            <EdgeBlur edge="bottom" />
          </>
        )}
      </div>
    </div>
  );
}

function EdgeBlur({ edge }: { edge: 'top' | 'bottom' }) {
  const mask = blurRamp(edge === 'top' ? 'to bottom' : 'to top');
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 h-20',
        edge === 'top' ? 'top-0' : 'bottom-0'
      )}
      style={{
        backdropFilter: `blur(${EDGE_BLUR})`,
        WebkitBackdropFilter: `blur(${EDGE_BLUR})`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

function PulseDot() {
  return (
    <span className="relative grid size-1.5 shrink-0 place-items-center">
      <span className="absolute size-1.5 rounded-full bg-primary" />
      <span className="absolute size-1.5 animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
    </span>
  );
}
