'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const NEVER_CHANGES = () => () => {};

/** Portals need a DOM, and this component is rendered on the server too. */
const useIsHydrated = () =>
  useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false
  );

interface LightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the surface for screen readers. */
  title: string;
  /** Content shown while zoomed in. */
  children: ReactNode;
  /** Fade duration in seconds. Match the caller's morph or the scrim flashes. */
  duration: number;
}

/**
 * A full-bleed surface that dismisses on click or Escape.
 *
 * Deliberately not built on a dialog primitive — not Radix's, not Base UI's.
 * A dialog primitive brings a focus trap, a scroll lock and layer management;
 * this surface holds a single decorative image, so the trap has nothing to trap,
 * and the scroll lock is the exact thing that has to be defeated for the page to
 * stay usable while the image animates away. Radix ties that lock to its layer's
 * mount, and the layer must outlive the dismiss to animate out, so the page is
 * frozen for the whole exit by construction. What is left of a dialog once those
 * are gone is a portal, Escape, focus restoration and two ARIA attributes —
 * which is all of the code below.
 *
 * Nothing is ever locked. The surface covers the viewport and `overscroll-contain`
 * stops the wheel chaining past it, so the page cannot move while it is up. On
 * dismiss the exit variant drops pointer events, handing the wheel straight back
 * mid-animation.
 */
export function Lightbox({
  open,
  onOpenChange,
  title,
  children,
  duration,
}: LightboxProps) {
  const isHydrated = useIsHydrated();
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Only meaningful if focus is still inside the surface being torn down.
      restoreFocusTo.current?.focus();
    };
  }, [open, onOpenChange]);

  if (!isHydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          // z-100, not z-50: the site header already claims z-50, and winning
          // that tie on portal order alone is too fragile.
          className="fixed inset-0 z-100 grid cursor-zoom-out place-items-center overflow-y-auto overscroll-contain p-8 outline-none"
          // Fading a custom property rather than the element's own opacity keeps
          // the scrim animating without dragging the morphing image with it.
          style={{
            backgroundColor:
              'oklch(from var(--background) l c h / var(--scrim-opacity, 0))',
          }}
          initial={{ '--scrim-opacity': 0 }}
          animate={{ '--scrim-opacity': 0.8 }}
          exit={{ '--scrim-opacity': 0, pointerEvents: 'none' }}
          transition={{ duration }}
          onClick={() => onOpenChange(false)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
