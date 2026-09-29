"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-navy-950/35 backdrop-blur-[1px] duration-250 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  size = "md",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  size?: "sm" | "md" | "lg" | "xl"
  showCloseButton?: boolean
}) {
  const widths = { sm: "sm:max-w-[380px]", md: "sm:max-w-[480px]", lg: "sm:max-w-[640px]", xl: "sm:max-w-[760px]" }
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col bg-white text-ink shadow-pop outline-none duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:animate-in data-closed:animate-out data-closed:duration-200",
          side === "right" && cn("inset-y-0 right-0 h-full w-full border-l border-line-soft data-open:slide-in-from-right data-closed:slide-out-to-right", widths[size]),
          side === "left" && cn("inset-y-0 left-0 h-full w-full border-r border-line-soft data-open:slide-in-from-left data-closed:slide-out-to-left", widths[size]),
          side === "top" && "inset-x-0 top-0 h-auto border-b data-open:slide-in-from-top data-closed:slide-out-to-top",
          side === "bottom" && "inset-x-0 bottom-0 h-auto rounded-t-2xl border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className="absolute top-5 right-5 inline-flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-canvas hover:text-ink focus-visible:ring-[3px] focus-visible:ring-brand-500/25 focus-visible:outline-none"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Fechar</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 border-b border-line-soft px-6 pt-6 pb-5 pr-16", className)} {...props} />
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-body" className={cn("scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-6", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex items-center justify-end gap-2 border-t border-line-soft bg-canvas/60 px-6 py-4", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("font-display text-lg leading-tight font-semibold tracking-[-0.015em] text-ink", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-[13.5px] text-ink-2", className)} {...props} />
}

export { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger }
