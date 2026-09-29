"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Award, CalendarDays, Check, ChevronDown, Clock, MapPin, Users } from "lucide-react"
import { eventService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatCurrency, formatDateRange, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Logo } from "@/components/brand/logo"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { EmptyState } from "@/components/shared/states"

const FAQ = [
  ["Quem pode participar?", "Vereadores, assessores e servidores de Câmaras Municipais de todo o Rio Grande do Sul."],
  ["Como faço o pagamento?", "Por PIX (confirmação imediata), boleto ou nota de empenho emitida pela Câmara."],
  ["Receberei certificado?", "Sim. O certificado digital com código de validação é enviado a todos os participantes presentes."],
  ["Posso cancelar minha inscrição?", "Sim, até 7 dias antes do evento, com reembolso integral."],
]

export function EventLanding({ slug }: { slug: string }) {
  const { data: e, isLoading, isError } = useQuery({ queryKey: qk.eventBySlug(slug), queryFn: () => eventService.getBySlug(slug) })
  const [faq, setFaq] = React.useState<number | null>(0)

  if (isError) return <div className="flex min-h-dvh items-center justify-center"><EmptyState title="Evento não encontrado" action={<Button asChild><Link href="/">Voltar</Link></Button>} /></div>
  if (isLoading || !e) return <Skeleton className="h-dvh w-full rounded-none" />

  const closed = e.status === "encerrado"
  const cta = closed ? null : (
    <Button variant="accent" size="xl" asChild><Link href={`/e/${e.slug}/inscricao`}>Inscreva-se <ArrowRight /></Link></Button>
  )
  const days = [...new Set(e.program.map((p) => p.day))]

  return (
    <div className="min-h-dvh bg-white">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo variant="light" />
          {!closed && <Button variant="dark" size="sm" asChild className="hidden sm:inline-flex"><Link href={`/e/${e.slug}/inscricao`}>Inscrever-se</Link></Button>}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 bg-grid-navy" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(60%_90%_at_85%_10%,rgba(47,107,255,0.45),transparent_60%)]" aria-hidden />
        <svg className="absolute -right-40 -bottom-40 size-[560px] text-white/[0.05]" viewBox="0 0 200 200" aria-hidden>
          {[96, 76, 56, 36].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="1" />)}
        </svg>
        <div className="relative mx-auto max-w-6xl px-5 pt-32 pb-20 sm:pt-40 sm:pb-28">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-medium text-white/85 ring-1 ring-white/15">
            <span className="size-1.5 rounded-full bg-gold-500" />{e.type} · {closed ? "Edição encerrada" : "Inscrições abertas"}
          </div>
          <h1 className="mt-5 max-w-3xl text-white font-display text-[40px] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[60px]">{e.title}</h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">{e.description}</p>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-[14.5px] text-white/85">
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-5 text-gold-500" />{formatDateRange(e.startDate, e.endDate)}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-5 text-gold-500" />{e.city === "Online" ? "Online, ao vivo" : `${e.venue}, ${e.city}`}</span>
            <span className="inline-flex items-center gap-2"><Award className="size-5 text-gold-500" />{e.workload}h certificadas</span>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            {cta}
            {!closed && <span className="text-[13.5px] text-white/60">{formatNumber(Math.max(0, e.capacity - e.registered))} vagas restantes</span>}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="eyebrow text-brand-600">Sobre o evento</div>
          <h2 className="mt-2 font-display text-[30px] leading-tight font-semibold tracking-[-0.02em] text-ink">Conhecimento aplicado ao mandato e à gestão das Câmaras</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">{e.description} Público: {e.audience.toLowerCase()}.</p>
          <ul className="mt-6 space-y-3">
            {["Conteúdo prático com especialistas", "Troca de experiências entre Câmaras de todo o Estado", "Certificado digital com validação pública", "Credencial digital com QR Code"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[15px] text-ink"><span className="flex size-6 items-center justify-center rounded-full bg-success-50 text-success-700"><Check className="size-3.5" strokeWidth={3} /></span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3 self-start">
          {[[formatNumber(e.capacity), "vagas"], [`${e.workload}h`, "de conteúdo"], [String(e.speakers.length), "palestrantes"], ["497", "municípios convidados"]].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-line-soft bg-canvas p-5"><div className="font-display text-[32px] font-semibold text-navy-900">{v}</div><div className="text-[13px] text-ink-3">{l}</div></div>
          ))}
        </div>
      </section>

      {/* Programação */}
      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="eyebrow text-brand-600">Programação</div>
          <h2 className="mt-2 font-display text-[30px] font-semibold tracking-[-0.02em] text-ink">Agenda completa</h2>
          <div className={cn("mt-8 grid gap-6", days.length > 1 && "lg:grid-cols-2")}>
            {days.map((d) => (
              <div key={d} className="card overflow-hidden">
                <div className="border-b border-line-soft bg-white px-5 py-3 font-display text-[15px] font-semibold text-ink">Dia {d}</div>
                <ol className="divide-y divide-line-soft">
                  {e.program.filter((p) => p.day === d).map((p) => (
                    <li key={p.time + p.title} className="flex gap-4 px-5 py-3.5">
                      <span className="flex w-14 shrink-0 items-center gap-1 font-display text-[14px] font-semibold text-brand-600 tnum"><Clock className="size-3.5" />{p.time}</span>
                      <div><div className="text-[14.5px] font-medium text-ink">{p.title}</div>{p.speaker && <div className="text-[13px] text-ink-3">{p.speaker}</div>}</div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Palestrantes */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="eyebrow text-brand-600">Palestrantes</div>
        <h2 className="mt-2 font-display text-[30px] font-semibold tracking-[-0.02em] text-ink">Quem conduz os conteúdos</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {e.speakers.map((s) => (
            <div key={s.name} className="card p-5 text-center">
              <PersonAvatar name={s.name} size="xl" className="mx-auto" />
              <div className="mt-4 font-display text-[16px] font-semibold text-ink">{s.name}</div>
              <div className="text-[13px] text-ink-3">{s.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Local e valores */}
      <section className="bg-canvas py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-2">
          <div className="card p-7">
            <div className="eyebrow text-brand-600">Local</div>
            <div className="mt-2 font-display text-[22px] font-semibold text-ink">{e.venue}</div>
            <div className="mt-1 text-[14.5px] text-ink-2">{e.address}</div>
            <div className="mt-5 h-44 rounded-lg bg-[linear-gradient(135deg,#e8eefc,#f5f7fb)] bg-dots ring-1 ring-line-soft">
              <div className="flex h-full items-center justify-center"><span className="flex size-12 items-center justify-center rounded-full bg-navy-900 text-white shadow-pop"><MapPin className="size-6" /></span></div>
            </div>
          </div>
          <div className="card p-7">
            <div className="eyebrow text-brand-600">Valores</div>
            <div className="mt-4 space-y-3">
              {[["Câmaras associadas", e.price], ["Não associadas", e.priceNonMember]].map(([l, v]) => (
                <div key={String(l)} className="flex items-baseline justify-between rounded-lg border border-line-soft px-5 py-4">
                  <span className="text-[14.5px] text-ink-2">{l}</span>
                  <span className="font-display text-[26px] font-semibold text-ink">{Number(v) ? formatCurrency(Number(v)) : "Gratuito"}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-ink-3">Pagamento por PIX, boleto ou nota de empenho. Inclui material, coffee breaks e certificado.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-center font-display text-[30px] font-semibold tracking-[-0.02em] text-ink">Perguntas frequentes</h2>
        <div className="mt-8 divide-y divide-line-soft rounded-xl border border-line-soft">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-ink">
                {q}<ChevronDown className={cn("size-4 shrink-0 text-ink-3 transition-transform", faq === i && "rotate-180")} />
              </button>
              {faq === i && <p className="animate-fade-up px-5 pb-5 text-[14.5px] leading-relaxed text-ink-2">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-navy-900 px-5 py-20 text-center text-white">
        <Users className="mx-auto size-8 text-gold-500" />
        <h2 className="mx-auto mt-4 max-w-2xl text-white font-display text-[32px] leading-tight font-semibold tracking-[-0.02em]">{closed ? "Obrigado a todos que participaram." : "Garanta sua vaga e represente sua Câmara."}</h2>
        <div className="mt-8 flex justify-center">{cta}</div>
      </section>
      <footer className="border-t border-line-soft px-5 py-8 text-center text-[12.5px] text-ink-3">© UVERGS — União dos Vereadores do Rio Grande do Sul</footer>
    </div>
  )
}
