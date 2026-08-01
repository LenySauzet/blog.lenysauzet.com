import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Customized beyond the CLI output; see CLAUDE.md.
//
// The transition lists `scale` explicitly. Tailwind v4's scale-* utilities set
// the `scale` property, not `transform`, so a transition naming only `transform`
// animates nothing and the press snaps.
//
// Filled buttons carry a bevel: a white inset highlight along the top edge and
// a dark one along the bottom, so they read as lit from above. Those two are
// deliberately fixed rgba rather than tokens — they are lighting, not colour,
// and must not rotate with --base-hue.
const BEVEL =
  "shadow-[inset_0_1px_1px_0_rgb(255_255_255/0.3),inset_0_-1.5px_2px_0_rgb(0_0_0/0.3)]";

// Hover does not change the fill; it adds a wide, soft glow underneath. The
// glow is deeper and more saturated than the fill itself, so `--primary` alone
// reads washed out; the relative syntax keeps the hue on the token while taking
// the reference's lightness and chroma.
//
// Written out in full, not assembled from the constant above: Tailwind scans
// source for complete class strings, so a name built by interpolation is never
// seen and the class is silently never generated.
const GLOW_PRIMARY =
  "hover:shadow-[inset_0_1px_1px_0_rgb(255_255_255/0.3),inset_0_-1.5px_2px_0_rgb(0_0_0/0.3),0_2px_40px_-4px_oklch(from_var(--primary)_0.5319_0.212_h)]";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap cursor-pointer outline-none select-none [transition:background_.2s,scale_.2s,transform_.2s,color_.2s,box-shadow_.3s] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.95] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground ${BEVEL} ${GLOW_PRIMARY}`,
        outline:
          "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-subtle-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
