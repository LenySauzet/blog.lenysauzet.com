'use client';

import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';

import { Accordion, AccordionItem } from '@/components/ui/accordion';

export interface DetailsProps {
  /** The always-visible, clickable line. */
  summary: ReactNode;
  /** Revealed on open — any block (text, image, code, …). */
  children: ReactNode;
  /** Open on first render. */
  defaultOpen?: boolean;
}

const ITEM_VALUE = 'details';

export default function Details({ summary, children, defaultOpen = false }: DetailsProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? ITEM_VALUE : undefined}
      className="my-6"
    >
      <AccordionItem
        value={ITEM_VALUE}
        // Semantic card surface (shadcn's recommended tokens). `group` drives
        // the open-state styling off Radix's data-state; overflow-hidden clips
        // the accent glow to the card so it only bleeds inward, per Maxime.
        className="group relative overflow-hidden rounded-xl border border-border bg-card"
      >
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger className="relative flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left outline-none">
            {/* The 2px primary accent bar at the card's left edge. Its glow is a
                constant box-shadow; fading the bar's opacity fades the halo with
                it (opacity applies to the shadow too). This IS the active cue. */}
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity duration-[400ms] ease-in-out group-data-[state=open]:opacity-100 motion-reduce:transition-none"
              style={{
                boxShadow:
                  '0 0 16px 4px oklch(0.53 0.21 var(--base-hue) / 0.95), 0 0 34px 13px oklch(0.53 0.21 var(--base-hue) / 0.5)',
              }}
            />

            <span className="font-display text-base leading-6 text-foreground">{summary}</span>

            {/* A single plus rotates 45° into a cross on open. Glass circle,
                vertically centred with the summary line. */}
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground"
              style={{
                background: 'oklch(from var(--muted) l c h / 0.6)',
                backdropFilter: 'blur(12px) saturate(1.15)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.15)',
              }}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                size={18}
                strokeWidth={2}
                className="transition-transform duration-[400ms] ease-in-out group-data-[state=open]:rotate-45 motion-reduce:transition-none"
              />
            </span>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

        {/* AccordionPrimitive.Content directly (not the generated AccordionContent,
            whose inner `h-(--radix-…-height)` div clipped our bottom padding). The
            reveal (details-open/close keyframes in globals.css) rides on the
            className so it's present the instant data-state flips; it reads
            --radix-accordion-content-height, which Radix sets here. */}
        <AccordionPrimitive.Content
          data-slot="accordion-content"
          className="overflow-hidden data-[state=open]:animate-[details-open_350ms_ease-out] data-[state=closed]:animate-[details-close_350ms_ease-out] motion-reduce:animate-none"
        >
          {/* Neutralise each child's own vertical margin so the gap sets the
              rhythm — lets any block sit inside, mirroring Callout. */}
          <div className="flex flex-col gap-4 px-4 pb-6 font-display text-base leading-7 text-muted-foreground [&>*]:my-0">
            {children}
          </div>
        </AccordionPrimitive.Content>
      </AccordionItem>
    </Accordion>
  );
}
