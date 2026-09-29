import * as React from "react"
import { cn } from "@/lib/utils"

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2 flex items-center gap-2">{eyebrow}</div>}
        <h1 className="font-display text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] text-ink sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
