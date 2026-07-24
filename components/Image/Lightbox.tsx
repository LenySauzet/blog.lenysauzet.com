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
  children: ReactNode;
}

/**
 * Full-bleed surface, dismisses on click or Escape. Deliberately NOT a dialog
 * primitive (Radix / Base UI): a primitive's scroll lock is tied to its layer's
 * mount, and the layer must outlive the dismiss to animate out — freezing the
 * page for the whole exit. Nothing here is ever locked: `overscroll-contain`
 * keeps the page still while open, and on dismiss the exit variant drops pointer
 * events, handing the wheel back mid-animation. Timing comes from the caller's
 * MotionConfig (context crosses the portal) so the scrim can't drift out of sync.
 */
export function Lightbox({
  open,
  onOpenChange,
  title,
  children,
}: LightboxProps) {
  const isHydrated = useIsHydrated();
  const surface = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const surfaceEl = surface.current;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;

    // `aria-modal` claims the rest of the page is gone, so the keyboard must
    // agree: focus the surface and block Tab from wandering out. Nothing here
    // is focusable, so the trap amounts to not moving at all.
    surfaceEl?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
      if (event.key === 'Tab') event.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);

      // Only restore focus if it is still ours: this cleanup also runs on
      // unmount (e.g. a route change), where stealing focus would be wrong.
      const active = document.activeElement;
      const focusIsOurs =
        !active || active === document.body || surfaceEl?.contains(active);

      if (focusIsOurs) restoreFocusTo.current?.focus({ preventScroll: true });
    };
  }, [open, onOpenChange]);

  if (!isHydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="lightbox"
          ref={surface}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          // z-100, not z-50: the site header already claims z-50.
          className="fixed inset-0 z-100 grid cursor-zoom-out place-items-center overflow-y-auto overscroll-contain p-8 outline-none"
          // Fade a custom property, not the element's opacity, so the scrim
          // animates without dragging the morphing image with it.
          style={{
            backgroundColor:
              'oklch(from var(--background) l c h / var(--scrim-opacity, 0))',
          }}
          initial={{ '--scrim-opacity': 0 }}
          animate={{ '--scrim-opacity': 0.8 }}
          exit={{ '--scrim-opacity': 0, pointerEvents: 'none' }}
          onClick={() => onOpenChange(false)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
