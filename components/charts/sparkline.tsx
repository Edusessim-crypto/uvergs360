import { cn } from "@/lib/utils"

/** Sparkline SVG leve (sem Recharts) — 1 série, destaque no último ponto. */
export function Sparkline({
  data,
  className,
  stroke = "var(--color-series-1)",
  fill = true,
  tone = "light",
}: {
  data: number[]
  className?: string
  stroke?: string
  fill?: boolean
  tone?: "light" | "dark"
}) {
  if (data.length < 2) return null
  const w = 100
  const h = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / range) * (h - 8)])
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ")
  const last = pts[pts.length - 1]
  const id = `spark-${data.join("-").slice(0, 24)}-${tone}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("overflow-visible", className)} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={tone === "dark" ? 0.3 : 0.16} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
        </>
      )}
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={stroke} stroke={tone === "dark" ? "#041a4f" : "#fff"} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
