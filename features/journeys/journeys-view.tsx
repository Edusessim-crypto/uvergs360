"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDown, Flag, GitBranch, Hourglass, Mail, MessageCircle, MessageSquareText, Pause, Play, Plus, UserCheck, Zap } from "lucide-react"
import { toast } from "sonner"
import type { Journey, JourneyNode } from "@/types"
import { journeyService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatNumber, formatRelativeDay } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Panel } from "@/components/shared/panel"
import { ErrorState } from "@/components/shared/states"
import { useBreadcrumbLabel } from "@/components/layout/shell-context"

export function JourneysView() {
  const { data, isLoading } = useQuery({ queryKey: qk.journeys, queryFn: () => journeyService.list() })
  return (
    <div>
      <PageHeader
        title="Jornadas"
        description="Automações de relacionamento que agem sozinhas a partir de gatilhos."
        actions={<Button onClick={() => toast.info("Editor de jornadas", { description: "Comece a partir de um modelo ou duplique uma jornada existente." })}><Plus />Nova jornada</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[220px] rounded-xl" />)}
        {data?.map((j) => (
          <Link key={j.id} href={`/jornadas/${j.id}`} className="card group/j flex flex-col p-5 transition-all hover:-translate-y-px hover:border-brand-200 hover:shadow-raised">
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Zap className="size-5" /></span>
              <StatusBadge domain="journey" value={j.status} size="sm" />
            </div>
            <div className="mt-4 font-display text-[16px] font-semibold text-ink group-hover/j:text-brand-700">{j.name}</div>
            <p className="mt-1 flex-1 text-[13px] leading-relaxed text-ink-2">{j.description}</p>
            <div className="mt-3 text-xs text-ink-3">Gatilho: <span className="font-medium text-ink-2">{j.trigger}</span> · {j.nodes.length} etapas</div>
            <div className="mt-4 grid grid-cols-3 border-t border-line-soft pt-4 text-center">
              <div><div className="font-display text-[17px] font-semibold text-ink tnum">{formatNumber(j.enrolled)}</div><div className="text-[11px] text-ink-3">entradas</div></div>
              <div><div className="font-display text-[17px] font-semibold text-ink tnum">{formatNumber(j.inProgress)}</div><div className="text-[11px] text-ink-3">em curso</div></div>
              <div><div className="font-display text-[17px] font-semibold text-ink tnum">{j.conversionRate}%</div><div className="text-[11px] text-ink-3">{j.conversionLabel}</div></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const NODE_STYLE: Record<JourneyNode["kind"], { icon: typeof Zap; label: string; tone: string; card: string }> = {
  gatilho: { icon: Zap, label: "Gatilho", tone: "bg-navy-900 text-white", card: "border-navy-900/20" },
  espera: { icon: Hourglass, label: "Espera", tone: "bg-canvas-2 text-ink-2", card: "border-dashed border-line" },
  condicao: { icon: GitBranch, label: "Condição", tone: "bg-gold-50 text-gold-700", card: "border-gold-100" },
  acao: { icon: Mail, label: "Ação", tone: "bg-brand-50 text-brand-600", card: "border-brand-100" },
  fim: { icon: Flag, label: "Fim", tone: "bg-success-50 text-success-700", card: "border-line-soft" },
}

function nodeIcon(n: JourneyNode) {
  if (n.kind !== "acao") return NODE_STYLE[n.kind].icon
  if (n.channel === "whatsapp") return MessageCircle
  if (n.channel === "sms") return MessageSquareText
  if (n.channel === "email") return Mail
  return UserCheck
}

export function JourneyDetailView({ id }: { id: string }) {
  const qc = useQueryClient()
  const { data: j, isError } = useQuery({ queryKey: qk.journey(id), queryFn: () => journeyService.getById(id) })
  useBreadcrumbLabel(j?.name)
  const toggle = useMutation({
    mutationFn: (s: "ativa" | "pausada") => journeyService.setStatus(id, s),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: qk.journey(id) })
      qc.invalidateQueries({ queryKey: qk.journeys })
      toast.success(r.status === "ativa" ? "Jornada ativada" : "Jornada pausada")
    },
  })
  if (isError) return <div className="card"><ErrorState title="Jornada não encontrada" /></div>
  if (!j) return <Skeleton className="h-[600px] rounded-xl" />

  return (
    <div>
      <PageHeader
        eyebrow={<StatusBadge domain="journey" value={j.status} size="sm" />}
        title={j.name}
        description={j.description}
        actions={
          j.status === "ativa" ? (
            <Button variant="secondary" onClick={() => toggle.mutate("pausada")} loading={toggle.isPending}><Pause />Pausar jornada</Button>
          ) : (
            <Button onClick={() => toggle.mutate("ativa")} loading={toggle.isPending}><Play />Ativar jornada</Button>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card bg-dots px-4 py-10">
          <div className="mx-auto flex max-w-md flex-col items-center">
            {j.nodes.map((n, i) => {
              const st = NODE_STYLE[n.kind]
              const Icon = nodeIcon(n)
              return (
                <React.Fragment key={n.id}>
                  {i > 0 && (
                    <div className="flex flex-col items-center py-1 text-ink-4">
                      <span className="h-5 w-px bg-line" />
                      <ArrowDown className="size-3.5" />
                    </div>
                  )}
                  <div className={cn("w-full animate-fade-up rounded-xl border bg-white p-4 shadow-card", st.card, n.kind === "espera" && "bg-white/80 py-3")} style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", st.tone)}><Icon className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10.5px] font-semibold tracking-[0.1em] text-ink-3 uppercase">{st.label}</div>
                        <div className="text-[14px] font-semibold text-ink">{n.title}</div>
                        {n.detail && <div className="text-xs text-ink-3">{n.detail}</div>}
                      </div>
                      {n.stats && (
                        <div className="text-right">
                          <div className="font-display text-[15px] font-semibold text-ink tnum">{n.stats.value}</div>
                          <div className="text-[10.5px] text-ink-3">{n.stats.label}</div>
                        </div>
                      )}
                    </div>
                    {n.kind === "condicao" && (
                      <div className="mt-3 flex gap-2 border-t border-line-soft pt-2.5 text-[11.5px]">
                        <span className="rounded-full bg-success-50 px-2 py-0.5 font-semibold text-success-700">Sim → continua</span>
                        <span className="rounded-full bg-canvas-2 px-2 py-0.5 font-semibold text-ink-2">Não → sai da jornada</span>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </section>
        <div className="space-y-6">
          <Panel title="Desempenho">
            <div className="space-y-4">
              {[["Entradas", formatNumber(j.enrolled)], ["Em andamento", formatNumber(j.inProgress)], ["Concluídas", formatNumber(j.completed)], [j.conversionLabel, `${j.conversionRate}%`]].map(([l, v]) => (
                <div key={l} className="flex items-baseline justify-between"><span className="text-[13px] text-ink-2 first-letter:uppercase">{l}</span><span className="font-display text-lg font-semibold text-ink tnum">{v}</span></div>
              ))}
            </div>
          </Panel>
          <Panel title="Configuração">
            <div className="space-y-2 text-[13px] text-ink-2">
              <div>Gatilho: <span className="font-medium text-ink">{j.trigger}</span></div>
              <div>Janela de envio: <span className="font-medium text-ink">08h às 20h</span></div>
              <div>Respeita preferências de contato: <span className="font-medium text-ink">Sim</span></div>
              <div>Última alteração: <span className="font-medium text-ink">{formatRelativeDay(j.updatedAt)}</span></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

export type { Journey }
