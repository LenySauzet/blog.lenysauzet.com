'use client';

import { useEffect, useRef, useState } from 'react';

/** How far past its own edge the island keeps the pointer it already has. */
const MARGIN = 16;

/**
 * Hover that survives the thing being hovered changing size.
 *
 * The island shrinks when it shows an aside, which can leave the pointer outside
 * the very pill that pointer summoned: it un-hovers, the island grows back under
 * the pointer, and the two states oscillate several times a second. Entering is
 * therefore judged against the element, and leaving against its box grown by a
 * margin, so no state can shrink out from under the pointer that raised it.
 *
 * Nothing invisible is laid over the page to do it: a padded hit area would swallow
 * clicks around the island, and this listens only while the pointer is already
 * there.
 */
export function useProximityHover<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;

    const leave = () => setHovered(false);

    const onMove = (event: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;

      if (
        event.clientX < box.left - MARGIN ||
        event.clientX > box.right + MARGIN ||
        event.clientY < box.top - MARGIN ||
        event.clientY > box.bottom + MARGIN
      ) {
        leave();
      }
    };

    document.addEventListener('pointermove', onMove);
    // A pointer that leaves the window stops moving rather than moving away.
    document.addEventListener('pointerleave', leave);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', leave);
    };
  }, [hovered]);

  return { ref, hovered, enter: () => setHovered(true), leave: () => setHovered(false) };
}
