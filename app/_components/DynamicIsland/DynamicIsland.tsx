'use client';

import { animate, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
 * The target, which is deliberately not the pill.
 *
 * Hover and click belong to a box that never moves: hung on the pill itself, they
 * belonged to something that changes width with every state, so the zone that
 * raises the hint was impossible to learn and could shrink out from under the very
 * pointer that raised it. It is cut to clear the widest state with a little room to
 * spare, and the pill morphs inside it.
 */
const TARGET = 'h-14 w-60';

/**
 * The other half. Every compact state stands at the same height, so moving between
 * them is a change of width and of content rather than of stature, and the island
 * reads as one object throughout. It is the inset twice over, plus the border,
 * around a disc of 30: a state that wants to be a card may still grow past it.
 *
 * Width stays each state's own business, which is where the morph lives.
 */
const COMPACT_HEIGHT = '2.75rem';

/** Long enough to be noticed after the page settles, short enough not to nag. */
const TEACH_AFTER = 1000;
const TEACH_FOR = 4000;
const TAUGHT = 'island-hint-seen';

/** The first state whose condition holds. The last one carries none. */
const resolve = (context: IslandContext): IslandState =>
  islandStates.find((state) => state.when?.(context) ?? true) ?? islandStates.at(-1)!;

export function DynamicIsland() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
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

  // Raised rather than derived: the island teaches the palette once, then gets out
  // of the way. Per session, so refreshing does not teach three times while coming
  // back another day still does. Guarded, since a private window throws on read.
  useEffect(() => {
    let taught = true;
    try {
      taught = sessionStorage.getItem(TAUGHT) !== null;
      sessionStorage.setItem(TAUGHT, '1');
    } catch {
      // No storage, no teaching: better silent than on every page.
    }
    if (taught) return;

    const timer = window.setTimeout(
      () => useIslandStore.getState().present(hint, { ttl: TEACH_FOR }),
      TEACH_AFTER
    );
    return () => window.clearTimeout(timer);
  }, []);

  // A raised state covers whatever the page was saying and, on expiry, uncovers it.
  const resolved = presented.at(-1)?.state ?? resolve(context);
  const state = useOpening(resolved, resting);

  /**
   * The island animates a real width rather than projecting a layout change.
   *
   * Projection is cheaper, but it scales the pill instead of resizing it, so the
   * content keeps the one box it was laid out in: an element pinned to the left cap
   * follows, and one pinned to the right cap cannot, because that edge only exists
   * as a transform. Animating the width lays the content out again on every frame,
   * and the gap inside it pushes the two anchors apart as the pill opens.
   *
   * The target is read by letting the pill take the width it wants for a moment,
   * before it is put back and sprung there. A layout effect, so none of that is
   * ever painted.
   */
  useLayoutEffect(() => {
    const node = pill.current;
    if (!node) return;

    const from = node.getBoundingClientRect().width;
    node.style.width = state.width ?? 'max-content';
    const to = node.getBoundingClientRect().width;
    node.style.width = `${from}px`;

    const morph = animate(node, { width: to }, still ? { duration: 0 } : MORPH);
    return () => morph.stop();
  }, [state, still]);

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
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className={`group grid cursor-pointer place-items-center outline-none ${TARGET}`}
      >
        <div
          ref={pill}
          style={{ borderRadius: 999, padding: INSET, minHeight: COMPACT_HEIGHT }}
          className="flex items-center overflow-hidden border border-border/60 bg-card/75 backdrop-blur-[6px] backdrop-saturate-[115%] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
        >
          {/* Decorative: the button is named once and keeps that name through every
              state, or each morph would be announced as a new control.

              Keyed rather than wrapped in `AnimatePresence`: the outgoing state
              leaves without an animation, so React dropping it on the spot is
              exactly the behaviour, and the island is left with one thing to
              watch. */}
          {/* Full width, so a state with two anchors has a gap to push them with. */}
          <div aria-hidden className="flex w-full items-center">
            <Presentation key={state.id}>{state.render(context)}</Presentation>
          </div>
        </div>
      </button>
    </div>
  );
}
