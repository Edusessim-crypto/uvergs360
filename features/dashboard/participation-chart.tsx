"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { MonthlyPoint } from "@/types"
import { ChartCard } from "@/components/shared/chart-card"
import { ChartTooltip, GRID, Legend, axisProps } from "@/components/charts/chart-kit"
import { formatNumber, formatPercent } from "@/lib/format"

const REG = "#c9d8f7"
const ATT = "#2f6bff"

export function ParticipationChart({ data, loading }: { data?: MonthlyPoint[]; loading: boolean }) {
  const totalAtt = data?.reduce((a, m) => a + m.attendance, 0) ?? 0
  const totalReg = data?.reduce((a, m) => a + m.registrations, 0) ?? 0
  return (
    <ChartCard
      title="Inscrições e participações"
      description="Últimos 12 meses — presença efetiva sobre inscrições confirmadas"
      loading={loading}
      height={268}
      legend={
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-6">
            <div>
              <div className="kpi-value text-[24px] leading-none">{formatNumber(totalAtt)}</div>
              <div className="mt-1 text-xs text-ink-3">participações</div>
            </div>
            <div>
              <div className="kpi-value text-[24px] leading-none">{totalReg ? formatPercent((totalAtt / totalReg) * 100) : "—"}</div>
              <div className="mt-1 text-xs text-ink-3">taxa de presença</div>
            </div>
          </div>
          <Legend
            items={[
              { label: "Inscrições", color: REG },
              { label: "Participações", color: ATT },
            ]}
          />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barGap={-18} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="month" {...axisProps} dy={6} />
          <YAxis {...axisProps} width={44} tickFormatter={(v) => formatNumber(v)} />
          <Tooltip
            cursor={{ fill: "rgba(14,27,54,0.04)", radius: 6 }}
            content={(p) => (
              <ChartTooltip
                active={p.active}
                label={p.label as string}
                payload={p.payload as never}
                labelFormatter={(l) => {
                  const row = data?.find((d) => d.month === l)
                  return (
                    <span className="flex items-center justify-between gap-4">
                      {l}
                      {row && <span className="text-xs font-medium text-ink-3">{formatPercent((row.attendance / row.registrations) * 100)} presença</span>}
                    </span>
                  )
                }}
              />
            )}
          />
          <Bar dataKey="registrations" name="Inscrições" fill={REG} radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={700} />
          <Bar dataKey="attendance" name="Participações" fill={ATT} radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
