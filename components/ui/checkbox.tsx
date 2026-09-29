"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer grid size-4 shrink-0 place-content-center rounded-[4px] border border-[#c3cddf] bg-white shadow-[0_1px_1px_rgb(14_27_54/0.04)] outline-none transition-colors duration-150 hover:border-brand-400 focus-visible:ring-[3px] focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 data-[state=checked]:text-white data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:bg-brand-600 data-[state=indeterminate]:text-white",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center text-current">
        {props.checked === "indeterminate" ? <MinusIcon className="size-3" strokeWidth={3} /> : <CheckIcon className="size-3" strokeWidth={3} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
