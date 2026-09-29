"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Award, CalendarDays, ChevronRight, Download, House, IdCard, MapPin, User } from "lucide-react"
import { toast } from "sonner"
import type { Registration, UvergsEvent } from "@/types"
import { portalService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDateRange, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Logo, LogoMark } from "@/components/brand/logo"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { QrCode } from "@/components/shared/qr-code"
import { EventDateBlock } from "@/components/shared/event-card"
import { Field } from "@/components/shared/field"
import { EmptyState } from "@/components/shared/states"
import { CertificateDialog, downloadCertificate } from "@/features/certificates/certificate-dialog"
import type { Certificate } from "@/types"

const NAV = [
  { href: "/meu-uvergs", label: "Início", icon: House },
  { href: "/meu-uvergs/eventos", label: "Meus eventos", icon: CalendarDays },
  { href: "/meu-uvergs/credenciais", label: "Credenciais", icon: IdCard },
  { href: "/meu-uvergs/certificados", label: "Certificados", icon: Award },
  { href: "/meu-uvergs/perfil", label: "Meu perfil", icon: User },
]

export function usePortal() {
  return useQuery({ queryKey: qk.participantHome, queryFn: () => portalService.getParticipantHome() })
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data } = usePortal()
  return (
    <div className="min-h-dvh bg-canvas pb-24 md:pb-10">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/meu-uvergs" className="flex items-center gap-2.5"><LogoMark className="size-8" tone="white" /><span className="font-display text-[15px] font-bold tracking-[0.03em]">Meu UVERGS</span></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors", pathname === n.href ? "bg-white/10 text-white" : "text-white/65 hover:text-white")}>{n.label}</Link>
            ))}
          </nav>
          {data && <PersonAvatar name={data.councilor.name} size="sm" className="ring-2 ring-white/20" />}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = pathname === n.href
            return (
              <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium", active ? "text-brand-600" : "text-ink-3")}>
                <n.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {n.label.replace("Meus ", "").replace("Meu ", "")}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function Credential({ event, registration, name, chamber }: { event: UvergsEvent; registration: Registration; name: string; chamber: string }) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-line-soft">
      <div className="relative bg-navy-900 px-6 pt-6 pb-10 text-white">
        <div className="absolute inset-0 bg-grid-navy" aria-hidden />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2"><LogoMark className="size-7" tone="white" /><span className="font-display text-[13px] font-bold tracking-[0.06em]">UVERGS</span></div>
          <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-[10.5px] font-bold tracking-[0.08em] text-navy-900 uppercase">Participante</span>
        </div>
        <div className="relative mt-6 text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase">Credencial digital</div>
        <div className="relative mt-1 font-display text-[20px] leading-tight font-semibold">{event.title}</div>
        <div className="relative mt-1 text-[12.5px] text-white/65">{formatDateRange(event.startDate, event.endDate)} · {event.city}</div>
      </div>
      <div className="relative -mt-5 rounded-t-2xl bg-white px-6 pt-6 pb-6 text-center">
        <div className="font-display text-[22px] font-semibold text-ink">{name}</div>
        <div className="text-[13px] text-ink-2">{chamber}</div>
        <div className="mt-5 flex justify-center"><QrCode value={`U360:${registration.code}`} size={170} className="ring-1 ring-line-soft" /></div>
        <div className="mt-3 font-mono text-[15px] font-semibold tracking-[0.12em] text-ink">{registration.code}</div>
        <div className="mt-1 text-xs text-ink-3">Apresente este QR Code no credenciamento</div>
      </div>
      <div className="flex justify-between border-t border-dashed border-line px-6 py-3 text-[11.5px] text-ink-3">
        <span>{event.venue}</span><span>Pagamento {registration.paymentStatus}</span>
      </div>
    </div>
  )
}

