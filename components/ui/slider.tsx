"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * The filled part: the track's own wash laid over itself, so the boundary reads
 * as depth rather than as a second colour. Exported because the fill is often
 * animated, and a motion element has to wear these classes itself.
 *
 * The grip sits inside the leading edge and fades on `--grip-opacity`, which the
 * consumer drives: it has to disappear as it reaches the label or the readout,
 * and only they know where those sit.
 */
const sliderFill =
  "absolute h-full rounded-xl bg-wash/30 select-none after:absolute after:top-1/2 after:right-2 after:h-5 after:w-0.5 after:-translate-y-1/2 after:rounded-full after:bg-foreground/50 after:opacity-[var(--grip-opacity,1)] after:content-[''] after:[transition:opacity_.15s_ease-in-out] motion-reduce:after:transition-none"

function Slider({
  className,
  children,
  // Forwarded to the thumb, not left on the root: the thumb is what carries
  // role="slider", so a label anywhere else is never announced.
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
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
        {children ?? (
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={sliderFill}
          />
        )}
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={ariaLabel}
        className="block h-11 w-5 outline-none"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider, sliderFill }
