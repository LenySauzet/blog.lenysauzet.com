"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * A positioning shell, not a bordered container: the control keeps its own
 * surface and the addon floats over it. Laying the addon out as a flex sibling
 * would give it a box of its own, which breaks the focus glow across the edge.
 *
 * It is also the hover surface. `Input` reacts to its own `:hover` so a bare
 * field needs no wrapper, but an addon overlays the control as a sibling, so
 * pointing at it leaves the control unhovered. The group closes that gap.
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative block w-full",
        "[&:hover_[data-slot=input-group-control]:enabled]:border-primary",
        "[&:hover_[data-slot=input-group-control]:enabled]:shadow-[0_2px_20px_-2px_var(--glow)]",
        "has-[[data-align=inline-start]]:[&_[data-slot=input-group-control]]:pl-10",
        "has-[[data-align=inline-end]]:[&_[data-slot=input-group-control]]:pr-10",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center text-input-icon [transition:color_.3s] motion-reduce:transition-none peer-[:enabled:not(:placeholder-shown)]:text-primary peer-focus-visible:text-primary peer-[:enabled]:group-hover/input-group:text-primary [&_button]:pointer-events-auto [&>svg:not([class*='size-'])]:size-5",
  {
    variants: {
      align: {
        "inline-start": "left-3",
        "inline-end": "right-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

/**
 * Must follow the control in the DOM: every state colour above reads the
 * control through `peer-*`, which only sees earlier siblings.
 */
function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="input-group-button"
      className={cn(
        // The inner ring is the field's own fill: without that gap the focus
        // ring hugs the glyph and reads as part of the icon.
        "flex size-[22px] cursor-pointer items-center justify-center rounded-full outline-none [transition:box-shadow_.2s] focus-visible:shadow-[0_0_0_3px_var(--background),0_0_0_5px_var(--primary)] disabled:cursor-not-allowed motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn("peer", className)}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput }
