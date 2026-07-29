'use client';

import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';

import { Accordion, AccordionItem } from '@/components/ui/accordion';

export interface DetailsProps {
  /** The always-visible, clickable line. */
  summary: ReactNode;
  /** Revealed on open. Any block: text, image, code. */
  children: ReactNode;
  defaultOpen?: boolean;
}

const ITEM_VALUE = 'details';

// A box-shadow rather than a background gradient, so fading the bar's opacity
// fades the halo with it.
const ACCENT_GLOW =
  '0 0 16px 4px oklch(0.53 0.21 var(--base-hue) / 0.95), 0 0 34px 13px oklch(0.53 0.21 var(--base-hue) / 0.5)';

const GLASS_FILTER = 'blur(var(--blur, 12px)) saturate(var(--saturate, 1.15))';

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
        // `group` drives the open-state styling off Radix's data-state;
        // overflow-hidden clips the accent glow so it only bleeds inward.
        className="group relative overflow-hidden rounded-xl border border-border bg-card"
      >
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger className="relative flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left outline-none">
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity duration-[400ms] ease-in-out group-data-[state=open]:opacity-100 motion-reduce:transition-none"
              style={{ boxShadow: ACCENT_GLOW }}
            />

            <span className="font-display text-base leading-6 text-foreground">{summary}</span>

            <span
              className="grid size-8 shrink-0 place-items-center rounded-full bg-muted/60 text-muted-foreground"
              style={{ backdropFilter: GLASS_FILTER, WebkitBackdropFilter: GLASS_FILTER }}
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

        {/* The primitive, not the generated AccordionContent, whose inner
            `h-(--radix-…-height)` div clipped the bottom padding. The reveal must
            ride on the className, not a separate [data-state] rule, or it races
            Radix's unmount check and the exit never plays. */}
        <AccordionPrimitive.Content
          data-slot="accordion-content"
          className="overflow-hidden data-[state=open]:animate-[details-open_350ms_ease-out] data-[state=closed]:animate-[details-close_350ms_ease-out] motion-reduce:animate-none"
        >
          {/* `[&>*]:my-0` neutralises each child's own margin so the gap alone
              sets the rhythm, letting any block sit inside. */}
          <div className="flex flex-col gap-4 px-4 pb-6 font-display text-base leading-7 text-muted-foreground [&>*]:my-0">
            {children}
          </div>
        </AccordionPrimitive.Content>
      </AccordionItem>
    </Accordion>
  );
}
