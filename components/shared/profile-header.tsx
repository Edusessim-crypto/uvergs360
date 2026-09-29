import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Cabeçalho de entidade (Perfil 360º, Câmara, Evento).
 * Faixa superior institucional + identidade + ações + estatísticas.
 */
export function ProfileHeader({
  avatar,
  eyebrow,
  title,
  subtitle,
  meta,
  tags,
  actions,
  stats,
  className,
  band = true,
}: {
  avatar?: React.ReactNode
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
  tags?: React.ReactNode
  actions?: React.ReactNode
  stats?: { label: string; value: React.ReactNode; hint?: React.ReactNode }[]
  className?: string
  band?: boolean
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {band && (
        <div className="relative h-24 overflow-hidden bg-navy-900 sm:h-28">
          <div className="absolute inset-0 bg-grid-navy" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(90%_140%_at_100%_0%,rgba(47,107,255,0.35),transparent_60%)]" aria-hidden />
          <svg className="absolute -right-10 -bottom-24 size-72 text-white/[0.05]" viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
      <div className="relative px-5 pb-5 sm:px-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            {avatar && <div className={cn("shrink-0", band && "-mt-10 sm:-mt-12")}>{avatar}</div>}
            <div className="min-w-0 pt-4">
              {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-2">{eyebrow}</div>}
              <h1 className="font-display text-[26px] leading-tight font-semibold tracking-[-0.025em] text-ink sm:text-[30px]">{title}</h1>
              {subtitle && <div className="mt-1 text-[14px] text-ink-2">{subtitle}</div>}
              {meta && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">{meta}</div>}
              {tags && <div className="mt-3 flex flex-wrap items-center gap-2">{tags}</div>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 xl:justify-end xl:pt-5">{actions}</div>}
        </div>
      </div>
      {stats && stats.length > 0 && (
        <dl className="grid grid-cols-2 border-t border-line-soft sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s, i) => (
            <div key={s.label} className={cn("px-5 py-4 sm:px-7", i > 0 && "border-line-soft max-lg:odd:border-l-0 sm:border-l", i >= 2 && "max-sm:border-t", i >= 3 && "sm:max-lg:border-t")}>
              <dt className="text-[12px] font-medium text-ink-3">{s.label}</dt>
              <dd className="mt-1 flex items-baseline gap-2">
                <span className="kpi-value text-[22px] leading-none">{s.value}</span>
                {s.hint && <span className="text-xs text-ink-3">{s.hint}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
