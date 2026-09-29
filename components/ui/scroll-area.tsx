"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function ScrollArea({ className, children, dark = false, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & { dark?: boolean }) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport data-slot="scroll-area-viewport" className="size-full rounded-[inherit] outline-none">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar dark={dark} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({ className, orientation = "vertical", dark, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & { dark?: boolean }) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn("flex touch-none p-px transition-colors select-none", orientation === "vertical" && "h-full w-2", orientation === "horizontal" && "h-2 flex-col", className)}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb data-slot="scroll-area-thumb" className={cn("relative flex-1 rounded-full", dark ? "bg-white/15" : "bg-[#cfd7e6]")} />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
