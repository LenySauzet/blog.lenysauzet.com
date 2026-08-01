import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-sm [transition:border-color_.3s,box-shadow_.3s] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:shadow-[0_2px_20px_-2px_var(--glow)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted aria-invalid:border-destructive aria-invalid:shadow-[0_2px_20px_-2px_var(--destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
