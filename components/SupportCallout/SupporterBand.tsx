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
const PIXELS_PER_SECOND = 18;

// Hovering sends the speed to 0 and leaving sends it back to 1. Under-damped would
// overshoot into running backwards, so this one is critically damped: the stop is
// gradual, never a bounce.
const SPEED_SPRING = { stiffness: 120, damping: 22, mass: 1 };

// Two stacked effects, as `ScrollFade` does it: the mask ramps the opacity, the blur
// bands ramp the focus. A mask rather than a colour gradient, so the band needs to know
// nothing about the surface it sits on.
const EDGE_MASK =
  'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)';

const blurRamp = (direction: string) =>
  `linear-gradient(${direction}, black 0%, transparent 100%)`;

const EDGE_BLUR = '3px';

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
  const reduceMotion = useReducedMotion();

  const listRef = useRef<HTMLUListElement>(null);
  const offset = useMotionValue(0);
  const speed = useSpring(1, SPEED_SPRING);

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

  const pause = (next: boolean) => {
    setPaused(next);
    speed.set(next ? 0 : 1);
  };

  // Wrapped against one copy's height rather than the scroller's, so the seam between
  // the two copies lands exactly where the first one ended.
  useAnimationFrame((_, delta) => {
    const list = listRef.current;
    if (!list || reduceMotion) return;
    const height = list.scrollHeight / 2;
    if (!height) return;
    const next = offset.get() - (speed.get() * PIXELS_PER_SECOND * delta) / 1000;
    offset.set(next <= -height ? next + height : next);
  });

  if (!supporters.length) return null;

  return (
    <div data-slot="supporter-band" className="border-t border-border">
      <div className="flex items-center justify-between px-5 py-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
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
        data-paused={paused || undefined}
        className="relative h-44"
        onPointerEnter={() => pause(true)}
        onPointerLeave={() => pause(false)}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
        >
          <motion.ul ref={listRef} style={{ y: offset }} className="absolute inset-x-0">
            {/* Rendered twice so the list can run off the bottom and arrive at the top
                without a gap. The copy is inert to assistive tech. */}
            {[0, 1].map((copy) =>
              supporters.map((supporter, index) => (
                <li
                  key={`${copy}-${index}`}
                  aria-hidden={copy === 1 || undefined}
                  className="flex items-center justify-between border-b border-border/60 px-5 py-3 font-mono text-sm"
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
        <EdgeBlur edge="top" />
        <EdgeBlur edge="bottom" />
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
        'pointer-events-none absolute inset-x-0 h-10',
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
