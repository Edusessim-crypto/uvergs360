"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

const Popover = (props: React.ComponentProps<typeof PopoverPrimitive.Root>) => <PopoverPrimitive.Root data-slot="popover" {...props} />
const PopoverTrigger = (props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) => <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
const PopoverAnchor = (props: React.ComponentProps<typeof PopoverPrimitive.Anchor>) => <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />

function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-lg border border-line-soft bg-white p-4 text-ink shadow-pop outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97]",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
