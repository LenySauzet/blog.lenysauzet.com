'use client';

import { useCallback, useRef, useState } from 'react';

import { CommandList } from '@/components/ui/command';

/** How far the fade reaches once it is fully drawn. */
const FADE = 80;

// Most of the falloff happens in the first third, so a row is gone well before it
// meets the edge rather than half readable against it. Both ends take a 0 to 1
// reach, so the fade grows with the scroll instead of switching on.
const fadeMask = (top: number, bottom: number) => {
  const head = FADE * top;
  const foot = FADE * bottom;

  return [
    'linear-gradient(to bottom',
    'transparent 0',
    `oklch(0 0 0 / 0.35) ${head * 0.4}px`,
    `black ${head}px`,
    `black calc(100% - ${foot}px)`,
    `oklch(0 0 0 / 0.35) calc(100% - ${foot * 0.4}px)`,
    'transparent 100%)',
  ].join(', ');
};

/**
 * A `CommandList` whose cut-off ends fade rather than stop, by how far there is
 * left to scroll in that direction.
 *
 * Remount it when the list underneath is replaced wholesale, with a `key`: the
 * observers are attached to the node found at mount, and a swapped page leaves them
 * watching one that has been detached.
 */
export function FadingList({ children }: { children: React.ReactNode }) {
  const listRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ top: 0, bottom: 0 });

  // Only ever called from an event, an observer or a ref callback, never from an
  // effect body.
  const readEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const below = list.scrollHeight - list.clientHeight - list.scrollTop;
    setEdges({
      top: Math.min(1, list.scrollTop / FADE),
      bottom: Math.min(1, Math.max(0, below) / FADE),
    });
  }, []);

  /**
   * Wired from the frame's ref rather than an effect: the dialog mounts its content
   * through a portal, so by the time an effect on the open state runs the node is
   * not there yet and the observers were never attached. The scrolling node is
   * found under the frame because a ref handed to `CommandList` does not reach it.
   *
   * Filtering changes what the list holds without changing the list's own box, so
   * its rows are watched too.
   */
  const watchFrame = useCallback(
    (frame: HTMLDivElement | null) => {
      listRef.current = frame?.querySelector<HTMLElement>('[cmdk-list]') ?? null;
      const list = listRef.current;
      if (!list) return;

      const resized = new ResizeObserver(readEdges);
      resized.observe(list);

      const refilled = new MutationObserver(readEdges);
      refilled.observe(list, { childList: true, subtree: true });

      readEdges();
      return () => {
        resized.disconnect();
        refilled.disconnect();
        listRef.current = null;
      };
    },
    [readEdges]
  );

  const mask = fadeMask(edges.top, edges.bottom);

  return (
    <div ref={watchFrame} className="relative">
      {/* Masking the list rather than laying a coloured band over it: the panel is
          glass, so anything opaque would fill in what it is meant to show. */}
      <CommandList
        onScroll={readEdges}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </CommandList>

      <EdgeBlur edge="top" reach={edges.top} />
      <EdgeBlur edge="bottom" reach={edges.bottom} />
    </div>
  );
}

/** Siblings of the masked list: a child would be erased by that same mask. */
function EdgeBlur({ edge, reach }: { edge: 'top' | 'bottom'; reach: number }) {
  const ramp = `linear-gradient(to ${edge === 'top' ? 'bottom' : 'top'}, black 0%, transparent 100%)`;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 h-20 ${
        edge === 'top' ? 'top-0' : 'bottom-0'
      }`}
      style={{
        opacity: reach,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        maskImage: ramp,
        WebkitMaskImage: ramp,
      }}
    />
  );
}
