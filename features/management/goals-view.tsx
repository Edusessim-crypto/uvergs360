"use client"

import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { goalService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { ExportMenu } from "@/components/shared/export-menu"
import { ChartTooltip, GRID, Legend, SERIES, axisProps } from "@/components/charts/chart-kit"

export function GoalsView() {
  const { data, isLoading } = useQuery({ queryKey: qk.goals, queryFn: () => goalService.list() })
  const fmt = (v: number, unit: string) => (unit === "percentual" ? `${v}%` : formatNumber(v))
  const main = data?.slice(0, 3) ?? []
  const featured = data?.[0]

  return (
    <div className="space-y-6">
      <PageHeader className="mb-0" title="Metas & Impacto" description="Compromissos anuais da UVERGS: meta versus realizado." actions={<ExportMenu reportId="metas" />} />

      <div className="grid gap-4 lg:grid-cols-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-xl" />)}
        {main.map((g) => {
          const pct = Math.round((g.actual / g.target) * 100)
          return (
            <div key={g.id} className="card p-6">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">{g.label}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", pct >= 95 ? "bg-success-50 text-success-700" : pct >= 80 ? "bg-brand-50 text-brand-600" : "bg-warning-50 text-warning-700")}>{pct}%</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><div className="eyebrow">Meta</div><div className="mt-1 font-display text-[26px] font-semibold text-ink-3 tnum">{fmt(g.target, g.unit)}</div></div>
                <div><div className="eyebrow">Realizado</div><div className="mt-1 font-display text-[26px] font-semibold text-ink tnum">{fmt(g.actual, g.unit)}</div></div>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-50">
                <div className="h-full rounded-full bg-brand-600 transition-[width] duration-700" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="mt-2 text-xs text-ink-3">{g.description}</div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel
          title={`${featured?.label ?? "Participantes"} por trimestre`}
          description="Meta trimestral e realizado"
          action={<Legend items={[{ label: "Meta", color: "#c9d8f7" }, { label: "Realizado", color: SERIES[0] }]} />}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featured?.quarterly ?? []} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="quarter" {...axisProps} />
                <YAxis {...axisProps} width={44} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip cursor={{ fill: "rgba(14,27,54,0.04)" }} content={(p) => <ChartTooltip active={p.active} label={p.label as string} payload={p.payload as never} />} />
                <Bar dataKey="target" name="Meta" fill="#c9d8f7" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="actual" name="Realizado" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Todos os indicadores" flush>
          <ul className="divide-y divide-line-soft border-t border-line-soft">
            {data?.map((g) => {
              const pct = Math.round((g.actual / g.target) * 100)
              return (
                <li key={g.id} className="px-6 py-3.5">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-medium text-ink">{g.label}<span className="ml-2 text-xs text-ink-3">{g.category}</span></span>
                    <span className="text-[13px] text-ink-2 tnum"><span className="font-semibold text-ink">{fmt(g.actual, g.unit)}</span> / {fmt(g.target, g.unit)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-canvas-2">
                    <div className={cn("h-full rounded-full", pct >= 100 ? "bg-success-500" : pct >= 85 ? "bg-brand-600" : "bg-warning-500")} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
