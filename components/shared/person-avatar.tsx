import { cn, initials } from "@/lib/utils"
import { hashString } from "@/lib/random"

const TONES = [
  "bg-brand-50 text-brand-600",
  "bg-[#e7f4f1] text-[#0f7a63]",
  "bg-[#f1ebfb] text-[#6b3fc0]",
  "bg-gold-50 text-gold-700",
  "bg-[#fdeeee] text-[#a42a2a]",
  "bg-[#e8f0fb] text-[#1d5fa8]",
  "bg-[#eef1f5] text-[#3d4a63]",
]

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[11.5px]",
  md: "size-9 text-[12.5px]",
  lg: "size-12 text-[15px]",
  xl: "size-[72px] text-[24px]",
  "2xl": "size-[88px] text-[28px]",
}

export function PersonAvatar({ name, size = "md", className, ring = false }: { name: string; size?: keyof typeof SIZES; className?: string; ring?: boolean }) {
  const tone = TONES[hashString(name) % TONES.length]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold tracking-[0.01em] select-none",
        SIZES[size],
        tone,
        ring && "ring-4 ring-white",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({ names, max = 4, size = "sm" }: { names: string[]; max?: number; size?: keyof typeof SIZES }) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className="flex -space-x-2">
      {shown.map((n) => (
        <PersonAvatar key={n} name={n} size={size} className="ring-2 ring-white" />
      ))}
      {rest > 0 && (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-canvas-2 font-semibold text-ink-2 ring-2 ring-white", SIZES[size])}>+{rest}</span>
      )}
    </div>
  )
}
