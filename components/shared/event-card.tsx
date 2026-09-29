import Link from "next/link"
import { ArrowUpRight, MapPin, MonitorPlay, Users } from "lucide-react"
import type { UvergsEvent } from "@/types"
import { formatDateRange, formatDayMonth, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Meter } from "./meter"
import { StatusBadge } from "./status-badge"

export function EventDateBlock({ date, className, tone = "light" }: { date: string; className?: string; tone?: "light" | "dark" | "brand" }) {
  const { day, month } = formatDayMonth(date)
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 flex-col items-center justify-center rounded-lg leading-none",
        tone === "light" && "border border-line-soft bg-white shadow-card",
        tone === "dark" && "bg-white/10 text-white ring-1 ring-white/10",
        tone === "brand" && "bg-brand-50",
        className,
      )}
    >
      <span className={cn("font-display text-[21px] font-semibold tracking-[-0.02em]", tone === "dark" ? "text-white" : "text-ink")}>{day}</span>
      <span className={cn("mt-1 text-[10.5px] font-semibold tracking-[0.08em]", tone === "dark" ? "text-gold-500" : "text-brand-600")}>{month}</span>
    </div>
  )
}

export function EventCard({ event, className }: { event: UvergsEvent; className?: string }) {
  const pct = event.capacity ? Math.round((event.registered / event.capacity) * 100) : 0
  const closed = event.status === "encerrado"
  return (
    <Link
      href={`/eventos/${event.id}`}
      className={cn(
        "group/event card flex flex-col p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-brand-200 hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <EventDateBlock date={event.startDate} />
        <StatusBadge domain="event" value={event.status} size="sm" />
      </div>
      <div className="mt-4 min-w-0 flex-1">
        <div className="text-xs font-medium text-ink-3">{event.type}</div>
        <h3 className="mt-0.5 line-clamp-2 font-display text-[16px] leading-snug font-semibold tracking-[-0.01em] text-ink group-hover/event:text-brand-700">{event.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
          <span className="inline-flex items-center gap-1">
            {event.format === "Online" ? <MonitorPlay className="size-3.5" /> : <MapPin className="size-3.5" />}
            {event.city}
          </span>
        </div>
      </div>
      <div className="mt-5 border-t border-line-soft pt-4">
        <div className="mb-2 flex items-baseline justify-between text-[12.5px]">
          <span className="inline-flex items-center gap-1.5 text-ink-2">
            <Users className="size-3.5 text-ink-3" />
            {closed ? (
              <>
                <span className="font-semibold text-ink tnum">{formatNumber(event.present ?? 0)}</span> participantes
              </>
            ) : (
              <>
                <span className="font-semibold text-ink tnum">{formatNumber(event.registered)}</span> / {formatNumber(event.capacity)} inscritos
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-ink tnum">
            {closed ? (event.nps ? `NPS ${event.nps}` : "") : `${pct}%`}
            <ArrowUpRight className="size-3.5 text-ink-4 transition-colors group-hover/event:text-brand-600" />
          </span>
        </div>
        <Meter value={closed ? (event.present ?? 0) : event.registered} max={closed ? event.registered : event.capacity} tone={closed ? "success" : pct >= 90 ? "gold" : "brand"} size="sm" />
      </div>
    </Link>
  )
}
