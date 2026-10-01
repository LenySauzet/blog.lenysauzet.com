'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useIslandStore } from '@/hooks/use-island-store';

import { MORPH } from './motion';
import { Presentation } from './Presentation';
import { useScrollTracking } from './scroll';
import { islandStates } from './states';
import { hint } from './states/hint';
import { resting } from './states/resting';
import type { IslandContext, IslandState } from './types';
import { useOpening } from './use-opening';

/**
 * Uniform, and that is half the geometry: a disc inset by the same amount on three
 * sides is concentric with the cap it sits in, so the progress ring follows the
 * island's curve rather than merely sitting near it.
 */
const INSET = '0.375rem';

/**
 * The other half. Every compact state stands the same height, so moving between
 * them changes width and content rather than stature. It is the inset twice over,
 * plus the border, around a disc of 30.
 */
const COMPACT_HEIGHT = '2.75rem';

/** Past this a floating pill becomes a banner; the title truncates into it. */
const MAX_WIDTH = '19rem';

const TEACH_AFTER = 1800;
const TEACH_FOR = 3000;

/** What a wheel means by one line, for the devices that count in them. */
const LINE_HEIGHT = 16;

/** The first state whose condition holds. The last one carries none. */
const resolve = (context: IslandContext): IslandState =>
  islandStates.find((state) => state.when?.(context) ?? true) ?? islandStates.at(-1)!;

/**
 * The column that scrolls is the island's sibling rather than its ancestor, and
 * `body` does not scroll at all, so a wheel over a floating bar finds nothing to
 * act on. Handing the delta on is what a scrollable ancestor would have done.
 */
const passWheelOn = (event: React.WheelEvent) => {
  const root = document.querySelector<HTMLElement>('[data-scroll-root]');
  if (!root) return;

  const step =
    event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? root.clientHeight : 1;

  root.scrollBy({ top: event.deltaY * step, behavior: 'auto' });
};

export function DynamicIsland() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  /** The width the island held when the pointer arrived, which the hint keeps. */
  const [held, setHeld] = useState<number>();
  const pill = useRef<HTMLDivElement>(null);
  const post = useIslandStore((state) => state.post);
  const presented = useIslandStore((state) => state.presented);
  const setIsOpen = useCmdkStore((state) => state.setIsOpen);
  const scrolled = useScrollTracking();
  const still = useReducedMotion();

  const context = useMemo<IslandContext>(
    () => ({ pathname, hovered, post, scrolled }),
    [pathname, hovered, post, scrolled]
  );

  /** Raised rather than derived: on every load, once the identity has been read. */
  useEffect(() => {
    const timer = window.setTimeout(
      () => useIslandStore.getState().present(hint, { ttl: TEACH_FOR }),
      TEACH_AFTER
    );
    return () => window.clearTimeout(timer);
  }, []);

  /** A raised state covers what the page was saying, and on expiry uncovers it. */
  const resolved = presented.at(-1)?.state ?? resolve(context);
  const state = useOpening(resolved, resting);

  const hold = () => {
    setHeld(pill.current?.offsetWidth);
    setHovered(true);
  };

  return (
    // Anchored top on desktop and bottom on mobile, so the island grows away from
    // the edge it is pinned to without being told. This box never animates: Motion
    // drives `transform` to project a layout change, and the centring translate
    // lives here, out of its way.
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:top-6 sm:bottom-auto">
      {/*
        The target is the pill exactly, which only holds because nothing a pointer
        does resizes it: hover is the one state change a pointer can cause, and the
        hint keeps the width of whatever it covers.

        The lift and the press live here rather than on the pill, and that is what
        makes them safe: a transform carries the hit area with it, so a grown pill
        is still something to point at. On the standalone `scale` property, which
        Tailwind v4 keeps apart from `transform`: Motion owns the transform for its
        projection, so the two compose instead of overwriting each other.
      */}
      <button
        type="button"
        aria-label="Open the command palette"
        onClick={() => setIsOpen(true)}
        onPointerEnter={hold}
        onPointerLeave={() => setHovered(false)}
        onFocus={hold}
        onBlur={() => setHovered(false)}
        onWheel={passWheelOn}
        className="group inline-flex cursor-pointer outline-none transition-[scale] duration-200 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        {/*
          Motion scales this box from the one it held a frame ago into the one it
          holds now, and whatever is inside goes with it. That stretch is the
          effect: the content is laid out once at its final size and squashed into
          the shape of the moment, which is what lets the island carry any state
          without knowing anything about it.
        */}
        <motion.div
          ref={pill}
          layout
          transition={still ? { duration: 0 } : MORPH}
          // Inline, or Motion cannot correct the corner distortion its own
          // projection causes. A floor rather than a width on the hint: it must not
          // shrink the island, nor be squeezed into a state narrower than its line.
          style={{
            borderRadius: 999,
            padding: INSET,
            minHeight: COMPACT_HEIGHT,
            width: state.width,
            minWidth: state.id === hint.id ? held : undefined,
            maxWidth: MAX_WIDTH,
          }}
          className="flex items-center overflow-hidden border border-border/60 bg-card/75 backdrop-blur-[6px] backdrop-saturate-[115%] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
        >
          {/*
            Decorative, so the button keeps one name through every state rather than
            announcing a new control on each morph. Keyed rather than wrapped in
            `AnimatePresence`: the outgoing state leaves without an animation, so
            React dropping it on the spot is exactly the behaviour. Full width, so a
            state with two anchors reaches both caps.
          */}
          <div aria-hidden className="flex w-full items-center">
            <Presentation key={state.id}>{state.render(context)}</Presentation>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
