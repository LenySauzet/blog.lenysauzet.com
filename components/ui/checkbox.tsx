"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { controlHitArea, controlSurface } from "@/components/ui/control-surface"

const TICK =
  "[stroke-dasharray:2] [stroke-dashoffset:2] [transition:stroke-dashoffset_.3s_ease] group-data-checked/checkbox:[stroke-dashoffset:0] group-data-checked/checkbox:[transition:stroke-dashoffset_.6s_ease_.05s] motion-reduce:transition-none"

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
        "group/checkbox grid size-5 place-items-center rounded-lg text-background disabled:text-subtle-foreground",
        className
      )}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-3"
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
