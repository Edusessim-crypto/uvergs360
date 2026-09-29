"use client"

import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import type { PriorityItem } from "@/types"
import { Panel } from "@/components/shared/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const SEVERITY = {
  alta: { bar: "bg-danger-500", label: "Urgente", text: "text-danger-700" },
  media: { bar: "bg-warning-500", label: "Atenção", text: "text-warning-700" },
  baixa: { bar: "bg-brand-400", label: "Acompanhar", text: "text-brand-600" },
}

export function PrioritiesPanel({ items, loading }: { items?: PriorityItem[]; loading: boolean }) {
  return (
    <Panel
      title="Prioridades de hoje"
      description="Pendências que pedem ação da equipe"
      className="h-full"
      flush
      action={
        <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[11.5px] font-semibold text-danger-700 tnum">
          {items ? items.reduce((a, i) => a + i.count, 0) : "—"} itens
        </span>
      }
    >
      <ul className="px-3 pb-2">
        {loading || !items
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-3 py-4">
                <Skeleton className="h-8 w-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </li>
            ))
          : items.map((item) => {
              const s = SEVERITY[item.severity]
              return (
                <li key={item.id}>
                  <Link href={item.href} className="group/pri relative flex items-center gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-canvas">
                    <span className={cn("absolute top-3.5 bottom-3.5 left-0 w-[3px] rounded-full", s.bar)} aria-hidden />
                    <span className="w-12 shrink-0 font-display text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink tnum">{item.count}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] leading-snug font-semibold text-ink">{item.label}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-3">
                        <span className={cn("font-semibold", s.text)}>{s.label}</span>
                        <span aria-hidden>·</span>
                        <span className="truncate">{item.description}</span>
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-ink-4 transition-transform group-hover/pri:translate-x-0.5 group-hover/pri:text-brand-600" />
                  </Link>
                </li>
              )
            })}
      </ul>
      <div className="mt-auto border-t border-line-soft px-6 py-3.5">
        <Link href="/radar" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-500">
          Abrir Radar UVERGS <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Panel>
  )
}
