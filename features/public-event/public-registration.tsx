"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Barcode, FileText, QrCode as QrIcon } from "lucide-react"
import type { Registration } from "@/types"
import { eventService, registrationService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatCurrency, formatDateRange } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/brand/logo"
import { Field } from "@/components/shared/field"
import { WizardFooter, WizardSteps } from "@/components/shared/wizard"
import { SuccessState } from "@/components/shared/states"
import { Credential } from "@/features/portal/participant-portal"

const STEPS = [
  { id: "id", title: "Identificação" },
  { id: "inst", title: "Dados institucionais" },
  { id: "rev", title: "Revisão" },
  { id: "conf", title: "Confirmação" },
]

export function PublicRegistration({ slug }: { slug: string }) {
  const qc = useQueryClient()
  const { data: e } = useQuery({ queryKey: qk.eventBySlug(slug), queryFn: () => eventService.getBySlug(slug) })
  const [step, setStep] = React.useState(0)
  const [err, setErr] = React.useState<Record<string, string>>({})
  const [done, setDone] = React.useState<Registration | null>(null)
  const [v, setV] = React.useState({ name: "", cpf: "", email: "", phone: "", municipalityName: "", chamberName: "", role: "Vereador(a)", paymentMethod: "pix" as "pix" | "boleto" | "empenho" })
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }))

  const submit = useMutation({
    mutationFn: () => registrationService.createPublic({ ...v, eventId: e!.id, chamberName: v.chamberName || `Câmara Municipal de ${v.municipalityName}` }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: qk.registrations })
      qc.invalidateQueries({ queryKey: qk.events })
      setDone(r)
    },
  })

  const next = () => {
    const x: Record<string, string> = {}
    if (step === 0) {
      if (v.name.trim().split(" ").length < 2) x.name = "Informe nome e sobrenome"
      if (v.cpf.replace(/\D/g, "").length !== 11) x.cpf = "CPF deve ter 11 dígitos"
      if (!/^\S+@\S+\.\S+$/.test(v.email)) x.email = "E-mail inválido"
      if (v.phone.replace(/\D/g, "").length < 10) x.phone = "Telefone incompleto"
    }
    if (step === 1 && !v.municipalityName.trim()) x.municipalityName = "Informe o município"
    setErr(x)
    if (Object.keys(x).length) return
    if (step === 2) submit.mutate()
    else setStep(step + 1)
  }

  if (!e) return <Skeleton className="h-dvh w-full rounded-none" />

  if (done) {
    return (
      <div className="min-h-dvh bg-canvas">
        <header className="bg-navy-900"><div className="mx-auto flex h-16 max-w-xl items-center px-5"><Logo variant="light" /></div></header>
        <main className="mx-auto max-w-xl px-5 py-8">
          <WizardSteps steps={STEPS} current={3} className="mb-4 justify-center" />
          <SuccessState title="Inscrição confirmada!" description={`Enviamos a confirmação para ${v.email}. Apresente a credencial abaixo no credenciamento.`} className="py-6" />
          <Credential event={e} registration={done} name={v.name} chamber={done.chamberName} />
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" asChild><Link href={`/e/${e.slug}`}>Voltar ao evento</Link></Button>
            <Button asChild><Link href="/meu-uvergs">Acessar Meu UVERGS</Link></Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto max-w-xl px-5 py-5">
          <Link href={`/e/${e.slug}`} className="inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white"><ArrowLeft className="size-4" />{e.title}</Link>
          <div className="mt-2 font-display text-[22px] font-semibold">Inscrição</div>
          <div className="text-[13px] text-white/60">{formatDateRange(e.startDate, e.endDate)} · {e.city}</div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-6">
        <WizardSteps steps={STEPS} current={step} onStepClick={setStep} className="mb-5" />
        <div className="card">
          <div key={step} className="animate-fade-up space-y-4 p-5 sm:p-6">
            {step === 0 && (
              <>
                <Field label="Nome completo" error={err.name} required><Input value={v.name} onChange={(x) => set("name", x.target.value)} autoComplete="name" /></Field>
                <Field label="CPF" error={err.cpf} required><Input value={v.cpf} onChange={(x) => set("cpf", x.target.value)} inputMode="numeric" placeholder="000.000.000-00" /></Field>
                <Field label="E-mail" error={err.email} required><Input type="email" value={v.email} onChange={(x) => set("email", x.target.value)} autoComplete="email" /></Field>
                <Field label="Celular (WhatsApp)" error={err.phone} required><Input value={v.phone} onChange={(x) => set("phone", x.target.value)} inputMode="tel" placeholder="(51) 99999-0000" /></Field>
              </>
            )}
            {step === 1 && (
              <>
                <Field label="Município" error={err.municipalityName} required><Input value={v.municipalityName} onChange={(x) => set("municipalityName", x.target.value)} placeholder="Ex.: Gramado" /></Field>
                <Field label="Câmara Municipal" hint="Preenchido automaticamente pelo município"><Input value={v.chamberName || (v.municipalityName ? `Câmara Municipal de ${v.municipalityName}` : "")} onChange={(x) => set("chamberName", x.target.value)} /></Field>
                <Field label="Cargo">
                  <Select value={v.role} onValueChange={(x) => set("role", x)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Vereador(a)", "Presidente de Câmara", "Assessor(a) parlamentar", "Servidor(a) da Câmara"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </>
            )}
            {step === 2 && (
              <>
                <dl className="divide-y divide-line-soft rounded-lg border border-line-soft text-[13.5px]">
                  {[["Participante", v.name], ["E-mail", v.email], ["Câmara", v.chamberName || `Câmara Municipal de ${v.municipalityName}`], ["Cargo", v.role], ["Valor", e.price ? formatCurrency(e.price) : "Gratuito"]].map(([l, x]) => (
                    <div key={l} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-ink-3">{l}</dt><dd className="text-right font-medium text-ink">{x}</dd></div>
                  ))}
                </dl>
                {e.price > 0 && (
                  <div>
                    <div className="mb-2 text-[13px] font-medium text-ink">Forma de pagamento</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([["pix", "PIX", QrIcon], ["boleto", "Boleto", Barcode], ["empenho", "Empenho", FileText]] as const).map(([k, l, Icon]) => (
                        <button key={k} type="button" onClick={() => set("paymentMethod", k)} className={cn("flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-[13px] font-medium", v.paymentMethod === k ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-2")}>
                          <Icon className="size-5" />{l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="border-t border-line-soft px-5 py-4 sm:px-6">
            <WizardFooter current={step} total={3} onBack={() => setStep(Math.max(0, step - 1))} onNext={next} finishLabel={e.price ? "Confirmar e pagar" : "Confirmar inscrição"} loading={submit.isPending} />
          </div>
        </div>
      </main>
    </div>
  )
}
