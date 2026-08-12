"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { controlHitArea, controlSurface } from "@/components/ui/control-surface"

// The tick is a 6x10 box wearing only its right and bottom borders, swung into
// place. Drawn on the root rather than in an Indicator, which Radix unmounts on
// uncheck and would cut the exit short.
//
// The transition names `rotate`, not `transform`: Tailwind's rotate-* sets the
// standalone property, so a transform transition never fires.
const TICK =
  "before:absolute before:top-[5px] before:left-2 before:h-2.5 before:w-1.5 before:rotate-[20deg] before:border-2 before:border-t-0 before:border-l-0 before:border-background before:opacity-0 before:content-[''] before:[transition:rotate_.3s_ease,opacity_.2s] disabled:before:border-subtle-foreground motion-reduce:before:transition-none"

const TICK_CHECKED =
  "data-checked:before:rotate-[43deg] data-checked:before:opacity-100 data-checked:before:[transition:rotate_.6s_cubic-bezier(0.2,0.85,0.32,1.2)_.1s,opacity_.3s]"

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
        "size-6 rounded-lg",
        TICK,
        TICK_CHECKED,
        className
      )}
      {...props}
    />
  )
}

export { Checkbox }
