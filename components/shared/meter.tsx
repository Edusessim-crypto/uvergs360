import { cn } from "@/lib/utils"

/** Barra de progresso com rótulo — trilho claro da mesma rampa. */
export function Meter({
  value,
  max = 100,
  tone = "brand",
  size = "md",
  className,
}: {
  value: number
  max?: number
  tone?: "brand" | "success" | "warning" | "danger" | "gold" | "navy"
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  const tones = {
    brand: ["bg-brand-50", "bg-brand-600"],
    success: ["bg-success-50", "bg-success-500"],
    warning: ["bg-warning-50", "bg-warning-500"],
    danger: ["bg-danger-50", "bg-danger-500"],
    gold: ["bg-gold-50", "bg-gold-500"],
    navy: ["bg-white/10", "bg-white"],
  }[tone]
  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2" }
  return (
    <div className={cn("w-full overflow-hidden rounded-full", heights[size], tones[0], className)} role="meter" aria-valuenow={value} aria-valuemax={max}>
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]", tones[1])} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Anel de progresso SVG. */
export function Ring({
  value,
  size = 56,
  stroke = 5,
  tone = "brand",
  children,
  className,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: "brand" | "success" | "gold" | "white"
  children?: React.ReactNode
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const colors = {
    brand: ["#dfe8ff", "#0b3fb8"],
    success: ["#e8f7ef", "#1faf5a"],
    gold: ["#fdefc2", "#f4b400"],
    white: ["rgba(255,255,255,0.12)", "#ffffff"],
  }[tone]
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors[0]} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors[1]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
