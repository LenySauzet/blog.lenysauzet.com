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
 * Deliberately NOT a dialog primitive: Radix ties its scroll lock to the layer's
 * mount, and the layer must outlive the dismiss to animate out, so the page stays
 * frozen for the whole exit. Here `overscroll-contain` holds the page still and
 * the exit variant drops pointer events instead.
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

    // `aria-modal` claims the rest of the page is gone, so Tab must not leave.
    surfaceEl?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
      if (event.key === 'Tab') event.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);

      // This cleanup also runs on unmount (a route change), where stealing focus
      // back would be wrong.
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
          // Fading a custom property rather than opacity keeps the morphing
          // image out of the fade.
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
