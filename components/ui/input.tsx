import * as React from "react"

import { cn } from "@/lib/utils"

// Customized beyond the CLI output; see CLAUDE.md. Exported so Textarea wears
// the identical surface and the two can never drift apart.
const inputSurface =
  "w-full min-w-0 rounded-lg border border-border bg-background text-sm leading-[26px] outline-none [transition:border-color_.3s,box-shadow_.3s] motion-reduce:transition-none placeholder:text-subtle-foreground/50 enabled:hover:border-primary enabled:hover:shadow-[var(--shadow-field)] focus-visible:border-primary focus-visible:shadow-[var(--shadow-field)] disabled:cursor-not-allowed disabled:border-input-disabled disabled:bg-input-disabled disabled:text-subtle-foreground disabled:placeholder:text-subtle-foreground aria-invalid:border-destructive aria-invalid:shadow-[var(--shadow-field-invalid)]"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputSurface,
        "h-9 px-3 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input, inputSurface }
