"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-2.5", className)} {...props} />
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer aspect-square size-4 shrink-0 rounded-full border border-[#c3cddf] bg-white outline-none transition-colors hover:border-brand-400 focus-visible:ring-[3px] focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand-600",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center">
        <span className="size-2 rounded-full bg-brand-600" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
