"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Award, CalendarDays, CheckCircle2, Globe, MapPin, MonitorPlay, Plus, Trash2 } from "lucide-react"
import type { EventFormat, EventInput, EventType } from "@/types"
import { eventService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatCurrency, formatDateRange } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { Field } from "@/components/shared/field"
import { WizardFooter, WizardSteps, type WizardStep } from "@/components/shared/wizard"
import { EventDateBlock } from "@/components/shared/event-card"

const STEPS: WizardStep[] = [
  { id: "info", title: "Informações", description: "Nome, tipo e descrição" },
  { id: "data", title: "Data e local", description: "Quando e onde" },
  { id: "inscricoes", title: "Inscrições", description: "Capacidade e prazos" },
  { id: "valores", title: "Valores", description: "Associados e demais" },
  { id: "programacao", title: "Programação", description: "Agenda do evento" },
  { id: "certificados", title: "Certificados", description: "Carga horária e emissão" },
  { id: "publicacao", title: "Publicação", description: "Revisão e lançamento" },
]

const TYPES: EventType[] = ["Seminário", "Congresso", "Encontro Regional", "Curso", "Webinar", "Fórum", "Capacitação"]

function iso(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

type ProgramRow = { time: string; title: string }

export function EventWizard() {
  const router = useRouter()
  const qc = useQueryClient()
  const [step, setStep] = React.useState(0)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [v, setV] = React.useState<EventInput>({
    title: "",
    type: "Encontro Regional",
    format: "Presencial",
    description: "",
    startDate: iso(40),
    endDate: iso(40),
    city: "",
    venue: "",
    address: "",
    capacity: 150,
    registrationOpen: iso(1),
    registrationClose: iso(38),
    price: 150,
    priceNonMember: 220,
    workload: 8,
    certificate: true,
    publish: "agora",
  })
  const [program, setProgram] = React.useState<ProgramRow[]>([
    { time: "08:30", title: "Credenciamento" },
    { time: "09:00", title: "Abertura oficial" },
    { time: "09:30", title: "Palestra principal" },
  ])
  const set = <K extends keyof EventInput>(k: K, val: EventInput[K]) => setV((p) => ({ ...p, [k]: val }))

  const create = useMutation({
    mutationFn: () => eventService.create(v),
    onSuccess: (ev) => {
      qc.invalidateQueries({ queryKey: qk.events })
      toast.success(v.publish === "rascunho" ? "Rascunho salvo" : "Evento criado com sucesso", { description: v.publish === "agora" ? "Inscrições abertas e landing publicada." : ev.title })
      router.push(`/eventos/${ev.id}`)
    },
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0 && v.title.trim().length < 5) e.title = "Informe o nome do evento (mínimo 5 caracteres)"
    if (step === 1 && v.format !== "Online" && !v.city.trim()) e.city = "Informe a cidade"
    if (step === 1 && v.endDate < v.startDate) e.endDate = "A data final deve ser posterior ao início"
    if (step === 2 && v.capacity < 1) e.capacity = "Capacidade inválida"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate()) return
    if (step === STEPS.length - 1) create.mutate()
    else setStep(step + 1)
  }

  return (
    <div>
      <PageHeader title="Novo evento" description="Configure o evento em 7 etapas. Você pode voltar a qualquer etapa antes de publicar." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit p-3 max-lg:hidden">
          <WizardSteps steps={STEPS} current={step} onStepClick={setStep} orientation="vertical" />
        </aside>
        <WizardSteps steps={STEPS} current={step} onStepClick={setStep} className="lg:hidden" />

        <div className="card flex min-h-[520px] flex-col">
          <div className="border-b border-line-soft px-6 py-5">
            <div className="eyebrow">Etapa {step + 1} de {STEPS.length}</div>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink">{STEPS[step].title}</h2>
            <p className="text-[13px] text-ink-3">{STEPS[step].description}</p>
          </div>

          <div key={step} className="flex-1 animate-fade-up space-y-5 px-6 py-6">
            {step === 0 && (
              <>
                <Field label="Nome do evento" error={errors.title} required>
                  <Input value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Encontro Regional Vale do Taquari" aria-invalid={!!errors.title} autoFocus />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tipo">
                    <Select value={v.type} onValueChange={(x) => set("type", x as EventType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Formato">
                    <div className="grid grid-cols-3 gap-2">
                      {(["Presencial", "Online", "Híbrido"] as EventFormat[]).map((f) => (
                        <button type="button" key={f} onClick={() => set("format", f)} className={cn("h-9 rounded-md border text-[13px] font-medium transition-colors", v.format === f ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-2 hover:bg-canvas")}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <Field label="Descrição" hint="Aparece na landing page do evento.">
                  <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Objetivo, público e principais temas do evento" />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Data de início" required><Input type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
                  <Field label="Data de término" error={errors.endDate}><Input type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} aria-invalid={!!errors.endDate} /></Field>
                </div>
                {v.format !== "Online" ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Cidade" error={errors.city} required><Input value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex.: Lajeado" aria-invalid={!!errors.city} /></Field>
                      <Field label="Local"><Input value={v.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Ex.: Centro de Eventos" /></Field>
                    </div>
                    <Field label="Endereço"><Input value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, bairro" /></Field>
                  </>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg bg-canvas px-4 py-3 text-[13px] text-ink-2"><MonitorPlay className="size-4 text-brand-600" />Evento online — o link de transmissão é enviado na credencial digital.</div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Capacidade" error={errors.capacity}><Input type="number" value={v.capacity} onChange={(e) => set("capacity", Number(e.target.value))} /></Field>
                  <Field label="Abertura das inscrições"><Input type="date" value={v.registrationOpen} onChange={(e) => set("registrationOpen", e.target.value)} /></Field>
                  <Field label="Encerramento"><Input type="date" value={v.registrationClose} onChange={(e) => set("registrationClose", e.target.value)} /></Field>
                </div>
                {[
                  ["Lista de espera automática", "Ao atingir a capacidade, novas inscrições entram na fila", true],
                  ["Aprovação manual", "A equipe valida cada inscrição antes da confirmação", false],
                  ["Inscrição em lote pelas Câmaras", "Permite que a Câmara inscreva vários vereadores", true],
                ].map(([t, d, on]) => (
                  <label key={String(t)} className="flex items-center justify-between gap-4 rounded-lg border border-line-soft px-4 py-3">
                    <span><span className="block text-[13.5px] font-medium text-ink">{t}</span><span className="block text-xs text-ink-3">{d}</span></span>
                    <Switch defaultChecked={Boolean(on)} />
                  </label>
                ))}
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Valor para associados (R$)" hint="Câmaras associadas à UVERGS"><Input type="number" value={v.price} onChange={(e) => set("price", Number(e.target.value))} /></Field>
                  <Field label="Valor para não associados (R$)"><Input type="number" value={v.priceNonMember} onChange={(e) => set("priceNonMember", Number(e.target.value))} /></Field>
                </div>
                <Field label="Formas de pagamento">
                  <div className="flex flex-wrap gap-2">
                    {["PIX", "Boleto", "Nota de empenho", "Cartão de crédito"].map((p, i) => (
                      <span key={p} className={cn("rounded-full border px-3 py-1.5 text-[13px] font-medium", i < 3 ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-3")}>{p}</span>
                    ))}
                  </div>
                </Field>
                <button type="button" onClick={() => { set("price", 0); set("priceNonMember", 0) }} className="text-[13px] font-medium text-brand-600 hover:underline">Tornar evento gratuito</button>
              </>
            )}

            {step === 4 && (
              <div className="space-y-3">
                {program.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Input type="time" value={p.time} onChange={(e) => setProgram(program.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} className="w-28" />
                    <Input value={p.title} onChange={(e) => setProgram(program.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Atividade" />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setProgram(program.filter((_, j) => j !== i))} aria-label="Remover"><Trash2 /></Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={() => setProgram([...program, { time: "14:00", title: "" }])}><Plus />Adicionar atividade</Button>
              </div>
            )}

            {step === 5 && (
              <>
                <label className="flex items-center justify-between gap-4 rounded-lg border border-line-soft px-4 py-3">
                  <span><span className="block text-[13.5px] font-medium text-ink">Emitir certificado automaticamente</span><span className="block text-xs text-ink-3">Enviado aos presentes após o encerramento, com QR de validação</span></span>
                  <Switch checked={v.certificate} onCheckedChange={(c) => set("certificate", c)} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Carga horária (horas)"><Input type="number" value={v.workload} onChange={(e) => set("workload", Number(e.target.value))} /></Field>
                  <Field label="Presença mínima"><Select defaultValue="75"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="75">75% da programação</SelectItem><SelectItem value="100">100% (check-in por dia)</SelectItem></SelectContent></Select></Field>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-gold-50 px-4 py-3.5">
                  <Award className="size-6 text-gold-700" />
                  <div className="text-[13px] text-ink-2">Modelo institucional UVERGS com assinatura da presidência e código de validação.</div>
                </div>
              </>
            )}

            {step === 6 && (
              <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                <div className="rounded-xl border border-line-soft p-5">
                  <div className="flex gap-4">
                    <EventDateBlock date={`${v.startDate}T12:00:00`} tone="brand" />
                    <div>
                      <div className="text-xs text-ink-3">{v.type} · {v.format}</div>
                      <div className="font-display text-lg font-semibold text-ink">{v.title || "Evento sem nome"}</div>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-[13px] text-ink-2">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDateRange(`${v.startDate}T12:00:00`, `${v.endDate}T12:00:00`)}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{v.format === "Online" ? "Online" : v.city || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                    {[["Capacidade", v.capacity], ["Associados", v.price ? formatCurrency(v.price) : "Gratuito"], ["Atividades", program.length], ["Certificado", v.certificate ? `${v.workload}h` : "Não"]].map(([l, x]) => (
                      <div key={String(l)} className="rounded-lg bg-canvas px-3 py-2.5"><dt className="text-[11.5px] text-ink-3">{l}</dt><dd className="font-semibold text-ink">{x}</dd></div>
                    ))}
                  </dl>
                </div>
                <div className="space-y-2">
                  {([
                    ["agora", "Publicar agora", "Abre inscrições e publica a landing page", Globe],
                    ["agendar", "Agendar publicação", "Publica na data de abertura das inscrições", CalendarDays],
                    ["rascunho", "Salvar como rascunho", "Continue editando depois", CheckCircle2],
                  ] as const).map(([val, t, d, Icon]) => (
                    <button type="button" key={val} onClick={() => set("publish", val)} className={cn("flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors", v.publish === val ? "border-brand-500 bg-brand-50" : "border-line hover:bg-canvas")}>
                      <Icon className={cn("mt-0.5 size-4", v.publish === val ? "text-brand-600" : "text-ink-3")} />
                      <span><span className="block text-[13.5px] font-semibold text-ink">{t}</span><span className="block text-xs text-ink-3">{d}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-line-soft px-6 py-4">
            <WizardFooter
              current={step}
              total={STEPS.length}
              onBack={() => setStep(Math.max(0, step - 1))}
              onNext={next}
              finishLabel={v.publish === "agora" ? "Publicar evento" : v.publish === "agendar" ? "Agendar publicação" : "Salvar rascunho"}
              loading={create.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
