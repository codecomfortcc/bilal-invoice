import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-2 text-base transition-all duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none focus-visible:bg-transparent dark:focus-visible:bg-transparent disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)] focus-visible:shadow-[inset_0_-2px_0_var(--primary)] dark:focus-visible:shadow-[inset_0_-2px_0_var(--primary)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
