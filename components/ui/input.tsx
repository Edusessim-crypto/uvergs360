import * as React from "react"
import { cn } from "@/lib/utils"

const fieldBase =
  "w-full min-w-0 rounded-md border border-line bg-white text-[13.5px] text-ink shadow-[0_1px_1px_rgb(14_27_54/0.03)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-[#c9d3e6] focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-70 aria-invalid:border-danger-500 aria-invalid:ring-danger-500/15"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldBase,
        "h-9 px-3 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  )
}

export { Input, fieldBase }