export function PortalHome() {
  const { data, isLoading } = usePortal()
  if (isLoading || !data) return <Skeleton className="h-[480px] rounded-xl" />
  const first = data.councilor.name.split(" ")[0]
  const next = data.nextEvent
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[13px] text-ink-3">{data.councilor.chamberName}</div>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Olá, {first}.</h1>
      </div>

      {next && (
        <Link href="/meu-uvergs/credenciais" className="block overflow-hidden rounded-2xl bg-navy-900 text-white shadow-raised">
          <div className="relative p-5">
            <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_100%_0%,rgba(47,107,255,0.35),transparent_60%)]" aria-hidden />
            <div className="relative flex items-start gap-4">
              <EventDateBlock date={next.event.startDate} tone="dark" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold tracking-[0.12em] text-gold-500 uppercase">Próximo evento</div>
                <div className="mt-1 font-display text-[18px] leading-snug font-semibold">{next.event.title}</div>
                <div className="mt-1 flex items-center gap-1 text-[12.5px] text-white/65"><MapPin className="size-3.5" />{next.event.city} · {formatDateRange(next.event.startDate, next.event.endDate)}</div>
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between rounded-xl bg-white/[0.08] px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] font-medium"><IdCard className="size-4 text-gold-500" />Credencial disponível</span>
              <ChevronRight className="size-4 text-white/60" />
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/meu-uvergs/certificados" className="card p-4">
          <Award className="size-5 text-gold-700" />
          <div className="mt-3 font-display text-[24px] font-semibold text-ink">{data.certificates.length}</div>
          <div className="text-[12.5px] text-ink-3">Certificados</div>
        </Link>
        <Link href="/meu-uvergs/eventos" className="card p-4">
          <CalendarDays className="size-5 text-brand-600" />
          <div className="mt-3 font-display text-[24px] font-semibold text-ink">{data.councilor.eventsCount}</div>
          <div className="text-[12.5px] text-ink-3">Eventos no histórico</div>
        </Link>
      </div>

      <section>
        <h2 className="mb-2.5 font-display text-[15px] font-semibold text-ink">Inscrições abertas para você</h2>
        <div className="space-y-2.5">
          {data.suggestedEvents.map((e) => (
            <Link key={e.id} href={`/e/${e.slug}`} className="card flex items-center gap-3 p-3.5">
              <EventDateBlock date={e.startDate} className="size-12" />
              <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold text-ink">{e.title}</div><div className="text-xs text-ink-3">{e.city}</div></div>
              <ChevronRight className="size-4 text-ink-4" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 font-display text-[15px] font-semibold text-ink">Histórico</h2>
        <div className="card divide-y divide-line-soft">
          {data.registrations.slice(0, 4).map(({ event, registration }) => (
            <div key={registration.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0"><div className="truncate text-[13.5px] font-medium text-ink">{event.title}</div><div className="text-xs text-ink-3">{formatDate(event.startDate)}</div></div>
              <span className={cn("shrink-0 text-xs font-semibold", registration.checkedInAt ? "text-success-700" : "text-ink-3")}>{registration.checkedInAt ? "Presente" : event.status === "encerrado" ? "Ausente" : "Inscrito"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function PortalEvents() {
  const { data } = usePortal()
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">Meus eventos</h1>
      {data?.registrations.map(({ event, registration }) => (
        <div key={registration.id} className="card flex items-center gap-4 p-4">
          <EventDateBlock date={event.startDate} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">{event.title}</div>
            <div className="text-xs text-ink-3">{formatDateRange(event.startDate, event.endDate)} · {event.city}</div>
            <div className="mt-1 text-xs font-medium text-ink-2">Código {registration.code}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PortalCredentials() {
  const { data } = usePortal()
  if (!data) return <Skeleton className="mx-auto h-[560px] max-w-sm rounded-2xl" />
  const upcoming = data.registrations.filter(({ event }) => event.status !== "encerrado")
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Credenciais</h1>
      {upcoming.length === 0 ? <div className="card"><EmptyState icon={IdCard} title="Nenhuma credencial ativa" /></div> : upcoming.map(({ event, registration }) => (
        <Credential key={registration.id} event={event} registration={registration} name={data.councilor.name.split(" ").filter((_, i, a) => i === 0 || i === a.length - 1).join(" ")} chamber={data.councilor.chamberName} />
      ))}
    </div>
  )
}

export function PortalCertificates() {
  const { data } = usePortal()
  const [open, setOpen] = React.useState<Certificate | null>(null)
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">Certificados</h1>
      {data?.certificates.map((c) => (
        <div key={c.id} className="card flex items-center gap-4 p-4">
          <span className="flex size-11 items-center justify-center rounded-lg bg-gold-50 text-gold-700"><Award className="size-5" /></span>
          <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(c)}>
            <div className="font-semibold text-ink">{c.eventTitle}</div>
            <div className="text-xs text-ink-3">{c.workload}h · emitido em {formatDate(c.issuedAt)}</div>
          </button>
          <Button size="icon-sm" variant="secondary" onClick={() => downloadCertificate(c)} aria-label="Baixar"><Download /></Button>
        </div>
      ))}
      <CertificateDialog certificate={open} onOpenChange={(v) => !v && setOpen(null)} />
    </div>
  )
}

export function PortalProfile() {
  const qc = useQueryClient()
  const { data } = usePortal()
  const [form, setForm] = React.useState({ email: "", phone: "" })
  React.useEffect(() => { if (data) setForm({ email: data.councilor.email, phone: data.councilor.phone }) }, [data])
  const save = useMutation({ mutationFn: () => portalService.updateProfile(data!.councilor.id, form), onSuccess: () => { qc.invalidateQueries({ queryKey: qk.participantHome }); toast.success("Dados atualizados") } })
  if (!data) return null
  const c = data.councilor
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4"><PersonAvatar name={c.name} size="xl" /><div><h1 className="font-display text-xl font-semibold text-ink">{c.name}</h1><div className="text-[13px] text-ink-3">{c.role} · {c.chamberName}</div></div></div>
      <div className="card space-y-4 p-5">
        <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Telefone / WhatsApp"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Mandato"><Input value={c.mandate} disabled /></Field>
        <Button className="w-full" onClick={() => save.mutate()} loading={save.isPending}>Salvar alterações</Button>
      </div>
      <Logo className="justify-center opacity-60" caption="União dos Vereadores do RS" />
    </div>
  )
}
