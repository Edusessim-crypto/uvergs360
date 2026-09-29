import * as React from "react"
import { cn } from "@/lib/utils"

/** Superfície padrão de conteúdo (card) com cabeçalho opcional. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  headerClassName,
  flush = false,
  as: Comp = "section",
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
  headerClassName?: string
  /** Remove o padding do corpo (tabelas, listas de borda a borda). */
  flush?: boolean
  as?: "section" | "div" | "article"
}) {
  return (
    <Comp className={cn("card flex min-w-0 flex-col", className)}>
      {(title || action) && (
        <header className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6", flush ? "pb-4" : "pb-1", headerClassName)}>
          <div className="min-w-0">
            {title && <h2 className="font-display text-[15.5px] leading-snug font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", !flush && "px-5 pt-4 pb-5 sm:px-6 sm:pb-6", bodyClassName)}>{children}</div>
    </Comp>
  )
}

/** Linha rótulo/valor para painéis de dados. */
export function DataRow({ label, value, icon, className }: { label: React.ReactNode; value: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2.5 text-[13.5px]", className)}>
      <span className="flex items-center gap-2 text-ink-3">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right font-medium break-words text-ink">{value}</span>
    </div>
  )
}
