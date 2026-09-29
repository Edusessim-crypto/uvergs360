import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel } from "./panel"
import { cn } from "@/lib/utils"

/** Painel padrão para gráficos: título, subtítulo, legenda e área com altura fixa. */
export function ChartCard({
  title,
  description,
  action,
  legend,
  height = 260,
  loading,
  children,
  className,
  footer,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  legend?: React.ReactNode
  height?: number
  loading?: boolean
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
}) {
  return (
    <Panel title={title} description={description} action={action} className={className}>
      {legend && <div className="mb-4">{legend}</div>}
      <div style={{ height }} className="w-full min-w-0">
        {loading ? <Skeleton className="size-full" /> : children}
      </div>
      {footer && <div className={cn("mt-4 border-t border-line-soft pt-4")}>{footer}</div>}
    </Panel>
  )
}
