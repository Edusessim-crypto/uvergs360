import * as React from "react"
import Link from "next/link"
import {
  Award,
  ClipboardList,
  CreditCard,
  Handshake,
  ListChecks,
  Mail,
  MessageCircle,
  PencilLine,
  ScanLine,
  Smartphone,
  Star,
  type LucideIcon,
} from "lucide-react"
import type { TimelineKind } from "@/types"
import { cn } from "@/lib/utils"
import { daysBetween, formatShortDate, formatTime, formatTimelineStamp } from "@/lib/format"

export const TIMELINE_KIND: Record<TimelineKind, { icon: LucideIcon; tone: string; label: string }> = {
  inscricao: { icon: ClipboardList, tone: "bg-brand-50 text-brand-600 ring-brand-100", label: "Inscrições" },
  checkin: { icon: ScanLine, tone: "bg-success-50 text-success-700 ring-[#cdeedb]", label: "Presença" },
  certificado: { icon: Award, tone: "bg-gold-50 text-gold-700 ring-gold-100", label: "Certificados" },
  email: { icon: Mail, tone: "bg-[#f1ebfb] text-[#6b3fc0] ring-[#e4d8f7]", label: "Comunicações" },
  whatsapp: { icon: MessageCircle, tone: "bg-[#e7f4f1] text-[#0f7a63] ring-[#cfe9e2]", label: "Comunicações" },
  cadastro: { icon: PencilLine, tone: "bg-canvas-2 text-ink-2 ring-line-soft", label: "Cadastro" },
  pagamento: { icon: CreditCard, tone: "bg-success-50 text-success-700 ring-[#cdeedb]", label: "Inscrições" },
  interacao: { icon: Handshake, tone: "bg-brand-50 text-brand-600 ring-brand-100", label: "Interações" },
  tarefa: { icon: ListChecks, tone: "bg-warning-50 text-warning-700 ring-[#f7e3b5]", label: "Interações" },
  avaliacao: { icon: Star, tone: "bg-gold-50 text-gold-700 ring-gold-100", label: "Eventos" },
  portal: { icon: Smartphone, tone: "bg-[#eef1f5] text-navy-800 ring-line-soft", label: "Cadastro" },
}

export interface TimelineEntry {
  id: string
  kind: TimelineKind
  title: string
  at: string
  description?: string
  meta?: string
  subject?: string
  context?: string
  href?: string
}

function groupLabel(iso: string) {
  const d = new Date(iso)
  const diff = daysBetween(d, new Date())
  if (diff === 0) return "Hoje"
  if (diff === 1) return "Ontem"
  if (diff < 7) return "Esta semana"
  const month = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return month.charAt(0).toUpperCase() + month.slice(1)
}

/** Linha do tempo rica (Perfil 360º, Câmara). */
export function ActivityTimeline({ items, grouped = true, className }: { items: TimelineEntry[]; grouped?: boolean; className?: string }) {
  const groups: { label: string; items: TimelineEntry[] }[] = []
  for (const item of items) {
    const label = grouped ? groupLabel(item.at) : ""
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }

  return (
    <div className={cn("relative", className)}>
      {groups.map((g, gi) => (
        <div key={gi} className={cn(gi > 0 && "mt-6")}>
          {grouped && (
            <div className="mb-3 flex items-center gap-3 pl-[104px] max-sm:pl-0">
              <span className="text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{g.label}</span>
              <span className="h-px flex-1 bg-line-soft" />
            </div>
          )}
          <ol className="relative">
            {g.items.map((item, i) => {
              const meta = TIMELINE_KIND[item.kind]
              const Icon = meta.icon
              const isLast = i === g.items.length - 1
              const stamp = formatTimelineStamp(item.at)
              const daysOld = daysBetween(new Date(item.at), new Date())
              return (
                <li key={item.id} className="group/tl relative flex gap-4 pb-5 last:pb-0">
                  <div className="w-[88px] shrink-0 pt-2 text-right max-sm:hidden">
                    <div className="text-[12.5px] font-semibold text-ink tnum">{daysOld <= 1 ? stamp.split(" ")[0] : formatShortDate(item.at)}</div>
                    <div className="text-[11.5px] text-ink-3 tnum">{formatTime(item.at)}</div>
                  </div>
                  <div className="relative flex flex-col items-center">
                    <span className={cn("relative z-10 flex size-9 items-center justify-center rounded-full ring-4 ring-white", meta.tone)}>
                      <Icon className="size-4" />
                    </span>
                    {!isLast && <span className="absolute top-9 bottom-[-4px] w-px bg-line" aria-hidden />}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="rounded-lg border border-transparent px-3 py-1.5 transition-colors duration-150 group-hover/tl:border-line-soft group-hover/tl:bg-canvas/60 -mx-3 -my-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[13.5px] font-semibold text-ink">{item.title}</span>
                        <span className="text-xs text-ink-3 sm:hidden">{stamp}</span>
                      </div>
                      {item.description &&
                        (item.href ? (
                          <Link href={item.href} className="block truncate text-[13.5px] text-brand-600 hover:underline">
                            {item.description}
                          </Link>
                        ) : (
                          <div className="truncate text-[13.5px] text-ink-2">{item.description}</div>
                        ))}
                      {item.meta && <div className="mt-1 text-xs text-ink-3">{item.meta}</div>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}

/** Feed compacto (Dashboard, Câmara, Evento). */
export function ActivityFeed({ items, className, showDate = false }: { items: TimelineEntry[]; className?: string; showDate?: boolean }) {
  return (
    <ol className={cn("relative", className)}>
      {items.map((item, i) => {
        const meta = TIMELINE_KIND[item.kind]
        const Icon = meta.icon
        const isLast = i === items.length - 1
        const today = daysBetween(new Date(item.at), new Date()) === 0
        const time = today && !showDate ? formatTime(item.at) : formatTimelineStamp(item.at).replace(/ \d{2}:\d{2}$/, "")
        const content = (
          <>
            <span className="w-[46px] shrink-0 pt-[7px] text-right text-[12px] font-medium text-ink-3 tnum">{time}</span>
            <span className="relative flex flex-col items-center">
              <span className={cn("relative z-10 flex size-7 items-center justify-center rounded-full ring-[3px] ring-white", meta.tone)}>
                <Icon className="size-3.5" />
              </span>
              {!isLast && <span className="absolute top-7 bottom-0 w-px bg-line-soft" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1 pt-[3px] pb-4">
              <span className="block text-[13px] text-ink-2">{item.title}</span>
              {item.subject && <span className="block truncate text-[13.5px] font-semibold text-ink">{item.subject}</span>}
              {item.context && <span className="block truncate text-[12.5px] text-ink-3">{item.context}</span>}
            </span>
          </>
        )
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="-mx-2 flex gap-3 rounded-md px-2 transition-colors hover:bg-canvas/80">
                {content}
              </Link>
            ) : (
              <div className="flex gap-3">{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
