import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-1 text-base transition-all duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none focus-visible:bg-transparent dark:focus-visible:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-sm shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)] focus-visible:shadow-[inset_0_-2px_0_var(--primary)] dark:focus-visible:shadow-[inset_0_-2px_0_var(--primary)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
