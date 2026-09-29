import * as React from "react"
import Link from "next/link"
import { CircleAlert, CircleCheck, Loader2, Lock, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-6 py-10" : "px-6 py-16", className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-dots opacity-60" aria-hidden />
        <span className="relative flex size-12 items-center justify-center rounded-xl border border-line-soft bg-white text-ink-3 shadow-card">
          <Icon className="size-5" />
        </span>
      </div>
      <h3 className="font-display text-[15.5px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-ink-2">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = "Carregando informações…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-ink-3", className)} role="status">
      <Loader2 className="size-6 animate-spin text-brand-500" />
      <span className="text-[13.5px]">{label}</span>
    </div>
  )
}

export function ErrorState({ title = "Não foi possível carregar", description = "Verifique sua conexão e tente novamente.", onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={CircleAlert}
      title={title}
      description={description}
      action={onRetry && <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>}
    />
  )
}

export function SuccessState({ title, description, action, className }: { title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="relative mb-5 flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-success-500/25" aria-hidden />
        <span className="relative flex size-16 items-center justify-center rounded-full bg-success-500 text-white shadow-[0_8px_24px_-6px_rgb(31_175_90/0.5)]">
          <CircleCheck className="size-8" strokeWidth={2.2} />
        </span>
      </span>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-ink-2">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

export function PermissionDenied({ className }: { className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={Lock}
      title="Acesso restrito"
      description="Seu perfil não tem permissão para visualizar esta área. Solicite acesso a um administrador da UVERGS."
      action={
        <Button variant="secondary" asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      }
    />
  )
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-line-soft">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 px-5 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-48" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  )
}
