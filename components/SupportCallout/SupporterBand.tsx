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

// Slow enough to read a name in passing, which is the whole point of the band.
const PIXELS_PER_SECOND = 32;

// The window is sized in names rather than pixels, and its height follows whatever a row
// measures. Nothing here needs to know that a row is 41px, which is what keeps restyling
// one from silently showing five and a sliver.
const ROWS_IN_VIEW = 5;

// Only for the first paint, before the row has been measured: `py-2.5` around `text-sm`'s
// 20px line box, plus the rule.
const ESTIMATED_ROW_HEIGHT = 41;

// Hovering sends the speed to 0 and leaving sends it back to 1. Under-damped would
// overshoot into running backwards, so this one is critically damped: the stop is
// gradual, never a bounce.
const SPEED_SPRING = { stiffness: 120, damping: 22, mass: 1 };

// Two stacked effects, as `ScrollFade` does it: the mask ramps the opacity, the blur
// bands ramp the focus. A mask rather than a colour gradient, so the band needs to know
// nothing about the surface it sits on.
const EDGE_MASK =
  'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)';

const blurRamp = (direction: string) =>
  `linear-gradient(${direction}, black 0%, transparent 100%)`;

const EDGE_BLUR = '3px';

/**
 * How many times the list must repeat for one copy to cover the window.
 *
 * A row's height cancels out: the window is `ROWS_IN_VIEW` rows tall and a repeat is
 * `count` rows tall, so this is a ratio of names and needs no measurement at all. The
 * version that did measure divided the list's height by the repeat count already
 * rendered, feeding an answer back into its own input, and asked for 317 repeats where
 * 18 was right.
 */
export const repeatsToFill = (count: number) =>
  count > 0 ? Math.max(1, Math.ceil(ROWS_IN_VIEW / count)) : 1;

// Space-grouped rather than comma-grouped: the row is monospace and a comma next to
// "total" reads as punctuation rather than as a separator.
const groupThousands = (value: number) =>
  value.toLocaleString('en-US').replace(/,/g, ' ');

export default function SupporterBand() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [total, setTotal] = useState(0);
  // Mirrors the spring's target onto the element so the intent is readable from the
  // DOM. It changes twice per visit, not per frame, so the render costs nothing.
  const [paused, setPaused] = useState(false);
  // The window follows the row rather than a hardcoded height, so `ROWS_IN_VIEW` stays
  // literally true when the row's padding changes.
  const [rowHeight, setRowHeight] = useState(ESTIMATED_ROW_HEIGHT);
  const reduceMotion = useReducedMotion();

  const listRef = useRef<HTMLUListElement>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const offset = useMotionValue(0);
  const count = supporters.length;
  const speed = useSpring(1, SPEED_SPRING);

  // Reduced motion drops the whole scrolling apparatus, not just the movement. Freezing
  // the loop on its own leaves the machinery it needs on screen: a fixed window, faded
  // edges, and the same names repeated to fill it, which without the scroll reads as a
  // duplication bug. What is left is the plain list it was always standing in for.
  const scrolls = !reduceMotion;
  // A copy shorter than the window would tear a gap open on every wrap: with a single
  // supporter that gap is most of the band. Repeating is what keeps the loop seamless
  // from the very first donation, at the cost of showing a short list more than once.
  const copies = scrolls ? 2 * repeatsToFill(count) : 1;
  const bandHeight = rowHeight * ROWS_IN_VIEW;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/supporters', { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<SupportersResponse>) : null))
      .then((data) => {
        if (!data) return;
        setSupporters(data.supporters);
        setTotal(data.total);
      })
      // An outage is not the reader's problem: the band simply never appears.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // The observer does the measuring, including the first one since it fires on observe.
  // Reading the row inline here instead would be a render feeding a render.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !scrolls) return;

    const observer = new ResizeObserver(() => {
      if (row.offsetHeight) setRowHeight(row.offsetHeight);
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [scrolls]);

  const pause = (next: boolean) => {
    setPaused(next);
    speed.set(next ? 0 : 1);
  };

  // Wrapped against one copy's height rather than the window's, so the seam between the
  // two copies lands exactly where the first one ended.
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
      {/* The only two rules that cross the whole card, framing the heading. Every rule
          below is inset to the text, so the list reads as a column rather than as the
          card being sliced into bands. */}
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

      <div
        data-slot="supporter-scroller"
        data-paused={(scrolls && paused) || undefined}
        data-still={!scrolls || undefined}
        className="relative"
        style={scrolls ? { height: bandHeight } : undefined}
        onPointerEnter={() => pause(true)}
        onPointerLeave={() => pause(false)}
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
            {/* Drawn twice when it scrolls, so the list can run off the bottom and
                arrive at the top without a gap, each copy repeated until it outruns the
                window. Only the very first pass is announced: the rest are the same
                names again. */}
            {Array.from({ length: copies }, (_, pass) =>
              supporters.map((supporter, index) => (
                <li
                  key={`${pass}-${index}`}
                  ref={pass === 0 && index === 0 ? rowRef : undefined}
                  aria-hidden={pass > 0 || undefined}
                  // `mx-5` rather than `px-5`: the margin insets the rule with the box,
                  // where padding would leave it spanning the card.
                  className="flex items-center justify-between border-b border-border/60 mx-5 py-2.5 font-mono text-sm"
                >
                  <span className="text-muted-foreground">{supporter.name}</span>
                  <span className="text-primary tabular-nums">
                    {formatAmount(supporter)}
                  </span>
                </li>
              ))
            )}
          </motion.ul>
        </div>

        {/* Siblings of the masked list rather than children of it: a child would be
            erased by the very mask that is supposed to shape it. */}
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

/** The ramp runs from the edge inward, so both of them flip with it. */
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

/** A ring that swells out of the dot and fades, on a loop. */
function PulseDot() {
  return (
    <span className="relative grid size-1.5 shrink-0 place-items-center">
      <span className="absolute size-1.5 rounded-full bg-primary" />
      <span className="absolute size-1.5 animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
    </span>
  );
}
