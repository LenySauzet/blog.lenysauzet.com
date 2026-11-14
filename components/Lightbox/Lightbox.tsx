'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  useEffect,
  useEffectEvent,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { useLightboxStore } from '@/hooks/use-lightbox-store';

const NEVER_CHANGES = () => () => {};

const useIsHydrated = () =>
  useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false
  );

interface LightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Lightbox({
  open,
  onOpenChange,
  title,
  children,
}: LightboxProps) {
  const isHydrated = useIsHydrated();
  const surface = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  const dismiss = useEffectEvent(() => onOpenChange(false));

  useEffect(() => (open ? useLightboxStore.getState().cover() : undefined), [open]);

  useEffect(() => {
    if (!open) return;

    const surfaceEl = surface.current;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;

    surfaceEl?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
      if (event.key === 'Tab') event.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);

      // Also runs on unmount (a route change), where stealing focus back would be wrong.
      const active = document.activeElement;
      const focusIsOurs =
        !active || active === document.body || surfaceEl?.contains(active);

      if (focusIsOurs) restoreFocusTo.current?.focus({ preventScroll: true });
    };
  }, [open]);

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
          // z-100: the site header already claims z-50.
          className="fixed inset-0 z-100 grid cursor-zoom-out grid-rows-1 place-items-center overflow-y-auto overscroll-contain p-4 outline-none sm:p-8"
          // A custom property, not opacity, keeps the morphing image out of the fade.
          style={{
            backgroundColor:
              'oklch(from var(--background) l c h / var(--scrim-opacity, 0))',
          }}
          initial={{ '--scrim-opacity': 0, backdropFilter: 'blur(0px)' }}
          animate={{ '--scrim-opacity': 0.7, backdropFilter: 'blur(12px)' }}
          exit={{
            '--scrim-opacity': 0,
            backdropFilter: 'blur(0px)',
            pointerEvents: 'none',
          }}
          onClick={() => onOpenChange(false)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
