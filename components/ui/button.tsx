import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium tracking-[-0.005em] outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 select-none focus-visible:ring-[3px] focus-visible:ring-brand-500/25 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(11_63_184/0.28)] hover:bg-brand-700 focus-visible:ring-brand-500/35",
        secondary:
          "border border-line bg-white text-ink shadow-[0_1px_2px_rgb(14_27_54/0.05)] hover:border-[#c9d3e6] hover:bg-canvas aria-expanded:bg-canvas",
        outline:
          "border border-line bg-white text-ink shadow-[0_1px_2px_rgb(14_27_54/0.05)] hover:border-[#c9d3e6] hover:bg-canvas aria-expanded:bg-canvas",
        ghost: "text-ink-2 hover:bg-canvas-2/70 hover:text-ink aria-expanded:bg-canvas-2 aria-expanded:text-ink",
        subtle: "bg-brand-50 text-brand-600 hover:bg-brand-100",
        accent:
          "bg-gold-500 text-navy-900 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(138_100_0/0.25)] hover:bg-[#e6a900]",
        destructive: "bg-danger-500 text-white hover:bg-danger-700",
        "destructive-subtle": "bg-danger-50 text-danger-700 hover:bg-[#fbdcdc]",
        dark: "bg-white/[0.08] text-white ring-1 ring-inset ring-white/10 hover:bg-white/[0.14]",
        link: "h-auto px-0 text-brand-600 underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 gap-1.5 rounded-[6px] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 px-3.5 text-[13.5px]",
        lg: "h-10 px-4 text-sm",
        xl: "h-12 rounded-lg px-6 text-[15px]",
        icon: "size-9",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-7 rounded-[6px] [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  if (asChild) {
    return (
      <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
