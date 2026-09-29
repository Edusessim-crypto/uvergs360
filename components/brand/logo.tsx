import { cn } from "@/lib/utils"

/**
 * Marca UVERGS 360 — símbolo provisório (U + órbita 360º).
 * Substituir pelo arquivo oficial da UVERGS em /public/brand quando disponível.
 */
export function LogoMark({ className, tone = "brand" }: { className?: string; tone?: "brand" | "white" }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9 shrink-0", className)} aria-hidden>
      <rect width="40" height="40" rx="10" fill={tone === "brand" ? "#0B3FB8" : "rgba(255,255,255,0.1)"} />
      <path
        d="M28.36 10.04 A13 13 0 1 1 17.74 7.2"
        fill="none"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="23.36" cy="7.44" r="2.3" fill="#F4B400" />
      <path d="M14.6 14v6.4a5.4 5.4 0 0 0 10.8 0V14" fill="none" stroke="#fff" strokeWidth="3.1" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({
  className,
  variant = "dark",
  caption,
  compact = false,
}: {
  className?: string
  variant?: "dark" | "light"
  caption?: string
  compact?: boolean
}) {
  const light = variant === "light"
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      {!compact && (
        <div className="min-w-0 leading-none">
          <div className={cn("font-display text-[17px] font-bold tracking-[0.02em]", light ? "text-white" : "text-navy-900")}>
            UVERGS <span className={light ? "text-gold-500" : "text-brand-600"}>360</span>
          </div>
          {caption && <div className={cn("mt-1 truncate text-[11px] font-medium", light ? "text-white/45" : "text-ink-3")}>{caption}</div>}
        </div>
      )}
    </div>
  )
}
