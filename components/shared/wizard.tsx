"use client"

import * as React from "react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface WizardStep {
  id: string
  title: string
  description?: string
}

/** Indicador de etapas — horizontal (padrão) ou vertical. */
export function WizardSteps({
  steps,
  current,
  onStepClick,
  orientation = "horizontal",
  className,
}: {
  steps: WizardStep[]
  current: number
  onStepClick?: (index: number) => void
  orientation?: "horizontal" | "vertical"
  className?: string
}) {
  if (orientation === "vertical") {
    return (
      <ol className={cn("space-y-1", className)}>
        {steps.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!onStepClick || i > current}
                onClick={() => onStepClick?.(i)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  active ? "bg-brand-50" : "hover:bg-canvas disabled:hover:bg-transparent",
                )}
              >
                <StepDot index={i} done={done} active={active} />
                <span className="min-w-0 pt-0.5">
                  <span className={cn("block text-[13.5px] font-semibold", active ? "text-brand-700" : done ? "text-ink" : "text-ink-3")}>{s.title}</span>
                  {s.description && <span className="block text-xs text-ink-3">{s.description}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <ol className={cn("scrollbar-thin flex items-center gap-2 overflow-x-auto pb-1", className)}>
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.id} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={!onStepClick || i > current}
              onClick={() => onStepClick?.(i)}
              className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors enabled:hover:bg-canvas"
            >
              <StepDot index={i} done={done} active={active} />
              <span className={cn("text-[13px] font-medium whitespace-nowrap", active ? "text-ink" : done ? "text-ink-2" : "text-ink-3")}>{s.title}</span>
            </button>
            {i < steps.length - 1 && <span className={cn("h-px w-6 shrink-0 sm:w-10", done ? "bg-brand-500" : "bg-line")} />}
          </li>
        )
      })}
    </ol>
  )
}

function StepDot({ index, done, active }: { index: number; done: boolean; active: boolean }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-all duration-200 tnum",
        done && "bg-brand-600 text-white",
        active && "bg-white text-brand-600 ring-2 ring-brand-600 ring-offset-2 ring-offset-white",
        !done && !active && "bg-canvas-2 text-ink-3",
      )}
    >
      {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
    </span>
  )
}

/** Rodapé de navegação do wizard. */
export function WizardFooter({
  current,
  total,
  onBack,
  onNext,
  nextLabel,
  finishLabel = "Concluir",
  loading,
  extra,
  className,
}: {
  current: number
  total: number
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  finishLabel?: string
  loading?: boolean
  extra?: React.ReactNode
  className?: string
}) {
  const last = current === total - 1
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <Button type="button" variant="ghost" onClick={onBack} disabled={current === 0 || loading}>
        <ChevronLeft /> Anterior
      </Button>
      <div className="flex items-center gap-3">
        <span className="hidden text-[12.5px] text-ink-3 sm:block tnum">
          Etapa {current + 1} de {total}
        </span>
        {extra}
        <Button type="button" onClick={onNext} loading={loading}>
          {last ? finishLabel : nextLabel ?? "Continuar"}
          {!last && !loading && <ChevronRight />}
        </Button>
      </div>
    </div>
  )
}

/** Hook simples de navegação entre etapas com validação opcional. */
export function useWizard(total: number) {
  const [current, setCurrent] = React.useState(0)
  return {
    current,
    setCurrent,
    next: () => setCurrent((c) => Math.min(total - 1, c + 1)),
    back: () => setCurrent((c) => Math.max(0, c - 1)),
    isLast: current === total - 1,
  }
}
