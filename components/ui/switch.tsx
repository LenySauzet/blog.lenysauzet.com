"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { controlHitArea, controlSurface } from "@/components/ui/control-surface"

// Travel overshoots slightly on the way in and settles back, so the knob reads
// as thrown rather than slid; leaving has nothing to land against, so it does
// not bounce. Held down it widens at a fixed radius, drawing itself out into a
// capsule. Scaling instead would stretch the radius with it and give an ellipse.
//
// The 2px it gains is what the travel leaves free at the far end. Widening
// further pushes a white knob out past the pill's own edge.
//
// The transition names `translate`, not `transform`: Tailwind sets it as its
// own property, so a transform transition never fires.
const THUMB =
  "pointer-events-none ml-0.5 block size-4.5 rounded-full bg-input-icon [transition:translate_.25s_ease,width_.12s_ease,background_.3s,box-shadow_.2s] motion-reduce:transition-none group-enabled/switch:group-active/switch:w-5 motion-reduce:group-active/switch:w-4.5 group-disabled/switch:bg-subtle-foreground"

const THUMB_CHECKED =
  "data-checked:translate-x-5 data-checked:bg-primary-foreground data-checked:shadow-[var(--shadow-knob)] data-checked:[transition:translate_.35s_cubic-bezier(0.2,0.85,0.32,1.2),width_.12s_ease,background_.3s,box-shadow_.2s]"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        controlSurface,
        controlHitArea,
        "group/switch inline-flex h-6 w-11 items-center rounded-full",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(THUMB, THUMB_CHECKED)}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
