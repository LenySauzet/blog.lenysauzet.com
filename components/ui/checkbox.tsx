"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { controlHitArea, controlSurface } from "@/components/ui/control-surface"

// The tick draws itself on, the same stroke-dashoffset technique EmailInput
// uses. Dashed at 2 against a path normalised to 1, so the hidden state falls
// inside a gap: at exactly 1 the gap opens on the first point and the round cap
// paints it as a dot.
//
// It lives directly under the root rather than in a Radix Indicator, which
// unmounts on uncheck and would cut the exit off at its first frame.
const TICK =
  "[stroke-dasharray:2] [stroke-dashoffset:2] [transition:stroke-dashoffset_.25s_ease] group-data-checked/checkbox:[stroke-dashoffset:0] group-data-checked/checkbox:[transition:stroke-dashoffset_.4s_ease_.05s] motion-reduce:transition-none"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        controlSurface,
        controlHitArea,
        "group/checkbox grid size-6 place-items-center rounded-lg text-background disabled:text-subtle-foreground",
        className
      )}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path pathLength={1} className={TICK} d="M5 13l4 4L19 7" />
      </svg>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
