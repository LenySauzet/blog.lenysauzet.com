'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useIslandStore } from '@/hooks/use-island-store';

import { MORPH } from './motion';
import { Presentation } from './Presentation';
import { useScrollTracking } from './scroll';
import { useOpening } from './use-opening';
import { hint } from './states/hint';
import { resting } from './states/resting';
import { islandStates } from './states';
import type { IslandContext, IslandState } from './types';

/**
 * Uniform, and that is half the geometry: a disc inset by the same amount on three
 * sides is concentric with the cap it sits in, so the progress ring follows the
 * island's curve instead of merely sitting near it.
 */
const INSET = '0.375rem';

/**
 * How wide the island is ever allowed to be. A title long enough would otherwise
 * turn a floating pill into a banner, and the truncation inside is what gives.
 */
const MAX_WIDTH = '19rem';

/** What a wheel means by one line, for the devices that count in them. */
const LINE_HEIGHT = 16;

/**
 * The other half. Every compact state stands at the same height, so moving between
 * them is a change of width and of content rather than of stature, and the island
 * reads as one object throughout. It is the inset twice over, plus the border,
 * around a disc of 30: a state that wants to be a card may still grow past it.
 *
 * Width stays each state's own business, which is where the morph lives.
 */
const COMPACT_HEIGHT = '2.75rem';

/**
 * When the island mentions the palette, and for how long.
 *
 * It waits for the identity to have been read before covering it, and leaves on its
 * own. The dwell is longer than the second it looks like: the entrance spends a
 * third of it, so what is left is the time there is to actually read the line.
 */
const TEACH_AFTER = 1800;
const TEACH_FOR = 3000;

/** The first state whose condition holds. The last one carries none. */
const resolve = (context: IslandContext): IslandState =>
  islandStates.find((state) => state.when?.(context) ?? true) ?? islandStates.at(-1)!;

export function DynamicIsland() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  /**
   * The width the island held when the pointer arrived, which the hint then keeps.
   * Read from the layout box rather than the painted one, so a morph still in
   * flight, or a press holding the pill at 0.97, is not mistaken for its size.
   */
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

  // Raised rather than derived: on every load the island says what it is for, once
  // the identity has had its moment, and then gets out of the way. Once a session
  // was tried and is worse than it sounds: the one person who reloads most is the
  // one who never sees it again.
  useEffect(() => {
    const timer = window.setTimeout(
      () => useIslandStore.getState().present(hint, { ttl: TEACH_FOR }),
      TEACH_AFTER
    );
    return () => window.clearTimeout(timer);
  }, []);

  // A raised state covers whatever the page was saying and, on expiry, uncovers it.
  const resolved = presented.at(-1)?.state ?? resolve(context);
  const state = useOpening(resolved, resting);


  return (
    // The fixed box does not animate: Motion drives `transform` to project a layout
    // change, and the centring translate lives on this element instead, out of its
    // way. Anchored top on desktop and bottom on mobile, so the island grows away
    // from the edge it is pinned to without being told.
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:top-6 sm:bottom-auto">
      <button
        type="button"
        aria-label="Open the command palette"
        onClick={() => setIsOpen(true)}
        onPointerEnter={() => {
          setHeld(pill.current?.offsetWidth);
          setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => {
          setHeld(pill.current?.offsetWidth);
          setHovered(true);
        }}
        onBlur={() => setHovered(false)}
        // The column that scrolls is the island's sibling, not its ancestor, and
        // `body` does not scroll at all: a wheel over a floating bar therefore has
        // nothing to act on and the page simply stops under the pointer. Handing
        // the delta on is what a scrollable ancestor would have done.
        //
        // `deltaY` in pixel mode is by definition the distance the browser would
        // have scrolled, so it is passed through rather than scaled. That parity
        // cannot be checked under Playwright, which reports twice what it scrolls
        // natively; the factor belongs to the harness, not to the browser.
        onWheel={(event) => {
          const root = document.querySelector<HTMLElement>('[data-scroll-root]');
          if (!root) return;

          // A wheel reports pixels, lines or pages depending on the device, and a
          // line taken as a pixel moves the article by nothing at all.
          const step =
            event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? root.clientHeight : 1;

          root.scrollBy({ top: event.deltaY * step, behavior: 'auto' });
        }}
        // The target is the pill, exactly: a fixed box was predictable but reached
        // past what anyone can see, and hovering empty air raised the hint. What
        // made a fixed box necessary was the hint being narrower than the state it
        // covers, so the pill could shrink out from under the pointer that raised
        // it. The hint holds that width instead, which is the one state change a
        // pointer can cause, so nothing a pointer does resizes this.
        // Lifts a little under the pointer and gives under the press, like every
        // other control here. On the target rather than on the pill, and that is
        // the whole reason it is safe: a transform moves the hit area with it, so
        // the grown pill is still something to point at. Scaled on the pill, it
        // would have reached past its own target and the outer pixels would have
        // raised a hover that shrank the pill out from under the pointer again.
        //
        // The standalone `scale` property, which Tailwind v4 keeps apart from
        // `transform`: Motion owns the transform for its projection, so the two
        // compose rather than overwrite each other.
        className="group inline-flex cursor-pointer outline-none transition-[scale] duration-200 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        {/* Motion scales this box from the one it held a frame ago into the one it
            holds now, and whatever is inside goes with it. That stretch is the
            effect, not a defect of it: the content is laid out once at its final
            size and squashed into the shape of the moment, which is what lets any
            state be carried without the island knowing anything about it.
            Correcting the children, or scaling them separately, is what put two
            disagreeing movements on screen. */}
        <motion.div
          ref={pill}
          layout
          transition={still ? { duration: 0 } : MORPH}
          // Inline, because Motion only corrects the corner distortion its own
          // projection causes when the radius is a style value it can read. The
          // width is a style too, so a state that asks for one is a box change
          // Motion can animate.
          style={{
            borderRadius: 999,
            padding: INSET,
            minHeight: COMPACT_HEIGHT,
            width: state.id === hint.id ? held : state.width,
            maxWidth: MAX_WIDTH,
          }}
          className="flex items-center overflow-hidden border border-border/60 bg-card/75 backdrop-blur-[6px] backdrop-saturate-[115%] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
        >
          {/* Decorative: the button is named once and keeps that name through every
              state, or each morph would be announced as a new control.

              Keyed rather than wrapped in `AnimatePresence`: the outgoing state
              leaves without an animation, so React dropping it on the spot is
              exactly the behaviour, and the island is left with one thing to
              watch. */}
          {/* Full width, so a state with two anchors reaches both caps. */}
          <div aria-hidden className="flex w-full items-center">
            <Presentation key={state.id}>{state.render(context)}</Presentation>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
