import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-canvas-2 text-ink-2",
        brand: "bg-brand-50 text-brand-600",
        success: "bg-success-50 text-success-700",
        warning: "bg-warning-50 text-warning-700",
        danger: "bg-danger-50 text-danger-700",
        gold: "bg-gold-50 text-gold-700",
        navy: "bg-navy-900 text-white",
        outline: "border border-line bg-white text-ink-2",
      },
      size: {
        sm: "h-5 px-2 text-[11px]",
        default: "h-6 px-2.5 text-xs",
        lg: "h-7 px-3 text-[13px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "default" },
  },
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  dot = false,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean; dot?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
