import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDecimal } from "@/lib/format"

/** Variação com direção. `goodWhen` define se subir é bom (padrão) ou ruim. */
export function Delta({
  value,
  suffix = "%",
  goodWhen = "up",
  className,
  plain = false,
  decimals = 1,
}: {
  value: number
  suffix?: string
  goodWhen?: "up" | "down"
  className?: string
  plain?: boolean
  decimals?: number
}) {
  const up = value > 0
  const flat = value === 0
  const good = flat ? null : goodWhen === "up" ? up : !up
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  const text = `${up ? "+" : ""}${Number.isInteger(value) ? value : formatDecimal(value, decimals)}${suffix}`
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold tnum",
        plain ? "text-[12.5px]" : "rounded-full px-1.5 py-px text-[11.5px]",
        good === null && (plain ? "text-ink-3" : "bg-canvas-2 text-ink-2"),
        good === true && (plain ? "text-success-600" : "bg-success-50 text-success-700"),
        good === false && (plain ? "text-danger-500" : "bg-danger-50 text-danger-700"),
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.4} />
      {text}
    </span>
  )
}
