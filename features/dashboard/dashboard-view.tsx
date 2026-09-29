"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import type { Period } from "@/types"
import { dashboardService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatWeekdayLong } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { ExportMenu } from "@/components/shared/export-menu"
import { ActivityFeed } from "@/components/shared/activity-timeline"
import { CommandStrip } from "./command-strip"
import { ParticipationChart } from "./participation-chart"
import { PrioritiesPanel } from "./priorities-panel"
import { UpcomingEvents } from "./upcoming-events"
import { TerritorySnapshot } from "./territory-snapshot"
import { BaseHealth } from "./base-health"

export function DashboardView() {
  const [period, setPeriod] = React.useState<Period>("ano")
  const [today, setToday] = React.useState<string>("")
  React.useEffect(() => setToday(formatWeekdayLong(new Date())), [])

  const overview = useQuery({ queryKey: qk.dashboard(period), queryFn: () => dashboardService.getOverview(period), placeholderData: (p) => p })
  const priorities = useQuery({ queryKey: qk.priorities, queryFn: () => dashboardService.getPriorities() })
  const monthly = useQuery({ queryKey: qk.monthly, queryFn: () => dashboardService.getMonthly() })
  const upcoming = useQuery({ queryKey: qk.upcoming, queryFn: () => dashboardService.getUpcomingEvents(4) })
  const activity = useQuery({ queryKey: qk.recentActivity(7), queryFn: () => dashboardService.getRecentActivity(7) })
  const health = useQuery({ queryKey: qk.health, queryFn: () => dashboardService.getHealth() })

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-2"
        eyebrow={
          <>
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-success-500 opacity-60" />
              <span className="relative size-1.5 rounded-full bg-success-500" />
            </span>
            <span className="normal-case tracking-normal text-[12.5px] font-medium text-ink-3">{today || " "} · dados atualizados agora</span>
          </>
        }
        title="Visão Geral"
        description="Acompanhe o relacionamento institucional da UVERGS em todo o Rio Grande do Sul."
        actions={
          <>
            <SegmentedControl
              value={period}
              onChange={setPeriod}
              options={[
                { value: "30d", label: "Últimos 30 dias" },
                { value: "90d", label: "Últimos 90 dias" },
                { value: "ano", label: "Este ano" },
              ]}
            />
            <ExportMenu reportId="executivo" />
          </>
        }
      />

      <CommandStrip data={overview.data} loading={overview.isLoading} />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ParticipationChart data={monthly.data} loading={monthly.isLoading} />
        </div>
        <div className="xl:col-span-4">
          <PrioritiesPanel items={priorities.data} loading={priorities.isLoading} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <UpcomingEvents events={upcoming.data} loading={upcoming.isLoading} />
        </div>
        <div className="xl:col-span-5">
          <Panel
            title="Atividade recente"
            description="Movimentações em tempo real na plataforma"
            className="h-full"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/atividades">
                  Ver todas <ArrowRight />
                </Link>
              </Button>
            }
          >
            {activity.isLoading || !activity.data ? (
              <div className="space-y-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="size-7 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3.5 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ActivityFeed items={activity.data} />
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TerritorySnapshot />
        </div>
        <div className="xl:col-span-4">
          <BaseHealth items={health.data} loading={health.isLoading} />
        </div>
      </div>
    </div>
  )
}
