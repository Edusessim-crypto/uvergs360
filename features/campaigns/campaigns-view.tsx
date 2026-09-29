"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, Mail, MessageCircle, MessageSquareText, MoreHorizontal, Pause, Play, Plus, Send } from "lucide-react"
import { toast } from "sonner"
import type { Campaign } from "@/types"
import { campaignService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDate, formatDateTime, formatNumber } from "@/lib/format"
import { cn, normalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PageHeader } from "@/components/shared/page-header"
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Meter } from "@/components/shared/meter"
import { MetricCard } from "@/components/shared/metric-card"
import { EmailPreview } from "./email-preview"

export const CHANNEL = {
  email: { label: "E-mail", icon: Mail, tone: "bg-[#f1ebfb] text-[#6b3fc0]" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, tone: "bg-[#e7f4f1] text-[#0f7a63]" },
  sms: { label: "SMS", icon: MessageSquareText, tone: "bg-canvas-2 text-ink-2" },
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] text-ink-3">{label}</div>
      <div className="font-display text-[17px] font-semibold text-ink tnum">{value}</div>
    </div>
  )
}

export function CampaignsView() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: qk.campaigns, queryFn: () => campaignService.list() })
  const [q, setQ] = React.useState("")
  const [channel, setChannel] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [sending, setSending] = React.useState<Campaign | null>(null)
  const [detail, setDetail] = React.useState<Campaign | null>(null)

  const rows = (data ?? []).filter((c) => (!q || normalize(c.name).includes(normalize(q))) && (channel === "all" || c.channel === channel) && (status === "all" || c.status === status))
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.campaigns })
  const pause = useMutation({ mutationFn: (c: Campaign) => campaignService.setPaused(c.id, c.status !== "pausada"), onSuccess: (c) => { invalidate(); toast.success(c.status === "pausada" ? "Campanha pausada" : "Campanha retomada") } })
  const dup = useMutation({ mutationFn: (c: Campaign) => campaignService.duplicate(c.id), onSuccess: () => { invalidate(); toast.success("Campanha duplicada como rascunho") } })

  const sent = (data ?? []).filter((c) => c.openRate !== null)
  const avgOpen = sent.length ? Math.round(sent.reduce((a, c) => a + (c.openRate ?? 0), 0) / sent.length) : 0

  return (
    <div className="space-y-6">
      <PageHeader className="mb-0" title="Campanhas" description="Comunicação em massa por e-mail, WhatsApp e SMS com métricas de resultado." actions={<Button asChild><Link href="/campanhas/nova"><Plus />Nova campanha</Link></Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Campanhas enviadas" value={isLoading ? null : sent.length} loading={isLoading} />
        <MetricCard label="Mensagens entregues" value={isLoading ? null : (data ?? []).reduce((a, c) => a + c.delivered, 0)} loading={isLoading} />
        <MetricCard label="Abertura média" value={isLoading ? null : avgOpen} suffix="%" loading={isLoading} delta={4.2} deltaLabel="vs. trimestre anterior" />
        <MetricCard label="Inscrições geradas" value={isLoading ? null : (data ?? []).filter((c) => c.conversionLabel === "inscrições").reduce((a, c) => a + (c.conversions ?? 0), 0)} loading={isLoading} />
      </div>

      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar campanha…" className="max-w-xs" />
        <FilterSelect label="Canal" value={channel} onChange={setChannel} options={[{ value: "email", label: "E-mail" }, { value: "whatsapp", label: "WhatsApp" }, { value: "sms", label: "SMS" }]} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: "enviada", label: "Enviada" }, { value: "agendada", label: "Agendada" }, { value: "enviando", label: "Enviando" }, { value: "pausada", label: "Pausada" }, { value: "rascunho", label: "Rascunho" }]} />
      </FilterBar>

      <div className="space-y-3">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[92px] w-full rounded-xl" />)}
        {rows.map((c) => {
          const ch = CHANNEL[c.channel]
          const Icon = ch.icon
          return (
            <div key={c.id} className="card group/cp grid cursor-pointer items-center gap-5 p-5 transition-all hover:border-brand-200 hover:shadow-raised md:grid-cols-[1fr_auto]" onClick={() => setDetail(c)}>
              <div className="flex min-w-0 items-center gap-4">
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", ch.tone)}><Icon className="size-5" /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-display text-[15.5px] font-semibold text-ink group-hover/cp:text-brand-700">{c.name}</span>
                    <StatusBadge domain="campaign" value={c.status} size="sm" />
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink-3">
                    {ch.label} · {formatNumber(c.recipients)} destinatários · {c.segmentName}
                    {c.sentAt && ` · enviada ${formatDate(c.sentAt)}`}
                    {c.scheduledAt && ` · agendada para ${formatDateTime(c.scheduledAt)}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {c.openRate !== null ? (
                  <>
                    <Stat label={c.channel === "whatsapp" ? "Leitura" : "Abertura"} value={`${c.openRate}%`} />
                    <Stat label="Cliques" value={`${c.clickRate}%`} />
                    <Stat label={c.conversionLabel.charAt(0).toUpperCase() + c.conversionLabel.slice(1)} value={formatNumber(c.conversions ?? 0)} />
                  </>
                ) : (
                  <span className="text-[12.5px] text-ink-3">{c.status === "rascunho" ? "Aguardando envio" : "Métricas após o envio"}</span>
                )}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {(c.status === "rascunho" || c.status === "agendada") && <Button size="sm" onClick={() => setSending(c)}><Send />Enviar</Button>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label="Ações"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {c.status !== "rascunho" && <DropdownMenuItem onSelect={() => pause.mutate(c)}>{c.status === "pausada" ? <Play /> : <Pause />}{c.status === "pausada" ? "Retomar" : "Pausar"}</DropdownMenuItem>}
                      <DropdownMenuItem onSelect={() => dup.mutate(c)}><Copy />Duplicar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!sending}
        onOpenChange={(v) => !v && setSending(null)}
        title="Enviar campanha agora?"
        description={sending ? `“${sending.name}” será enviada para ${formatNumber(sending.recipients)} destinatários via ${CHANNEL[sending.channel].label}.` : ""}
        confirmLabel="Enviar agora"
        onConfirm={async () => {
          await campaignService.send(sending!.id)
          invalidate()
          toast.success("Campanha enviada com sucesso.", { description: "Acompanhe entregas e aberturas em tempo real." })
        }}
      />

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent size="xl">
          {detail && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2"><StatusBadge domain="campaign" value={detail.status} size="sm" /><span className="text-xs text-ink-3">{CHANNEL[detail.channel].label} · por {detail.owner}</span></div>
                <SheetTitle className="text-xl">{detail.name}</SheetTitle>
                <SheetDescription>{detail.segmentName} · {formatNumber(detail.recipients)} destinatários</SheetDescription>
              </SheetHeader>
              <SheetBody className="space-y-6">
                {detail.openRate !== null && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[["Entregues", formatNumber(detail.delivered)], ["Abertura", `${detail.openRate}%`], ["Cliques", `${detail.clickRate}%`], [detail.conversionLabel, formatNumber(detail.conversions ?? 0)]].map(([l, v]) => (
                      <div key={l} className="rounded-lg bg-canvas px-4 py-3"><div className="text-[11.5px] text-ink-3 first-letter:uppercase">{l}</div><div className="font-display text-xl font-semibold text-ink tnum">{v}</div></div>
                    ))}
                  </div>
                )}
                {detail.openRate !== null && (
                  <div className="space-y-3">
                    {[["Entregues", detail.delivered / detail.recipients], ["Abertos", (detail.openRate ?? 0) / 100], ["Clicaram", (detail.clickRate ?? 0) / 100]].map(([l, v]) => (
                      <div key={String(l)}><div className="mb-1 flex justify-between text-xs"><span className="text-ink-2">{l}</span><span className="font-semibold text-ink">{Math.round(Number(v) * 100)}%</span></div><Meter value={Number(v) * 100} /></div>
                    ))}
                  </div>
                )}
                <EmailPreview channel={detail.channel} subject={detail.subject} preheader={detail.preheader} body={detail.body} cta={detail.ctaLabel} />
              </SheetBody>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
