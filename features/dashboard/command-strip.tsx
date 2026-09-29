"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { DashboardOverview } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { Ring } from "@/components/shared/meter"
import { Sparkline } from "@/components/charts/sparkline"
import { formatDecimal, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

function DeltaChip({ value, suffix = "%", label }: { value: number; suffix?: string; label?: string }) {
  const up = value >= 0
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-white/55">
      <span className={cn("rounded-full px-1.5 py-px font-semibold tnum", up ? "bg-success-500/15 text-[#5fe39a]" : "bg-danger-500/15 text-[#ff9b9b]")}>
        {up ? "+" : ""}
        {Number.isInteger(value) ? value : formatDecimal(value)}
        {suffix}
      </span>
      {label}
    </span>
  )
}

function StripKpi({
  href,
  label,
  children,
  footer,
  className,
}: {
  href: string
  label: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={cn("group/kpi relative flex min-w-0 flex-col justify-between gap-3 px-5 py-5 transition-colors hover:bg-white/[0.035] xl:px-6", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] font-medium text-white/60">{label}</span>
        <ArrowUpRight className="size-3.5 text-white/20 transition-colors group-hover/kpi:text-white/70" />
      </div>
      <div>{children}</div>
      {footer && <div className="min-h-5">{footer}</div>}
    </Link>
  )
}

/** Faixa de comando: indicadores principais sobre a superfície institucional escura. */
export function CommandStrip({ data, loading }: { data?: DashboardOverview; loading: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-xl bg-navy-900 text-white shadow-raised">
      <div className="absolute inset-0 bg-grid-navy" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,rgba(47,107,255,0.28),transparent_65%)]" aria-hidden />
      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(300px,1.15fr)_2.85fr]">
        {/* Hero */}
        <Link href="/vereadores" className="group/hero flex flex-col justify-between gap-6 border-white/[0.08] p-6 transition-colors hover:bg-white/[0.025] lg:border-r xl:p-7">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12.5px] font-medium text-white/65">
              <span className="size-1.5 rounded-full bg-gold-500" />
              Vereadores cadastrados
            </span>
            <ArrowUpRight className="size-4 text-white/25 transition-colors group-hover/hero:text-white/70" />
          </div>
          <div>
            {loading || !data ? (
              <Skeleton className="h-14 w-44 bg-white/10 before:via-white/10" />
            ) : (
              <div className="font-display text-[56px] leading-none font-semibold tracking-[-0.035em]">
                <AnimatedNumber value={data.councilors.value} />
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              {data && <DeltaChip value={data.councilors.delta} suffix="" label={data.councilors.deltaLabel} />}
            </div>
          </div>
          <div className="h-12">{data?.councilors.trend && <Sparkline data={data.councilors.trend} stroke="#8fb0ff" tone="dark" className="h-12 w-full" />}</div>
        </Link>

        {/* Grade de indicadores */}
        <div className="overflow-hidden border-t border-white/[0.08] lg:border-t-0">
        <div className="-mr-px -mb-px grid grid-cols-2 md:grid-cols-3 [&>*]:border-r [&>*]:border-b [&>*]:border-white/[0.08]">
          <StripKpi href="/camaras" label="Câmaras" footer={data && <DeltaChip value={data.chambers.delta} suffix="" label={data.chambers.deltaLabel} />}>
            {loading || !data ? <Skeleton className="h-9 w-24 bg-white/10 before:via-white/10" /> : (
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[34px] leading-none font-semibold tracking-[-0.03em]"><AnimatedNumber value={data.chambers.value} /></span>
                <span className="text-[13px] text-white/45">cadastradas</span>
              </div>
            )}
          </StripKpi>

          <StripKpi href="/territorio" label="Municípios alcançados" footer={<span className="text-[12px] text-white/55">Presença em todas as 9 regiões</span>}>
            {loading || !data ? <Skeleton className="h-9 w-28 bg-white/10 before:via-white/10" /> : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[34px] leading-none font-semibold tracking-[-0.03em]"><AnimatedNumber value={data.municipalities.value} /></span>
                  <span className="font-display text-lg font-medium text-white/40">/ {data.municipalities.total}</span>
                </div>
                <Ring value={(data.municipalities.value / (data.municipalities.total ?? 1)) * 100} size={40} stroke={4} tone="white">
                  <span className="text-[10px] font-semibold tnum">{Math.round((data.municipalities.value / (data.municipalities.total ?? 1)) * 100)}%</span>
                </Ring>
              </div>
            )}
          </StripKpi>

          <StripKpi href="/relatorios" label="Participações no período" footer={data && <DeltaChip value={data.participations.delta} label={data.participations.deltaLabel} />}>
            {loading || !data ? <Skeleton className="h-9 w-28 bg-white/10 before:via-white/10" /> : (
              <div className="flex items-end justify-between gap-3">
                <span className="font-display text-[34px] leading-none font-semibold tracking-[-0.03em]"><AnimatedNumber value={data.participations.value} /></span>
                {data.participations.trend && <Sparkline data={data.participations.trend} stroke="#f4b400" tone="dark" fill={false} className="h-8 w-20" />}
              </div>
            )}
          </StripKpi>

          <StripKpi href="/eventos" label="Eventos realizados" footer={data && <DeltaChip value={data.events.delta} suffix="" label={data.events.deltaLabel} />}>
            {loading || !data ? <Skeleton className="h-9 w-16 bg-white/10 before:via-white/10" /> : (
              <span className="font-display text-[34px] leading-none font-semibold tracking-[-0.03em]"><AnimatedNumber value={data.events.value} /></span>
            )}
          </StripKpi>

          <StripKpi
            href="/avaliacoes"
            label="Taxa de presença"
            footer={data && <DeltaChip value={data.attendanceRate.delta} suffix=" p.p." label="vs. período anterior" />}
          >
            {loading || !data ? <Skeleton className="h-9 w-20 bg-white/10 before:via-white/10" /> : (
              <div>
                <span className="font-display text-[34px] leading-none font-semibold tracking-[-0.03em]">
                  <AnimatedNumber value={data.attendanceRate.value} />%
                </span>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold-500 transition-[width] duration-700" style={{ width: `${data.attendanceRate.value}%` }} />
                </div>
              </div>
            )}
          </StripKpi>

          <StripKpi href="/metas" label="Meta anual de participantes" footer={<span className="text-[12px] text-white/55">5.284 de 6.000 participantes</span>}>
            <div className="flex items-center gap-3">
              <span className="font-display text-[34px] leading-none font-semibold tracking-[-0.03em]">{formatNumber(88)}%</span>
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] font-medium text-white/70">no ritmo</span>
            </div>
          </StripKpi>
        </div>
        </div>
      </div>
    </section>
  )
}
