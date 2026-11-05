"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { controlHitArea, controlSurface } from "@/components/ui/control-surface"

const DOT =
  "before:absolute before:inset-0 before:scale-[0.7] before:rounded-full before:bg-background before:opacity-0 before:content-[''] before:[transition:scale_.3s_ease,opacity_.2s] disabled:before:bg-subtle-foreground motion-reduce:before:transition-none"

const DOT_CHECKED =
  "data-checked:before:scale-50 data-checked:before:opacity-100 data-checked:before:[transition:scale_.6s_cubic-bezier(0.2,0.85,0.32,1.2),opacity_.3s]"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        controlSurface,
        controlHitArea,
        "size-5 rounded-full",
        DOT,
        DOT_CHECKED,
        className
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioGroupItem }
