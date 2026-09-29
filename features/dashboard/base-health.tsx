"use client"

import type { HealthIndicator } from "@/types"
import { Panel } from "@/components/shared/panel"
import { Meter, Ring } from "@/components/shared/meter"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDecimal } from "@/lib/format"

export function BaseHealth({ items, loading }: { items?: HealthIndicator[]; loading: boolean }) {
  const avg = items ? Math.round(items.reduce((a, i) => a + i.value, 0) / items.length) : 0
  return (
    <Panel title="Saúde da base" description="Qualidade do relacionamento e dos cadastros" className="h-full">
      {loading || !items ? (
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4 rounded-lg bg-canvas px-4 py-3.5">
            <Ring value={avg} size={52} stroke={5} tone="success">
              <span className="font-display text-[13px] font-semibold text-ink tnum">{avg}</span>
            </Ring>
            <div>
              <div className="text-[13.5px] font-semibold text-ink">Índice de qualidade {avg >= 85 ? "alto" : "moderado"}</div>
              <div className="text-xs text-ink-3">Média dos indicadores cadastrais</div>
            </div>
          </div>
          <ul className="space-y-4">
            {items.map((i) => (
              <li key={i.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium text-ink">{i.label}</span>
                  <span className="font-display text-[14px] font-semibold text-ink tnum">{Number.isInteger(i.value) ? i.value : formatDecimal(i.value)}%</span>
                </div>
                <Meter value={i.value} tone={i.value >= 90 ? "success" : i.value >= 80 ? "brand" : "warning"} />
                <div className="mt-1 text-[11.5px] text-ink-3">{i.hint}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
