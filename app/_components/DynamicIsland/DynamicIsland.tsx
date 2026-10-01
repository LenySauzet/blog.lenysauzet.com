'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useIslandStore } from '@/hooks/use-island-store';

import { Presentation } from './Presentation';
import { hint } from './states/hint';
import { islandStates } from './states';
import type { IslandContext, IslandState } from './types';

/**
 * The spring the slider's constants were derived for, which held up to a session of
 * tuning by feel: damping ratio 0.81 at 25 rad/s, which is `stiffness = f^2` and
 * `damping = 2 * ratio * sqrt(stiffness)`. Firm arrival, one short rebound.
 */
const MORPH = { type: 'spring', stiffness: 625, damping: 40.5, mass: 1 } as const;

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
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        transition={still ? { duration: 0 } : MORPH}
        // Inline, because Motion only corrects the corner distortion its own layout
        // projection causes when the radius is a style value it can read.
        style={{ borderRadius: 999 }}
        className="flex cursor-pointer items-center overflow-hidden border border-border/60 bg-card/75 px-3 py-2 backdrop-blur-[6px] backdrop-saturate-[115%] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        {/* Decorative: the button is named once and keeps that name through every
            state, or each morph would be announced as a new control. */}
        <div aria-hidden className="relative flex items-center">
          {/* `popLayout` takes the outgoing copy out of flow at once, so the island
              starts resizing with the incoming one instead of after it. It lays that
              copy out absolutely, which needs a positioned parent here, or the two
              states pass beside each other instead of one fading under the other. */}
          <AnimatePresence mode="popLayout" initial={false}>
            <Presentation key={state.id}>{state.render(context)}</Presentation>
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}
