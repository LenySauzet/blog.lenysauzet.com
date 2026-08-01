import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm leading-[26px] resize-none [transition:border-color_.3s,box-shadow_.3s] outline-none placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:shadow-[0_2px_20px_-2px_var(--glow)] disabled:cursor-not-allowed disabled:bg-muted aria-invalid:border-destructive aria-invalid:shadow-[0_2px_20px_-2px_var(--destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
