"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CalendarDays, CheckCircle2, Circle, Clock, ExternalLink, MapPin, Pencil, ScanLine, Send, Star, Users } from "lucide-react"
import { toast } from "sonner"
import type { Registration } from "@/types"
import { eventService, evaluationService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDateRange, formatNumber, formatPercent, formatRelativeDay, formatTimeAgo, formatDecimal } from "@/lib/format"
import { cn, normalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Panel } from "@/components/shared/panel"
import { StatusBadge } from "@/components/shared/status-badge"
import { EventDateBlock } from "@/components/shared/event-card"
import { Meter, Ring } from "@/components/shared/meter"
import { DataTable } from "@/components/shared/data-table"
import { SearchInput } from "@/components/shared/search-input"
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { ErrorState, EmptyState } from "@/components/shared/states"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { ChartTooltip, GRID, SERIES, SEQUENTIAL, axisProps, BarList } from "@/components/charts/chart-kit"
import { useBreadcrumbLabel } from "@/components/layout/shell-context"

export function Event360View({ id }: { id: string }) {
  const router = useRouter()
  const dash = useQuery({ queryKey: qk.eventDashboard(id), queryFn: () => eventService.getDashboard(id) })
  const regs = useQuery({ queryKey: qk.eventRegistrations(id), queryFn: () => eventService.getRegistrations(id) })
  const evals = useQuery({ queryKey: qk.evaluationSummary(id), queryFn: () => evaluationService.summary(id) })
  useBreadcrumbLabel(dash.data?.event.title)

  if (dash.isError) return <div className="card"><ErrorState title="Evento não encontrado" /></div>
  if (!dash.data) return <Skeleton className="h-[640px] w-full rounded-xl" />

  const { event: e, funnel, origins, registrationsTimeline, byRegion, checklist, daysToEvent } = dash.data
  const closed = e.status === "encerrado"
  const live = e.status === "em_andamento"
  const occupancy = e.capacity ? Math.round((e.registered / e.capacity) * 100) : 0
  const paidPct = e.registered ? Math.round((e.paymentsConfirmed / e.registered) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho de comando */}
      <section className="relative overflow-hidden rounded-xl bg-navy-900 text-white shadow-raised">
        <div className="absolute inset-0 bg-grid-navy" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(70%_140%_at_100%_0%,rgba(47,107,255,0.35),transparent_60%)]" aria-hidden />
        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-7">
          <div className="flex gap-5">
            <EventDateBlock date={e.startDate} tone="dark" className="size-16" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge domain="event" value={e.status} size="sm" className={cn(e.status === "inscricoes_abertas" && "bg-success-500/15 text-[#5fe39a]", closed && "bg-white/10 text-white/70", live && "bg-brand-500/25 text-white")} />
                <span className="text-[12.5px] text-white/55">{e.type} · {e.format}</span>
              </div>
              <h1 className="mt-2 font-display text-[28px] text-white leading-tight font-semibold tracking-[-0.025em] sm:text-[32px]">{e.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px] text-white/70">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDateRange(e.startDate, e.endDate)}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{e.city === "Online" ? e.venue : `${e.venue} · ${e.city}`}</span>
                {!closed && daysToEvent > 0 && <span className="inline-flex items-center gap-1.5 font-semibold text-gold-500"><Clock className="size-4" />Faltam {daysToEvent} dias</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="dark" onClick={() => toast.info("Edição do evento", { description: "Abra o assistente para alterar dados, valores e programação." })}><Pencil />Editar evento</Button>
            <Button variant="dark" asChild><Link href={`/e/${e.slug}`} target="_blank"><ExternalLink />Ver landing</Link></Button>
            <Button variant="accent" asChild><Link href={`/checkin?evento=${e.id}`}><ScanLine />Check-in</Link></Button>
          </div>
        </div>
        <div className="relative grid grid-cols-2 border-t border-white/10 sm:grid-cols-3 lg:grid-cols-6 [&>*]:border-white/10 [&>*:not(:last-child)]:border-r">
          {[
            ["Inscritos", <AnimatedNumber key="a" value={e.registered} />, `${occupancy}% da capacidade`],
            ["Capacidade", formatNumber(e.capacity), `${formatNumber(Math.max(0, e.capacity - e.registered))} vagas livres`],
            ["Pagamentos confirmados", <AnimatedNumber key="b" value={e.paymentsConfirmed} />, `${paidPct}% dos inscritos`],
            ["Presentes", e.present === null ? "—" : <AnimatedNumber key="c" value={e.present} />, e.present === null ? "Após o check-in" : `${Math.round((e.present / e.registered) * 100)}% de presença`],
            ["Câmaras", formatNumber(e.chambersCount), "representadas"],
            ["Municípios", formatNumber(e.municipalitiesCount), "de 497"],
          ].map(([l, v, s]) => (
            <div key={String(l)} className="px-5 py-4">
              <div className="text-[12px] text-white/55">{l}</div>
              <div className="mt-1 font-display text-[26px] leading-none font-semibold tracking-[-0.025em] tnum">{v}</div>
              <div className="mt-1.5 text-[11.5px] text-white/45">{s}</div>
            </div>
          ))}
        </div>
      </section>

      <Tabs defaultValue="visao">
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="inscritos">Inscritos <Badge size="sm" variant="neutral">{regs.data?.length ?? e.registered}</Badge></TabsTrigger>
          <TabsTrigger value="programacao">Programação</TabsTrigger>
          <TabsTrigger value="avaliacoes">Certificados e avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Panel title="Funil do evento" description="Da divulgação à presença — cada etapa em relação à anterior">
              <div className="space-y-2.5">
                {funnel.map((step, i) => {
                  const top = funnel[0].value ?? 1
                  const prev = i > 0 ? funnel[i - 1].value : null
                  const w = step.value === null ? 100 : 22 + 78 * Math.sqrt(step.value / top)
                  const conv = step.value !== null && prev ? Math.round((step.value / prev) * 100) : null
                  return (
                    <div key={step.label} className="flex items-center gap-4">
                      <div className="w-40 shrink-0 text-[13px] text-ink-2">{step.label}</div>
                      <div className="relative h-11 flex-1">
                        <div
                          className={cn("flex h-full items-center rounded-md px-3.5 transition-[width] duration-700", step.value === null && "border border-dashed border-line bg-canvas")}
                          style={{ width: `${w}%`, background: step.value === null ? undefined : SEQUENTIAL[7 - i] }}
                        >
                          <span className={cn("font-display text-[15px] font-semibold tnum", step.value === null ? "text-ink-3" : i >= 2 ? "text-white" : i === 1 ? "text-white" : "text-white")}>
                            {step.value === null ? "Resultado após o evento" : formatNumber(step.value)}
                          </span>
                        </div>
                      </div>
                      <div className="w-16 shrink-0 text-right text-[12.5px] font-semibold text-ink-2 tnum">{conv !== null ? `${conv}%` : i === 0 ? "" : "—"}</div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-[12.5px] text-ink-3">
                <span>Conversão total: <span className="font-semibold text-ink">{funnel[0].value ? formatPercent(((funnel[3].value ?? 0) / funnel[0].value) * 100, 1) : "—"}</span></span>
                <span>Abandono na inscrição: <span className="font-semibold text-ink">{funnel[2].value ? formatPercent((1 - (funnel[3].value ?? 0) / funnel[2].value) * 100) : "—"}</span></span>
              </div>
            </Panel>

            <Panel title="Origem das inscrições" description="Canal que gerou a inscrição">
              <BarList items={origins.map((o) => ({ label: o.label, value: o.value }))} valueFormatter={(v) => `${v}%`} max={100} />
              <p className="mt-5 rounded-lg bg-canvas px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">{origins[0]?.label}</span> é o canal mais eficiente deste evento. Campanhas por WhatsApp têm a maior taxa de conclusão de inscrição.
              </p>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Panel title="Evolução das inscrições" description="Acumulado dos últimos 35 dias e capacidade do evento">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationsTimeline} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="evArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="label" {...axisProps} interval={6} dy={6} />
                    <YAxis {...axisProps} width={40} domain={[0, Math.max(e.capacity, e.registered) * 1.05]} />
                    <ReferenceLine y={e.capacity} stroke="#e39a00" strokeDasharray="4 4" label={{ value: `Capacidade ${e.capacity}`, position: "insideTopRight", fill: "#8f5b00", fontSize: 11 }} />
                    <Tooltip content={(p) => <ChartTooltip active={p.active} label={p.label as string} payload={p.payload as never} />} />
                    <Area type="monotone" dataKey="total" name="Inscrições" stroke={SERIES[0]} strokeWidth={2} fill="url(#evArea)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Inscritos por região">
              {byRegion.length ? <BarList items={byRegion.map((r) => ({ label: r.label, value: r.value }))} color={SERIES[3]} /> : <EmptyState compact title="Sem inscrições" />}
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Panel title="Inscrições recentes" flush action={<Button size="sm" variant="ghost" asChild><Link href="/inscricoes">Ver todas</Link></Button>}>
              <ul className="divide-y divide-line-soft border-t border-line-soft">
                {(regs.data ?? []).slice(0, 6).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-6 py-3">
                    <PersonAvatar name={r.participantName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-ink">{r.participantName}</div>
                      <div className="truncate text-xs text-ink-3">{r.chamberName} · via {r.origin}</div>
                    </div>
                    <StatusBadge domain="payment" value={r.paymentStatus} size="sm" />
                    <span className="w-20 text-right text-xs text-ink-3">{formatTimeAgo(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Checklist operacional" description={`${checklist.filter((c) => c.done).length} de ${checklist.length} concluídos`}>
              <ul className="space-y-3">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-start gap-3">
                    {c.done ? <CheckCircle2 className="mt-px size-[18px] text-success-500" /> : <Circle className="mt-px size-[18px] text-ink-4" />}
                    <div>
                      <div className={cn("text-[13.5px]", c.done ? "text-ink" : "font-medium text-ink")}>{c.label}</div>
                      {c.hint && <div className="text-xs text-ink-3">{c.hint}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="inscritos">
          <RegistrantsTable data={regs.data} loading={regs.isLoading} onOpen={(r) => r.councilorId && router.push(`/vereadores/${r.councilorId}`)} />
        </TabsContent>

        <TabsContent value="programacao">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Panel title="Programação">
              {[...new Set(e.program.map((p) => p.day))].map((day) => (
                <div key={day} className="mb-6 last:mb-0">
                  <div className="eyebrow mb-3">Dia {day}</div>
                  <ol className="divide-y divide-line-soft rounded-lg border border-line-soft">
                    {e.program.filter((p) => p.day === day).map((p) => (
                      <li key={p.time + p.title} className="flex gap-4 px-4 py-3">
                        <span className="w-12 shrink-0 font-display text-[14px] font-semibold text-brand-600 tnum">{p.time}</span>
                        <div>
                          <div className="text-[13.5px] font-semibold text-ink">{p.title}</div>
                          {p.speaker && <div className="text-xs text-ink-3">{p.speaker}</div>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </Panel>
            <Panel title="Palestrantes">
              <ul className="space-y-3">
                {e.speakers.map((s) => (
                  <li key={s.name} className="flex items-center gap-3">
                    <PersonAvatar name={s.name} size="md" />
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink">{s.name}</div>
                      <div className="text-xs text-ink-3">{s.role}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="avaliacoes">
          {!closed ? (
            <div className="card">
              <EmptyState icon={Star} title="Disponível após o encerramento" description="Os certificados são emitidos automaticamente para os presentes e a pesquisa de satisfação é enviada ao fim do evento." />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="NPS do evento">
                <div className="flex items-center gap-5">
                  <Ring value={evals.data?.nps ?? 0} size={96} stroke={8} tone="success">
                    <span className="font-display text-[28px] font-semibold text-ink tnum">{evals.data?.nps ?? "—"}</span>
                  </Ring>
                  <div className="space-y-1 text-[13px]">
                    <div><span className="font-semibold text-ink">{evals.data?.responses ?? "—"}</span> respostas</div>
                    <div>Nota média <span className="font-semibold text-ink">{evals.data ? formatDecimal(evals.data.averageRating) : "—"}</span></div>
                    <div className="text-ink-3">{evals.data?.responseRate ?? "—"}% dos presentes</div>
                  </div>
                </div>
              </Panel>
              <Panel title="Certificados">
                <div className="font-display text-[34px] font-semibold text-ink tnum">{formatNumber(e.certificatesIssued)}</div>
                <div className="text-[13px] text-ink-3">emitidos de {formatNumber(e.present ?? 0)} presentes</div>
                <Meter className="mt-4" value={e.certificatesIssued} max={e.present ?? 1} tone="gold" />
                <Button className="mt-5" variant="secondary" size="sm" asChild><Link href="/certificados">Ver certificados</Link></Button>
              </Panel>
              <Panel title="Interesses mais citados">
                <BarList items={(evals.data?.interests ?? []).slice(0, 5).map((i) => ({ label: i.label, value: i.value }))} color={SERIES[2]} />
              </Panel>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RegistrantsTable({ data, loading, onOpen }: { data?: Registration[]; loading: boolean; onOpen: (r: Registration) => void }) {
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [payment, setPayment] = React.useState("all")
  const rows = React.useMemo(() => {
    const n = normalize(q)
    return (data ?? []).filter((r) => (!n || normalize(r.participantName).includes(n) || normalize(r.chamberName).includes(n)) && (status === "all" || r.status === status) && (payment === "all" || r.paymentStatus === payment))
  }, [data, q, status, payment])
  const columns = React.useMemo<ColumnDef<Registration>[]>(
    () => [
      { accessorKey: "participantName", header: "Participante", cell: ({ row }) => <div className="flex items-center gap-3"><PersonAvatar name={row.original.participantName} size="sm" /><div><div className="font-semibold text-ink">{row.original.participantName}</div><div className="text-xs text-ink-3">{row.original.role}</div></div></div> },
      { accessorKey: "chamberName", header: "Câmara", cell: ({ getValue }) => <span className="text-ink-2">{String(getValue()).replace("Câmara Municipal de", "Câmara de")}</span> },
      { accessorKey: "createdAt", header: "Inscrição", cell: ({ getValue }) => formatRelativeDay(String(getValue())) },
      { accessorKey: "origin", header: "Origem" },
      { accessorKey: "paymentStatus", header: "Pagamento", cell: ({ getValue }) => <StatusBadge domain="payment" value={String(getValue())} size="sm" /> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="registration" value={String(getValue())} size="sm" /> },
      { accessorKey: "checkedInAt", header: "Presença", cell: ({ getValue }) => (getValue() ? <Badge variant="success" size="sm"><Users />Presente</Badge> : <span className="text-ink-4">—</span>) },
    ],
    [],
  )
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      onRowClick={onOpen}
      enableSelection
      entity={["inscrição", "inscrições"]}
      toolbar={
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar participante ou Câmara…" className="max-w-xs" />
          <FilterSelect label="Status" value={status} onChange={setStatus} allLabel="Todos" options={[{ value: "confirmada", label: "Confirmada" }, { value: "incompleta", label: "Incompleta" }, { value: "cancelada", label: "Cancelada" }]} />
          <FilterSelect label="Pagamento" value={payment} onChange={setPayment} allLabel="Todos" options={[{ value: "confirmado", label: "Confirmado" }, { value: "pendente", label: "Pendente" }, { value: "isento", label: "Isento" }]} />
        </FilterBar>
      }
      bulkActions={(sel, clear) => (
        <button className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-white/85 hover:bg-white/10" onClick={() => { toast.success(`Lembrete enviado para ${sel.length} inscritos`); clear() }}>
          <Send className="size-4" />Enviar lembrete
        </button>
      )}
    />
  )
}
