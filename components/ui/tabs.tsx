"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-6", className)} {...props} />
}

/**
 * variant "line": abas sublinhadas (padrão de páginas de detalhe).
 * variant "pill": controle segmentado compacto.
 */
function TabsList({ className, variant = "line", ...props }: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: "line" | "pill" }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "group/tabs-list scrollbar-thin inline-flex items-center",
        variant === "line" && "w-full gap-6 overflow-x-auto border-b border-line-soft",
        variant === "pill" && "gap-0.5 rounded-lg bg-canvas-2 p-[3px]",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-1.5 text-[13.5px] font-medium whitespace-nowrap text-ink-2 outline-none transition-colors duration-150 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-brand-500/25 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        "group-data-[variant=line]/tabs-list:h-11 group-data-[variant=line]/tabs-list:px-0.5 group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-[variant=line]/tabs-list:after:-bottom-px group-data-[variant=line]/tabs-list:after:h-[2px] group-data-[variant=line]/tabs-list:after:rounded-full group-data-[variant=line]/tabs-list:after:bg-transparent group-data-[variant=line]/tabs-list:after:transition-colors group-data-[variant=line]/tabs-list:data-[state=active]:text-ink group-data-[variant=line]/tabs-list:data-[state=active]:after:bg-brand-600",
        "group-data-[variant=pill]/tabs-list:h-8 group-data-[variant=pill]/tabs-list:rounded-md group-data-[variant=pill]/tabs-list:px-3 group-data-[variant=pill]/tabs-list:text-[13px] group-data-[variant=pill]/tabs-list:data-[state=active]:bg-white group-data-[variant=pill]/tabs-list:data-[state=active]:text-ink group-data-[variant=pill]/tabs-list:data-[state=active]:shadow-[0_1px_2px_rgb(14_27_54/0.08),0_0_0_1px_rgb(14_27_54/0.04)]",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none data-[state=active]:animate-fade-up", className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
