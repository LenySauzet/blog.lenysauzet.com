"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * The filled part: the track's own wash laid over itself, so the boundary reads
 * as depth rather than as a second colour.
 */
const sliderFill = "absolute h-full rounded-xl bg-wash/30 select-none"

/**
 * The grip rides near the fill's leading edge but is not part of it: at the
 * bottom of the range the fill has no width left to hang it off, and it has to
 * stay in the bar rather than follow the edge out of it.
 */
const sliderGrip =
  "pointer-events-none absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground/50 [transition:opacity_.15s_ease-in-out] motion-reduce:transition-none"

/**
 * Marks a detent on a stepped bar. Sits above the fill rather than under it, so
 * a step stays legible on the side already covered, and gets out of the way once
 * the bar is resting on it: the grip already marks where that is.
 */
const sliderDot =
  "pointer-events-none absolute top-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/25 [transition:opacity_.15s_ease-in-out] motion-reduce:transition-none"

/** Children are required: the fill and its grip are the consumer's to animate. */
function Slider({
  className,
  children,
  // Forwarded to the thumb, not left on the root: the thumb is what carries
  // role="slider", so a label anywhere else is never announced.
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
