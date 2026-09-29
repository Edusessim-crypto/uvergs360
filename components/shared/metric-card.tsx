import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "./animated-number"
import { Delta } from "./delta"
import { Sparkline } from "@/components/charts/sparkline"

export function MetricCard({
  label,
  value,
  total,
  suffix,
  delta,
  deltaSuffix = "%",
  deltaLabel,
  goodWhen = "up",
  icon: Icon,
  trend,
  href,
  loading,
  footer,
  className,
  format,
}: {
  label: string
  value: number | null | undefined
  total?: number
  suffix?: string
  delta?: number
  deltaSuffix?: string
  deltaLabel?: string
  goodWhen?: "up" | "down"
  icon?: React.ComponentType<{ className?: string }>
  trend?: number[]
  href?: string
  loading?: boolean
  footer?: React.ReactNode
  className?: string
  format?: (n: number) => string
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-md bg-canvas text-ink-3 transition-colors group-hover/metric:bg-brand-50 group-hover/metric:text-brand-600">
            <Icon className="size-4" />
          </span>
        )}
        {!Icon && href && <ArrowUpRight className="size-4 text-ink-4 transition-colors group-hover/metric:text-brand-600" />}
      </div>
      {loading ? (
        <div className="mt-3 space-y-2.5">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="kpi-value text-[30px] leading-none">{value === null || value === undefined ? "—" : <AnimatedNumber value={value} format={format} />}</span>
            {suffix && <span className="font-display text-lg font-semibold text-ink-2">{suffix}</span>}
            {total !== undefined && <span className="font-display text-[17px] font-medium text-ink-3">/ {total.toLocaleString("pt-BR")}</span>}
          </div>
          <div className="mt-3 flex min-h-5 items-end justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {delta !== undefined && <Delta value={delta} suffix={deltaSuffix} goodWhen={goodWhen} />}
              {deltaLabel && <span className="truncate text-xs text-ink-3">{deltaLabel}</span>}
              {footer}
            </div>
            {trend && <Sparkline data={trend} className="h-7 w-20 shrink-0" />}
          </div>
        </>
      )}
    </>
  )

  const classes = cn("group/metric card block p-5 transition-[border-color,box-shadow] duration-200", href && "hover:border-brand-200 hover:shadow-raised", className)
  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    )
  }
  return <div className={classes}>{body}</div>
}
