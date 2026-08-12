import * as React from "react"

import { cn } from "@/lib/utils"

const inputSurface =
  "w-full min-w-0 rounded-lg border border-border bg-background text-sm leading-[26px] outline-none [transition:border-color_.3s,box-shadow_.3s] motion-reduce:transition-none placeholder:text-subtle-foreground/50 enabled:hover:border-primary enabled:hover:shadow-[0_2px_20px_-2px_var(--glow)] focus-visible:border-primary focus-visible:shadow-[0_2px_20px_-2px_var(--glow)] disabled:cursor-not-allowed disabled:bg-input-disabled disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[0_2px_20px_-2px_var(--destructive)]"

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
