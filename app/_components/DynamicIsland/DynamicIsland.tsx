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

const INSET = '0.375rem';
const COMPACT_HEIGHT = '2.75rem';
const MAX_WIDTH = '19rem';

const MENTIONS_PALETTE_AFTER = 1800;
const MENTIONS_PALETTE_FOR = 3000;

const PIXELS_PER_LINE = 16;

const resolve = (context: IslandContext): IslandState =>
  islandStates.find((state) => state.when?.(context) ?? true) ?? islandStates.at(-1)!;

const scrollTheColumnInstead = (event: React.WheelEvent) => {
  const column = document.querySelector<HTMLElement>('[data-scroll-root]');
  if (!column) return;

  const step =
    event.deltaMode === 1
      ? PIXELS_PER_LINE
      : event.deltaMode === 2
        ? column.clientHeight
        : 1;

  column.scrollBy({ top: event.deltaY * step, behavior: 'auto' });
};

export function DynamicIsland() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [widthWhenPointed, setWidthWhenPointed] = useState<number>();
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

  useEffect(() => {
    const timer = window.setTimeout(
      () => useIslandStore.getState().present(hint, { ttl: MENTIONS_PALETTE_FOR }),
      MENTIONS_PALETTE_AFTER
    );
    return () => window.clearTimeout(timer);
  }, []);

  const resolved = presented.at(-1) ?? resolve(context);
  const state = useOpening(resolved, resting);

  const point = () => {
    setWidthWhenPointed(pill.current?.offsetWidth);
    setHovered(true);
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:top-6 sm:bottom-auto">
      <button
        type="button"
        aria-label="Open the command palette"
        onClick={() => setIsOpen(true)}
        onPointerEnter={point}
        onPointerLeave={() => setHovered(false)}
        onFocus={point}
        onBlur={() => setHovered(false)}
        onWheel={scrollTheColumnInstead}
        className="group inline-flex cursor-pointer outline-none transition-[scale] duration-200 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        <motion.div
          ref={pill}
          layout
          transition={still ? { duration: 0 } : MORPH}
          style={{
            borderRadius: 999,
            padding: INSET,
            minHeight: COMPACT_HEIGHT,
            width: state.width,
            minWidth: state.id === hint.id ? widthWhenPointed : undefined,
            maxWidth: MAX_WIDTH,
          }}
          className="flex items-center overflow-hidden border border-border/60 bg-card/75 backdrop-blur-[6px] backdrop-saturate-[115%] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
        >
          <div aria-hidden className="pointer-events-none flex w-full items-center">
            <Presentation key={state.id}>{state.render(context)}</Presentation>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
