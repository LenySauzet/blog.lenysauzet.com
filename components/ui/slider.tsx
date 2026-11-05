"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const sliderFill = "absolute h-full rounded-xl bg-wash/30 select-none"

const sliderGrip =
  "pointer-events-none absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground/50 [transition:opacity_.2s_ease-in-out,scale_.2s_ease-in-out] motion-reduce:transition-none"

// Drawn above the fill, so a detent stays legible on the covered side.
const sliderDot =
  "pointer-events-none absolute top-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/25 [transition:opacity_.15s_ease-in-out] motion-reduce:transition-none"

function Slider({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  children: React.ReactNode
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex h-12 w-full cursor-grab touch-none items-center overflow-clip rounded-xl bg-wash/30 select-none active:cursor-grabbing",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
        "data-disabled:cursor-not-allowed data-disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-full grow"
      >
        {children}
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={ariaLabel}
        className="block h-11 w-5 outline-none"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider, sliderDot, sliderFill, sliderGrip }
