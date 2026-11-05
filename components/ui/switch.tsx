"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { controlHitArea, controlSurface } from "@/components/ui/control-surface"

const THUMB =
  "pointer-events-none ml-0.5 block size-4.5 rounded-full bg-input-icon [transition:translate_.25s_ease,width_.12s_ease,background_.3s,box-shadow_.2s] motion-reduce:transition-none group-[:enabled:active]/switch:w-5 motion-reduce:group-active/switch:w-4.5 group-disabled/switch:bg-subtle-foreground data-checked:translate-x-5 data-checked:bg-primary-foreground data-checked:shadow-[var(--shadow-knob)] data-checked:[transition:translate_.35s_cubic-bezier(0.2,0.85,0.32,1.2),width_.12s_ease,background_.3s,box-shadow_.2s] group-[:enabled:active]/switch:data-checked:translate-x-[18px] group-[:enabled:active]/switch:data-checked:[transition:translate_.12s_ease,width_.12s_ease,background_.3s,box-shadow_.2s]"

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
        className={THUMB}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
