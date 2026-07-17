'use client';

import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/** Mirrors --duration-fast from app/globals.css, expressed in seconds for Motion. */
const FADE_DURATION = 0.15;

const SCRIM_OPACITY = 0.8;

interface LightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the dialog for screen readers. */
  title: string;
  /** Element that opens the lightbox. Receives the trigger's button semantics. */
  trigger: ReactNode;
  /** Content shown while zoomed in. */
  children: ReactNode;
}

/**
 * A full-bleed modal surface that dismisses on click, Escape, or its close
 * button. Knows nothing about what it displays.
 *
 * Deliberately composes the raw Radix primitives rather than
 * `components/ui/dialog.tsx`: that surface centres itself with a
 * `translate(-50%, -50%)`, and a transformed ancestor corrupts the bounding-box
 * maths behind Motion's layout projection. Everything else it brings
 * (`bg-popover`, padding, ring) would have to be negated here anyway.
 *
 * `forceMount` plus `AnimatePresence` keeps the subtree alive long enough for
 * the exit animation to play; Radix would otherwise unmount it instantly.
 * AnimatePresence only tracks its *direct* children, so the surface is its one
 * keyed child — wrapping siblings in a fragment leaves it with nothing to
 * animate and the subtree never unmounts.
 *
 * There is no separate Radix Overlay: it would only contribute the scrim, while
 * the focus trap and scroll lock already come from Content.
 */
export function Lightbox({
  open,
  onOpenChange,
  title,
  trigger,
  children,
}: LightboxProps) {
  const close = () => onOpenChange(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {open ? (
            <DialogPrimitive.Content
              asChild
              forceMount
              aria-describedby={undefined}
              key="lightbox-surface"
            >
              {/* The surface spans the viewport, so Radix's outside-click never
                  fires: dismissal is wired explicitly below. Fading a custom
                  property rather than the element's own opacity keeps the scrim
                  animating without dragging the morphing image along with it. */}
              {/* Above z-50, which the site header already occupies: relying on
                  portal DOM order alone to win that tie is too fragile.
                  The extra padding mirrors where the header sits — top on
                  desktop, bottom on mobile — so the close button never centres
                  itself on top of the nav. */}
              <motion.div
                className="fixed inset-0 z-100 grid cursor-zoom-out place-items-center overflow-y-auto p-8 max-sm:pb-24 sm:pt-24"
                style={{
                  backgroundColor:
                    'oklch(from var(--background) l c h / var(--scrim-opacity, 0))',
                }}
                initial={{ '--scrim-opacity': 0 }}
                animate={{ '--scrim-opacity': SCRIM_OPACITY }}
                exit={{ '--scrim-opacity': 0 }}
                transition={{ duration: FADE_DURATION }}
                onClick={close}
              >
                <DialogPrimitive.Title className="sr-only">
                  {title}
                </DialogPrimitive.Title>
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: FADE_DURATION,
                      delay: FADE_DURATION,
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={close}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                      <span className="sr-only">Close</span>
                    </Button>
                  </motion.div>
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          ) : null}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
