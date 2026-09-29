"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"

/** Paleta categórica validada (ordem fixa — nunca reciclar). */
export const SERIES = ["#2f6bff", "#e39a00", "#8a5cd8", "#12a08a", "#e0605a"] as const
/** Rampa sequencial (azul UVERGS) para magnitude / mapas. */
export const SEQUENTIAL = ["#e8eefc", "#c9d8f7", "#a3bdf1", "#7399e8", "#4a76dc", "#2556c9", "#0b3fb8", "#06246e"] as const
export const GRID = "#e8edf5"
export const AXIS = "#8a94a8"

export const axisProps = {
  tick: { fill: AXIS, fontSize: 11.5 },
  tickLine: false,
  axisLine: false,
} as const

/** Tooltip padrão dos gráficos Recharts. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v: number) => formatNumber(v),
  labelFormatter,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string; payload?: Record<string, unknown> }[]
  label?: string | number
  valueFormatter?: (v: number, key?: string) => string
  labelFormatter?: (label: string | number) => React.ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-36 rounded-lg border border-line-soft bg-white px-3 py-2.5 text-[12.5px] shadow-pop">
      {label !== undefined && <div className="mb-1.5 font-semibold text-ink">{labelFormatter ? labelFormatter(label) : label}</div>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-ink-2">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-semibold text-ink tnum">{valueFormatter(Number(p.value ?? 0), p.dataKey)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Legend({ items, className }: { items: { label: string; color: string; value?: React.ReactNode; dashed?: boolean }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2", className)}>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2">
          {i.dashed ? (
            <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          )}
          {i.label}
          {i.value !== undefined && <span className="font-semibold text-ink tnum">{i.value}</span>}
        </span>
      ))}
    </div>
  )
}

/** Barras horizontais em HTML (rótulo + valor + barra) — ótimo para rankings e origens. */
export function BarList({
  items,
  valueFormatter = (v: number) => formatNumber(v),
  max,
  color = SERIES[0],
  onSelect,
  activeKey,
  className,
}: {
  items: { key?: string; label: string; value: number; hint?: string }[]
  valueFormatter?: (v: number) => string
  max?: number
  color?: string
  onSelect?: (key: string) => void
  activeKey?: string | null
  className?: string
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const key = item.key ?? item.label
        const active = activeKey === key
        const Comp = onSelect ? "button" : "div"
        return (
          <li key={key}>
            <Comp
              {...(onSelect ? { onClick: () => onSelect(key), type: "button" as const } : {})}
              className={cn("group/bar block w-full text-left", onSelect && "cursor-pointer")}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
                <span className={cn("truncate text-ink-2 transition-colors", onSelect && "group-hover/bar:text-ink", active && "font-semibold text-ink")}>{item.label}</span>
                <span className="shrink-0 font-semibold text-ink tnum">
                  {valueFormatter(item.value)}
                  {item.hint && <span className="ml-1.5 font-normal text-ink-3">{item.hint}</span>}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-canvas-2">
                <div
                  className={cn("h-full rounded-full transition-[width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", activeKey && !active && "opacity-35")}
                  style={{ width: `${(item.value / top) * 100}%`, background: color }}
                />
              </div>
            </Comp>
          </li>
        )
      })}
    </ul>
  )
}
