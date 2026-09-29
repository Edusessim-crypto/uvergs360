"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-brand-50", className)} {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 rounded-full bg-brand-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", indicatorClassName)}
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value || 0))}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
