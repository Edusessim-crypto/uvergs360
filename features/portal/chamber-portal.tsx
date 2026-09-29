"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, CheckCircle2, Circle, House, Landmark, Send, Users, Building2 } from "lucide-react"
import { toast } from "sonner"
import { chamberService, portalService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDateRange, formatRelativeDay } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { LogoMark } from "@/components/brand/logo"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { EventDateBlock } from "@/components/shared/event-card"
import { Meter } from "@/components/shared/meter"
import { StatusBadge } from "@/components/shared/status-badge"
import { Field } from "@/components/shared/field"

const CHAMBER = "cm-4309100"
const NAV = [
  { href: "/portal-camara", label: "Início", icon: House },
  { href: "/portal-camara/vereadores", label: "Vereadores", icon: Users },
  { href: "/portal-camara/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/portal-camara/dados", label: "Dados da Câmara", icon: Building2 },
]

function useChamberHome() {
  return useQuery({ queryKey: qk.chamberHome(CHAMBER), queryFn: () => portalService.getChamberHome(CHAMBER) })
}

export function ChamberPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data } = useChamberHome()
  return (
    <div className="min-h-dvh bg-canvas pb-20 md:pb-10">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark className="size-8" tone="white" />
              <div className="leading-tight"><div className="text-[11px] font-semibold tracking-[0.1em] text-white/50 uppercase">Portal da Câmara</div><div className="font-display text-[15px] font-semibold">{data?.chamber.name ?? "Câmara Municipal"}</div></div>
            </div>
            <span className="hidden text-[12.5px] text-white/60 sm:block">{data?.chamber.adminContact} · {data?.chamber.adminContactRole}</span>
          </div>
          <nav className="-mb-px hidden gap-6 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("border-b-2 pb-3 text-[13.5px] font-medium transition-colors", pathname === n.href ? "border-gold-500 text-white" : "border-transparent text-white/60 hover:text-white")}>{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line-soft bg-white/95 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium", pathname === n.href ? "text-brand-600" : "text-ink-3")}><n.icon className="size-5" />{n.label.split(" ")[0]}</Link>
        ))}
      </nav>
    </div>
  )
}

export function ChamberPortalHome() {
  const { data } = useChamberHome()
  if (!data) return <Skeleton className="h-[480px] rounded-xl" />
  const done = data.pendingItems.filter((p) => p.done).length
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-ink">{data.chamber.name}</h1>
        <p className="text-[14px] text-ink-2">{data.chamber.municipalityName} — RS · Região {data.chamber.regionName}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Vereadores", data.councilors.length], ["Eventos no ano", data.eventsYear], ["Participações", data.participations], ["Cadastros completos", `${data.completeness}%`]].map(([l, v]) => (
          <div key={String(l)} className="card p-5"><div className="text-[12.5px] text-ink-3">{l}</div><div className="kpi-value mt-1 text-[30px]">{v}</div></div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-3 font-display text-[15.5px] font-semibold text-ink">Próximos eventos UVERGS</h2>
          <ul className="space-y-2.5">
            {data.upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-lg border border-line-soft p-3">
                <EventDateBlock date={e.startDate} className="size-12" />
                <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold text-ink">{e.title}</div><div className="text-xs text-ink-3">{e.city} · {formatDateRange(e.startDate, e.endDate)}</div></div>
                <Button size="sm" variant="secondary" onClick={() => toast.success("Inscrição em lote iniciada", { description: `Selecione os vereadores para “${e.title}”.` })}>Inscrever vereadores</Button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="font-display text-[15.5px] font-semibold text-ink">Cadastro da Câmara</h2>
          <p className="text-xs text-ink-3">{done} de {data.pendingItems.length} itens completos</p>
          <Meter className="mt-3" value={done} max={data.pendingItems.length} tone="success" />
          <ul className="mt-4 space-y-2.5">
            {data.pendingItems.map((p) => (
              <li key={p.label} className="flex items-center gap-2.5 text-[13.5px]">{p.done ? <CheckCircle2 className="size-4 text-success-500" /> : <Circle className="size-4 text-ink-4" />}<span className={p.done ? "text-ink-2" : "font-medium text-ink"}>{p.label}</span></li>
            ))}
          </ul>
          <Button asChild className="mt-5 w-full" variant="secondary"><Link href="/portal-camara/dados">Atualizar dados</Link></Button>
        </section>
      </div>
    </div>
  )
}

export function ChamberPortalCouncilors() {
  const { data } = useChamberHome()
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">Vereadores</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.councilors.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 p-4">
            <PersonAvatar name={c.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink">{c.name}</div>
              <div className="text-xs text-ink-3">{c.role}</div>
              <div className="mt-1 text-xs text-ink-2">{c.eventsCount} eventos · {c.lastInteractionAt ? formatRelativeDay(c.lastInteractionAt) : "sem interação"}</div>
            </div>
            <StatusBadge domain="councilor" value={c.status} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChamberPortalEvents() {
  const events = useQuery({ queryKey: qk.chamberEvents(CHAMBER), queryFn: () => chamberService.getEvents(CHAMBER) })
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">Eventos</h1>
      <div className="card divide-y divide-line-soft">
        {events.data?.map(({ event, participants }) => (
          <div key={event.id} className="flex items-center gap-4 px-5 py-3.5">
            <EventDateBlock date={event.startDate} className="size-12" />
            <div className="min-w-0 flex-1"><div className="truncate font-semibold text-ink">{event.title}</div><div className="text-xs text-ink-3">{event.city}</div></div>
            <span className="text-[13px] text-ink-2"><span className="font-semibold text-ink">{participants}</span> da Câmara</span>
            <StatusBadge domain="event" value={event.status} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChamberPortalData() {
  const qc = useQueryClient()
  const { data } = useChamberHome()
  const [form, setForm] = React.useState({ president: "", phone: "", email: "", website: "", address: "", adminContact: "" })
  React.useEffect(() => {
    if (data) setForm({ president: data.chamber.president, phone: data.chamber.phone, email: data.chamber.email, website: data.chamber.website, address: data.chamber.address, adminContact: data.chamber.adminContact })
  }, [data])
  const save = useMutation({
    mutationFn: () => chamberService.update(CHAMBER, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.chamberHome(CHAMBER) }); toast.success("Dados enviados à UVERGS", { description: "A atualização já aparece no painel da UVERGS." }) },
  })
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">Dados da Câmara</h1>
      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-3 rounded-lg bg-canvas px-4 py-3"><Landmark className="size-5 text-brand-600" /><span className="text-[13px] text-ink-2">Mantenha os dados atualizados para receber convites e comunicações da UVERGS.</span></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Presidente"><Input value={form.president} onChange={(e) => setForm({ ...form, president: e.target.value })} /></Field>
          <Field label="Responsável administrativo"><Input value={form.adminContact} onChange={(e) => setForm({ ...form, adminContact: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Site"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
          <Field label="Endereço"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end"><Button onClick={() => save.mutate()} loading={save.isPending}><Send />Enviar atualização</Button></div>
      </div>
    </div>
  )
}
