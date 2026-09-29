"use client"

import { cn } from "@/lib/utils"

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "default",
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: React.ReactNode }[]
  className?: string
  size?: "sm" | "default"
}) {
  return (
    <div role="radiogroup" className={cn("inline-flex items-center gap-0.5 rounded-lg bg-canvas-2 p-[3px]", className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all duration-150",
              size === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-8 px-3 text-[13px]",
              active ? "bg-white text-ink shadow-[0_1px_2px_rgb(14_27_54/0.08),0_0_0_1px_rgb(14_27_54/0.04)]" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
