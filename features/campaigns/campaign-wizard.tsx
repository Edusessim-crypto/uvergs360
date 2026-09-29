"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarClock, Send, Users } from "lucide-react"
import type { CampaignChannel, CampaignInput } from "@/types"
import { campaignService, eventService, segmentService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDateTime, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { Field } from "@/components/shared/field"
import { WizardFooter, WizardSteps, type WizardStep } from "@/components/shared/wizard"
import { SuccessState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { EmailPreview } from "./email-preview"
import { CHANNEL } from "./campaigns-view"

const STEPS: WizardStep[] = [
  { id: "info", title: "Informações" },
  { id: "publico", title: "Público" },
  { id: "canal", title: "Canal" },
  { id: "conteudo", title: "Conteúdo" },
  { id: "revisao", title: "Revisão" },
  { id: "agendamento", title: "Agendamento" },
]

export function CampaignWizard() {
  const router = useRouter()
  const params = useSearchParams()
  const qc = useQueryClient()
  const segments = useQuery({ queryKey: qk.segments, queryFn: () => segmentService.list() })
  const events = useQuery({ queryKey: qk.events, queryFn: () => eventService.list() })
  const [step, setStep] = React.useState(0)
  const [done, setDone] = React.useState<"agora" | "agendar" | null>(null)
  const [error, setError] = React.useState("")
  const abandoned = params.get("segmento") === "inscricoes-abandonadas"
  const [v, setV] = React.useState<CampaignInput>({
    name: abandoned ? "Retomada — inscrições do Seminário" : "",
    objective: abandoned ? "Recuperar inscrições" : "Convite para evento",
    eventId: abandoned ? "ev-seminario-gestao-publica" : undefined,
    segmentId: "",
    segmentName: abandoned ? "Inscrições abandonadas (Radar)" : "",
    recipients: abandoned ? 23 : 0,
    channel: "email",
    subject: abandoned ? "Falta pouco para concluir sua inscrição" : "",
    preheader: abandoned ? "Sua vaga no Seminário ainda está reservada." : "",
    body: abandoned ? "Olá!\n\nNotamos que você iniciou sua inscrição no Seminário de Gestão Pública e não concluiu. Sua vaga ainda está reservada — leva menos de 2 minutos para finalizar." : "",
    ctaLabel: abandoned ? "Concluir inscrição" : "Quero participar",
    sendMode: "agendar",
    scheduledAt: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString().slice(0, 16) })(),
  })
  const set = <K extends keyof CampaignInput>(k: K, val: CampaignInput[K]) => setV((p) => ({ ...p, [k]: val }))

  const create = useMutation({
    mutationFn: () => campaignService.create({ ...v, scheduledAt: v.scheduledAt ? new Date(v.scheduledAt).toISOString() : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.campaigns })
      setDone(v.sendMode)
      toast.success(v.sendMode === "agora" ? "Campanha enviada com sucesso." : "Campanha agendada com sucesso.")
    },
  })

  const next = () => {
    setError("")
    if (step === 0 && v.name.trim().length < 4) return setError("Dê um nome à campanha")
    if (step === 1 && !v.recipients) return setError("Selecione um público")
    if (step === 3 && (!v.subject.trim() || !v.body.trim())) return setError("Preencha assunto e conteúdo")
    if (step === STEPS.length - 1) create.mutate()
    else setStep(step + 1)
  }

  if (done) {
    return (
      <div className="card">
        <SuccessState
          title={done === "agora" ? "Campanha enviada com sucesso." : "Campanha agendada com sucesso."}
          description={`“${v.name}” ${done === "agora" ? "está sendo enviada" : `será enviada em ${formatDateTime(new Date(v.scheduledAt!))}`} para ${formatNumber(v.recipients)} destinatários via ${CHANNEL[v.channel].label}.`}
          action={<><Button variant="secondary" onClick={() => router.push("/campanhas")}>Ver campanhas</Button><Button onClick={() => { setDone(null); setStep(0) }}>Criar outra</Button></>}
        />
      </div>
    )
  }

  const segOptions = [...(abandoned ? [{ id: "radar", name: "Inscrições abandonadas (Radar)", count: 23, description: "Gerado a partir do Radar UVERGS" }] : []), ...(segments.data ?? [])]

  return (
    <div>
      <PageHeader title="Nova campanha" description="Crie, revise e agende uma comunicação. Nada é enviado até a confirmação final." />
      <div className="card mb-6 px-5 py-4"><WizardSteps steps={STEPS} current={step} onStepClick={setStep} /></div>
      <div className={cn("grid gap-6", step === 3 && "xl:grid-cols-[1fr_1fr]")}>
        <div className="card flex flex-col">
          <div key={step} className="flex-1 animate-fade-up space-y-5 p-6">
            {step === 0 && (
              <>
                <Field label="Nome da campanha" error={error} required><Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Convite Encontro Regional Missões" autoFocus /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Objetivo">
                    <Select value={v.objective} onValueChange={(x) => set("objective", x)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Convite para evento", "Recuperar inscrições", "Comunicado institucional", "Atualização cadastral", "Pesquisa"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Evento relacionado">
                    <Select value={v.eventId ?? "none"} onValueChange={(x) => set("eventId", x === "none" ? undefined : x)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {(events.data ?? []).filter((e) => e.status !== "encerrado").map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </>
            )}
            {step === 1 && (
              <div className="space-y-2">
                {error && <p className="text-[13px] text-danger-700">{error}</p>}
                {segOptions.map((s) => (
                  <button type="button" key={s.id} onClick={() => setV((p) => ({ ...p, segmentId: s.id, segmentName: s.name, recipients: s.count }))} className={cn("flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors", v.segmentName === s.name ? "border-brand-500 bg-brand-50" : "border-line hover:bg-canvas")}>
                    <Users className={cn("size-5", v.segmentName === s.name ? "text-brand-600" : "text-ink-3")} />
                    <span className="flex-1"><span className="block text-[13.5px] font-semibold text-ink">{s.name}</span><span className="block text-xs text-ink-3">{s.description}</span></span>
                    <span className="font-display text-[15px] font-semibold text-ink tnum">{formatNumber(s.count)}</span>
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(CHANNEL) as CampaignChannel[]).map((c) => {
                  const ch = CHANNEL[c]
                  const Icon = ch.icon
                  return (
                    <button type="button" key={c} onClick={() => set("channel", c)} className={cn("rounded-xl border p-5 text-left transition-all", v.channel === c ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/15" : "border-line hover:bg-canvas")}>
                      <span className={cn("flex size-10 items-center justify-center rounded-lg", ch.tone)}><Icon className="size-5" /></span>
                      <div className="mt-3 font-semibold text-ink">{ch.label}</div>
                      <div className="mt-0.5 text-xs text-ink-3">{c === "email" ? "Conteúdo rico e rastreável" : c === "whatsapp" ? "Maior taxa de leitura (81%)" : "Lembretes curtos e urgentes"}</div>
                    </button>
                  )
                })}
              </div>
            )}
            {step === 3 && (
              <>
                {error && <p className="text-[13px] text-danger-700">{error}</p>}
                <Field label={v.channel === "email" ? "Assunto" : "Título interno"} required><Input value={v.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Ex.: Inscrições abertas para o Seminário" /></Field>
                {v.channel === "email" && <Field label="Preheader" hint="Texto exibido após o assunto na caixa de entrada"><Input value={v.preheader} onChange={(e) => set("preheader", e.target.value)} /></Field>}
                <Field label="Conteúdo" required><Textarea value={v.body} onChange={(e) => set("body", e.target.value)} rows={8} /></Field>
                <Field label="Botão (CTA)"><Input value={v.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} /></Field>
              </>
            )}
            {step === 4 && (
              <dl className="divide-y divide-line-soft rounded-lg border border-line-soft">
                {[["Campanha", v.name], ["Objetivo", v.objective], ["Público", `${v.segmentName} · ${formatNumber(v.recipients)} pessoas`], ["Canal", CHANNEL[v.channel].label], ["Assunto", v.subject], ["CTA", v.ctaLabel]].map(([l, x]) => (
                  <div key={l} className="flex justify-between gap-4 px-4 py-3 text-[13.5px]"><dt className="text-ink-3">{l}</dt><dd className="text-right font-medium text-ink">{x}</dd></div>
                ))}
              </dl>
            )}
            {step === 5 && (
              <div className="space-y-4">
                {([["agora", "Enviar agora", "Inicia o envio imediatamente", Send], ["agendar", "Agendar envio", "Escolha data e horário", CalendarClock]] as const).map(([m, t, d, Icon]) => (
                  <button type="button" key={m} onClick={() => set("sendMode", m)} className={cn("flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left", v.sendMode === m ? "border-brand-500 bg-brand-50" : "border-line hover:bg-canvas")}>
                    <Icon className={cn("mt-0.5 size-5", v.sendMode === m ? "text-brand-600" : "text-ink-3")} />
                    <span><span className="block text-[13.5px] font-semibold text-ink">{t}</span><span className="block text-xs text-ink-3">{d}</span></span>
                  </button>
                ))}
                {v.sendMode === "agendar" && <Field label="Data e horário"><Input type="datetime-local" value={v.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} className="max-w-xs" /></Field>}
                <p className="rounded-lg bg-canvas px-4 py-3 text-[12.5px] text-ink-2">Melhor horário sugerido para este público: <span className="font-semibold text-ink">terça ou quarta, 9h–10h</span> (maior taxa de abertura histórica).</p>
              </div>
            )}
          </div>
          <div className="border-t border-line-soft px-6 py-4">
            <WizardFooter current={step} total={STEPS.length} onBack={() => setStep(Math.max(0, step - 1))} onNext={next} finishLabel={v.sendMode === "agora" ? "Enviar campanha" : "Agendar campanha"} loading={create.isPending} />
          </div>
        </div>
        {step === 3 && (
          <div className="card p-6"><EmailPreview channel={v.channel} subject={v.subject} preheader={v.preheader} body={v.body} cta={v.ctaLabel} /></div>
        )}
      </div>
    </div>
  )
}
