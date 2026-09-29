import { SEQUENTIAL } from "@/components/charts/chart-kit"
import { cn } from "@/lib/utils"

export function MapLegend({ title, min, max, className }: { title: string; min: string; max: string; className?: string }) {
  const ramp = SEQUENTIAL.slice(1)
  return (
    <div className={cn("rounded-lg border border-line-soft bg-white/95 px-3 py-2.5 shadow-card backdrop-blur", className)}>
      <div className="mb-2 text-[11.5px] font-semibold text-ink-2">{title}</div>
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 overflow-hidden rounded-full">
          {ramp.map((c) => (
            <span key={c} className="h-full w-5" style={{ background: c }} />
          ))}
        </span>
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-3 tnum">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-3">
        <span className="size-2.5 rounded-[3px] border border-line bg-[#eef1f6]" /> Sem registro
      </div>
    </div>
  )
}
