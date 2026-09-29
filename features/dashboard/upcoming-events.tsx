"use client"

import Link from "next/link"
import { ArrowRight, MapPin, MonitorPlay } from "lucide-react"
import type { UvergsEvent } from "@/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel } from "@/components/shared/panel"
import { EventDateBlock } from "@/components/shared/event-card"
import { Meter } from "@/components/shared/meter"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDateRange, formatNumber } from "@/lib/format"

export function UpcomingEvents({ events, loading }: { events?: UvergsEvent[]; loading: boolean }) {
  return (
    <Panel
      title="Próximos eventos"
      description="Agenda institucional e ocupação das inscrições"
      flush
      className="h-full"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/eventos">
            Ver agenda <ArrowRight />
          </Link>
        </Button>
      }
    >
      <ul className="divide-y divide-line-soft border-t border-line-soft">
        {loading || !events
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="size-14" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))
          : events.map((ev) => {
              const pct = ev.capacity ? Math.round((ev.registered / ev.capacity) * 100) : 0
              return (
                <li key={ev.id}>
                  <Link href={`/eventos/${ev.id}`} className="group/up grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 px-6 py-4 transition-colors hover:bg-canvas/70 md:grid-cols-[auto_1fr_200px_auto]">
                    <EventDateBlock date={ev.startDate} tone={ev.highlight ? "brand" : "light"} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display text-[15px] font-semibold text-ink group-hover/up:text-brand-700">{ev.title}</span>
                        {ev.status === "em_andamento" && <StatusBadge domain="event" value={ev.status} size="sm" />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-ink-3">
                        <span className="inline-flex items-center gap-1">
                          {ev.format === "Online" ? <MonitorPlay className="size-3.5" /> : <MapPin className="size-3.5" />}
                          {ev.city}
                        </span>
                        <span>{formatDateRange(ev.startDate, ev.endDate)}</span>
                        <span>{ev.type}</span>
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                        <span className="text-ink-2">
                          <span className="font-semibold text-ink tnum">{formatNumber(ev.registered)}</span> / {formatNumber(ev.capacity)} inscritos
                        </span>
                        <span className="font-semibold text-ink tnum">{pct}%</span>
                      </div>
                      <Meter value={ev.registered} max={ev.capacity} size="sm" tone={pct >= 85 ? "gold" : "brand"} />
                    </div>
                    <span className="hidden items-center gap-1 text-[13px] font-semibold text-brand-600 md:inline-flex">
                      Ver evento <ArrowRight className="size-3.5 transition-transform group-hover/up:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              )
            })}
      </ul>
    </Panel>
  )
}
