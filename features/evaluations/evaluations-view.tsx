"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Evaluation } from "@/types"
import { evaluationService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDate, formatDecimal } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { DataTable } from "@/components/shared/data-table"
import { Ring } from "@/components/shared/meter"
import { ChartTooltip, GRID, SERIES, axisProps, BarList, Legend } from "@/components/charts/chart-kit"

const CONGRESSO = "ev-congresso-estadual"

export function EvaluationsView() {
  const [event, setEvent] = React.useState(CONGRESSO)
  const eventId = event === "all" ? undefined : event
  const all = useQuery({ queryKey: qk.evaluationSummary(), queryFn: () => evaluationService.summary() })
  const summary = useQuery({ queryKey: qk.evaluationSummary(eventId), queryFn: () => evaluationService.summary(eventId) })
  const list = useQuery({ queryKey: qk.evaluations(eventId), queryFn: () => evaluationService.list(eventId) })
  const s = summary.data

  const columns = React.useMemo<ColumnDef<Evaluation>[]>(
    () => [
      { accessorKey: "respondentName", header: "Participante", cell: ({ row }) => <div><div className="font-semibold text-ink">{row.original.respondentName}</div><div className="text-xs text-ink-3">{row.original.chamberName.replace("Câmara Municipal de", "Câmara de")}</div></div> },
      { accessorKey: "eventTitle", header: "Evento", cell: ({ getValue }) => <span className="block max-w-[200px] truncate text-ink-2">{String(getValue())}</span> },
      {
        accessorKey: "score",
        header: "NPS",
        cell: ({ getValue }) => {
          const v = Number(getValue())
          return <span className={cn("inline-flex size-7 items-center justify-center rounded-md text-xs font-bold", v >= 9 ? "bg-success-50 text-success-700" : v >= 7 ? "bg-warning-50 text-warning-700" : "bg-danger-50 text-danger-700")}>{v}</span>
        },
      },
      { accessorKey: "rating", header: "Nota", meta: { align: "right" } },
      { accessorKey: "comment", header: "Comentário", enableSorting: false, cell: ({ getValue }) => <span className="block max-w-[360px] truncate text-ink-2">{String(getValue()) || <span className="text-ink-4">—</span>}</span> },
      { accessorKey: "at", header: "Data", cell: ({ getValue }) => formatDate(String(getValue())) },
    ],
    [],
  )

  const dist = s?.distribution ?? []
  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Avaliações"
        description="Satisfação dos participantes, NPS e interesses para os próximos eventos."
        actions={
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger className="w-[300px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {all.data?.byEvent.map((e) => <SelectItem key={e.eventId} value={e.eventId}>{e.eventTitle}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
        <div className="card flex items-center gap-5 p-6 lg:row-span-1">
          <Ring value={Math.max(0, s?.nps ?? 0)} size={104} stroke={9} tone="success">
            <div className="text-center"><div className="font-display text-[32px] leading-none font-semibold text-ink tnum">{s?.nps ?? "—"}</div><div className="mt-0.5 text-[10.5px] text-ink-3">NPS</div></div>
          </Ring>
          <div>
            <div className="text-[13.5px] font-semibold text-ink">{(s?.nps ?? 0) >= 70 ? "Zona de excelência" : "Zona de qualidade"}</div>
            <div className="mt-1 text-xs leading-relaxed text-ink-3">Promotores menos detratores, em relação ao total de respostas.</div>
          </div>
        </div>
        {[
          ["Respostas", s?.responses, s ? `${s.responseRate}% dos presentes` : ""],
          ["Nota média", s ? formatDecimal(s.averageRating) : undefined, "escala de 0 a 10"],
          ["Promotores", s?.promoters, s ? `${s.passives} neutros · ${s.detractors} detratores` : ""],
        ].map(([l, v, h]) => (
          <div key={String(l)} className="card p-6">
            <div className="text-[13px] font-medium text-ink-2">{l}</div>
            {v === undefined ? <Skeleton className="mt-2 h-9 w-20" /> : <div className="kpi-value mt-2 text-[34px] leading-none">{v}</div>}
            <div className="mt-2 text-xs text-ink-3">{h}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Distribuição das notas"
          description="Quantas respostas em cada nota de recomendação"
          action={<Legend items={[{ label: "Detratores", color: SERIES[4] }, { label: "Neutros", color: SERIES[1] }, { label: "Promotores", color: SERIES[3] }]} />}
        >
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="score" {...axisProps} />
                <YAxis {...axisProps} allowDecimals={false} width={40} />
                <Tooltip cursor={{ fill: "rgba(14,27,54,0.04)" }} content={(p) => <ChartTooltip active={p.active} label={`Nota ${p.label}`} payload={p.payload as never} />} />
                <Bar dataKey="count" name="Respostas" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {dist.map((d) => <Cell key={d.score} fill={d.score >= 9 ? SERIES[3] : d.score >= 7 ? SERIES[1] : SERIES[4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Interesses mais selecionados" description="Temas desejados para próximos eventos">
          <BarList items={(s?.interests ?? []).map((i) => ({ label: i.label, value: i.value }))} color={SERIES[2]} />
        </Panel>
      </div>

      <DataTable columns={columns} data={list.data ?? []} loading={list.isLoading} entity={["avaliação", "avaliações"]} initialSorting={[{ id: "at", desc: true }]} />
    </div>
  )
}
