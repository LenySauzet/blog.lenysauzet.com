'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

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
 * A full-bleed surface that dismisses on click or Escape. Knows nothing about
 * what it displays.
 *
 * Built the way every other dialog in this app is built: Radix's own presence
 * plus CSS animations. No Motion, no AnimatePresence, no forceMount.
 *
 * Two decisions carry the whole design, and both exist so the reader can scroll
 * the instant they dismiss:
 *
 * `modal={false}` means Radix never disables pointer events on <body>. That lock
 * lives as long as the layer is mounted, and the layer must outlive the dismiss
 * to animate out — so with a modal layer the page is necessarily frozen for the
 * length of the exit. Nothing is lost by dropping it: this surface covers the
 * viewport and owns `overflow-y-auto`, so it is already the wheel's target and
 * the page behind cannot scroll while it is open.
 *
 * `data-[state=closed]:pointer-events-none` hands the wheel back the moment
 * Radix flips state, while the surface is still fading out. This works only
 * because of `modal={false}`: a modal layer gets an inline `pointer-events:
 * auto` from Radix, and no class beats an inline style.
 *
 * There is deliberately no shared-layout morph back to the inline image. It
 * would interpolate towards the box the trigger held at dismissal, so any scroll
 * during the animation moves the target and the image jumps by exactly the
 * distance scrolled. A position morph and a scrollable page are mutually
 * exclusive; scrolling won.
 *
 * There is no close button either: the whole surface is the dismiss target,
 * which the zoom-out cursor advertises, and Escape covers the keyboard.
 *
 * It also does not reuse `components/ui/dialog.tsx`: that surface is a centred
 * panel with its own background, padding and ring, none of which apply to a
 * full-bleed image.
 */
export function Lightbox({
  open,
  onOpenChange,
  title,
  trigger,
  children,
}: LightboxProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onClick={() => onOpenChange(false)}
          className={cn(
            // z-100, not z-50: the site header already claims z-50, and winning
            // that tie on portal DOM order alone is too fragile.
            'fixed inset-0 z-100 grid cursor-zoom-out place-items-center overflow-y-auto p-8',
            'bg-background/80 outline-none',
            'duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[state=closed]:pointer-events-none'
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
