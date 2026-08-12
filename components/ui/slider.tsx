"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// The filled part is the track's own wash laid over itself, so the boundary
// reads as depth rather than as a second colour. A grip sits just inside its
// leading edge; the thumb itself stays invisible and is only a drag target.
const GRIP =
  "after:absolute after:top-1/2 after:right-2 after:h-5 after:w-0.5 after:-translate-y-1/2 after:rounded-full after:bg-foreground/50 after:content-['']"

function Slider({
  className,
  // Forwarded to the thumb, not left on the root: the thumb is what carries
  // role="slider", so a label anywhere else is never announced.
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex h-12 w-full cursor-grab touch-none items-center overflow-clip rounded-xl bg-subtle-foreground/25 select-none active:cursor-grabbing",
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
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute h-full rounded-xl bg-subtle-foreground/25 select-none",
            GRIP
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={ariaLabel}
        className="block h-11 w-5 outline-none"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
