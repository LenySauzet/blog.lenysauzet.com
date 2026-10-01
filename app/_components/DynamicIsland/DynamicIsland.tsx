'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useIslandStore } from '@/hooks/use-island-store';

import { MORPH } from './motion';
import { Presentation } from './Presentation';
import { useProximityHover } from './use-proximity-hover';
import { hint } from './states/hint';
import { islandStates } from './states';
import type { IslandContext, IslandState } from './types';

/**
 * Uniform, and that is half the geometry: a disc inset by the same amount on three
 * sides is concentric with the cap it sits in, so the progress ring follows the
 * island's curve instead of merely sitting near it.
 */
const INSET = '0.375rem';

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
  const { ref, hovered, enter, leave } = useProximityHover<HTMLButtonElement>();
  const post = useIslandStore((state) => state.post);
  const presented = useIslandStore((state) => state.presented);
  const setIsOpen = useCmdkStore((state) => state.setIsOpen);
  const still = useReducedMotion();

  const context = useMemo<IslandContext>(
    () => ({ pathname, hovered, post }),
    [pathname, hovered, post]
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
  const state = presented.at(-1)?.state ?? resolve(context);

  return (
    // The fixed box does not animate: Motion drives `transform` to project a layout
    // change, and the centring translate lives on this element instead, out of its
    // way. Anchored top on desktop and bottom on mobile, so the island grows away
    // from the edge it is pinned to without being told.
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:top-6 sm:bottom-auto">
      <motion.button
        type="button"
        layout
        aria-label="Open the command palette"
        onClick={() => setIsOpen(true)}
        ref={ref}
        onPointerEnter={enter}
        onFocus={enter}
        onBlur={leave}
        transition={still ? { duration: 0 } : MORPH}
        // Inline, because Motion only corrects the corner distortion its own layout
        // projection causes when the radius is a style value it can read.
        style={{ borderRadius: 999, padding: INSET, minHeight: COMPACT_HEIGHT }}
        className="flex cursor-pointer items-center overflow-hidden border border-border/60 bg-card/75 backdrop-blur-[6px] backdrop-saturate-[115%] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        {/* Decorative: the button is named once and keeps that name through every
            state, or each morph would be announced as a new control. */}
        {/* Keyed rather than wrapped in `AnimatePresence`: the outgoing state leaves
            without an animation, so React dropping it on the spot is exactly the
            behaviour, and the island is left with one thing to watch. */}
        <div aria-hidden className="flex items-center">
          <Presentation key={state.id}>{state.render(context)}</Presentation>
        </div>
      </motion.button>
    </div>
  );
}
