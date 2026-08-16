import * as React from "react"

import { cn } from "@/lib/utils"
import { inputSurface } from "@/components/ui/input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputSurface, "block min-h-16 resize-none px-4 py-2", className)}
      {...props}
    />
  )
}

export { Textarea }
