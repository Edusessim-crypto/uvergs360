"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-[#d3dbe8]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(14_27_54/0.25)] ring-0 transition-transform duration-150 data-[state=checked]:translate-x-[17px] data-[state=unchecked]:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
