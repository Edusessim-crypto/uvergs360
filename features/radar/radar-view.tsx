"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, Lightbulb, Mail, Map as MapIcon, Send, UserPlus } from "lucide-react"
import { toast } from "sonner"
import type { Councilor, RadarSituation } from "@/types"
import { radarService, councilorService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatRelativeDay } from "@/lib/format"
import { cn, normalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { DataTable, BulkAction } from "@/components/shared/data-table"
import { FilterBar, FilterSelect, ClearFilters } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { ExportMenu } from "@/components/shared/export-menu"
import { BarList } from "@/components/charts/chart-kit"

const URGENCY = {
  alta: { label: "Alta", dot: "bg-danger-500", ring: "ring-danger-500/20" },
  media: { label: "Média", dot: "bg-warning-500", ring: "ring-warning-500/20" },
  baixa: { label: "Baixa", dot: "bg-brand-400", ring: "ring-brand-400/20" },
}

const ACTION: Record<RadarSituation, string> = {
  inscricao_abandonada: "Retomar contato",
  sem_interacao: "Reengajar",
  cadastro_incompleto: "Atualizar cadastro",
  portal_nao_ativado: "Reenviar convite",
  nunca_participou: "Convidar",
}

function PriorityBar({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-danger-500" : score >= 55 ? "bg-warning-500" : "bg-brand-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas-2">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-ink tnum">{score}</span>
    </div>
  )
}

export function RadarView() {
  const router = useRouter()
  const params = useSearchParams()
  const [situation, setSituation] = React.useState<string>(params.get("situacao") ?? "all")
  const [region, setRegion] = React.useState("all")
  const [q, setQ] = React.useState("")

  const signals = useQuery({ queryKey: qk.radarSignals, queryFn: () => radarService.getSignals() })
  const opps = useQuery({ queryKey: qk.radarOpportunities, queryFn: () => radarService.getOpportunities() })
  const recs = useQuery({ queryKey: qk.radarRecommendations, queryFn: () => radarService.getRecommendations() })
  const dist = useQuery({ queryKey: qk.radarRegions, queryFn: () => radarService.getRegionDistribution() })

  const rows = React.useMemo(() => {
    const n = normalize(q)
    return (opps.data ?? []).filter(
      (c) =>
        (situation === "all" || c.situation === situation) &&
        (region === "all" || c.regionId === region) &&
        (!n || normalize(c.name).includes(n) || normalize(c.municipalityName).includes(n)),
    )
  }, [opps.data, situation, region, q])

  const columns = React.useMemo<ColumnDef<Councilor>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonAvatar name={row.original.name} size="sm" />
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{row.original.name}</div>
              <div className="truncate text-xs text-ink-3">{row.original.role}</div>
            </div>
          </div>
        ),
      },
      { accessorKey: "chamberName", header: "Câmara", cell: ({ getValue }) => <span className="text-ink-2">{String(getValue()).replace("Câmara Municipal de", "Câmara de")}</span> },
      { accessorKey: "municipalityName", header: "Município" },
      {
        accessorKey: "situation",
        header: "Situação",
        cell: ({ row }) => (
          <div>
            <StatusBadge domain="situation" value={row.original.situation!} size="sm" />
            {row.original.situationDetail && <div className="mt-1 max-w-[220px] truncate text-[11.5px] text-ink-3">{row.original.situationDetail}</div>}
          </div>
        ),
      },
      {
        accessorKey: "lastInteractionAt",
        header: "Última interação",
        cell: ({ getValue }) => <span className="text-ink-2">{getValue() ? formatRelativeDay(String(getValue())) : "Nunca"}</span>,
        sortingFn: (a, b) => (a.original.lastInteractionAt ?? "").localeCompare(b.original.lastInteractionAt ?? ""),
      },
      { accessorKey: "priorityScore", header: "Prioridade", cell: ({ getValue }) => <PriorityBar score={Number(getValue())} /> },
      {
        id: "action",
        header: "Ação recomendada",
        cell: ({ row }) => (
          <Button size="xs" variant="subtle" asChild>
            <Link href={`/vereadores/${row.original.id}`}>
              {ACTION[row.original.situation!]} <ArrowRight />
            </Link>
          </Button>
        ),
      },
    ],
    [],
  )

  const regionOptions = (dist.data ?? []).map((r) => ({ value: r.regionId, label: r.label, hint: String(r.value) }))

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-2"
        eyebrow={
          <>
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-gold-500 opacity-70" />
              <span className="relative size-1.5 rounded-full bg-gold-500" />
            </span>
            <span className="text-[12.5px] font-medium tracking-normal text-ink-3 normal-case">Central de inteligência · análise atualizada há 3 min</span>
          </>
        }
        title="Radar UVERGS"
        description="Identifique oportunidades e ações prioritárias de relacionamento."
        actions={<ExportMenu reportId="radar" label="Exportar lista" />}
      />

      {/* Sinais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {signals.isLoading || !signals.data
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[148px] rounded-xl" />)
          : signals.data.map((s) => {
              const active = situation === s.id
              const u = URGENCY[s.urgency]
              return (
                <button
                  key={s.id}
                  onClick={() => setSituation(active ? "all" : s.id)}
                  className={cn(
                    "card group/sig relative overflow-hidden p-4 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-raised",
                    active ? "border-navy-900 bg-navy-900 text-white" : "hover:border-brand-200",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase", active ? "text-white/60" : "text-ink-3")}>
                      <span className={cn("size-2 rounded-full ring-4", u.dot, u.ring)} /> {u.label}
                    </span>
                    <span className={cn("text-[11.5px] font-semibold tnum", s.weekDelta > 0 ? (active ? "text-[#ff9b9b]" : "text-danger-700") : active ? "text-[#5fe39a]" : "text-success-700")}>
                      {s.weekDelta > 0 ? "+" : ""}
                      {s.weekDelta} sem.
                    </span>
                  </div>
                  <div className={cn("mt-3 font-display text-[34px] leading-none font-semibold tracking-[-0.03em] tnum", active ? "text-white" : "text-ink")}>{s.count}</div>
                  <div className={cn("mt-2 text-[13.5px] font-semibold", active ? "text-white" : "text-ink")}>{s.label}</div>
                  <div className={cn("mt-0.5 text-xs", active ? "text-white/55" : "text-ink-3")}>{s.description}</div>
                </button>
              )
            })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <DataTable
          columns={columns}
          data={rows}
          loading={opps.isLoading}
          getRowId={(r) => r.id}
          onRowClick={(r) => router.push(`/vereadores/${r.id}`)}
          enableSelection
          entity={["oportunidade", "oportunidades"]}
          initialSorting={[{ id: "priorityScore", desc: true }]}
          toolbar={
            <FilterBar>
              <SearchInput value={q} onChange={setQ} placeholder="Buscar nome ou município…" className="max-w-xs" />
              <FilterSelect
                label="Situação"
                value={situation}
                onChange={setSituation}
                options={(signals.data ?? []).map((s) => ({ value: s.id, label: s.label, hint: String(s.count) }))}
                allLabel="Todas"
              />
              <FilterSelect label="Região" value={region} onChange={setRegion} options={regionOptions} allLabel="Todas" />
              <ClearFilters visible={situation !== "all" || region !== "all" || !!q} onClear={() => { setSituation("all"); setRegion("all"); setQ("") }} />
            </FilterBar>
          }
          bulkActions={(sel, clear) => (
            <>
              <BulkAction
                icon={Mail}
                onClick={() => {
                  toast.promise(councilorService.sendMessage(sel.map((s) => s.id), "E-mail", "Contato de relacionamento"), {
                    loading: "Enviando mensagens…",
                    success: `Mensagem enviada para ${sel.length} vereadores`,
                  })
                  clear()
                }}
              >
                Enviar mensagem
              </BulkAction>
              <BulkAction icon={UserPlus} onClick={() => { toast.success(`${sel.length} tarefas criadas para a equipe`); clear() }}>
                Criar tarefas
              </BulkAction>
            </>
          )}
        />

        <div className="space-y-6">
          <Panel title="Recomendações operacionais" description="Onde agir primeiro">
            <ul className="space-y-3">
              {(recs.data ?? []).map((r) => {
                const Icon = r.kind === "mapa" ? MapIcon : r.kind === "campanha" ? Send : Lightbulb
                const cta = r.href ? (
                  <Button size="xs" variant="secondary" asChild>
                    <Link href={r.href}>{r.cta}</Link>
                  </Button>
                ) : (
                  <Button size="xs" variant="secondary" onClick={() => toast.success("Convites enviados", { description: "Os vereadores receberão o convite por WhatsApp e e-mail." })}>
                    {r.cta}
                  </Button>
                )
                return (
                  <li key={r.id} className="rounded-lg border border-line-soft p-3.5">
                    <div className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13.5px] leading-snug font-semibold text-ink">{r.title}</div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{r.description}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="text-[11.5px] font-semibold text-success-700">{r.impact}</span>
                          {cta}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
              {recs.isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </ul>
          </Panel>
          <Panel title="Oportunidades por região" description="Exceto “nunca participou”">
            <BarList
              items={(dist.data ?? []).map((d) => ({ key: d.regionId, label: d.label, value: d.value }))}
              onSelect={(k) => setRegion((cur) => (cur === k ? "all" : k))}
              activeKey={region === "all" ? null : region}
              color="#e39a00"
            />
          </Panel>
        </div>
      </div>
    </div>
  )
}
