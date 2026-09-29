"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = (props: React.ComponentProps<typeof SelectPrimitive.Root>) => <SelectPrimitive.Root data-slot="select" {...props} />
const SelectGroup = (props: React.ComponentProps<typeof SelectPrimitive.Group>) => <SelectPrimitive.Group data-slot="select-group" {...props} />
const SelectValue = (props: React.ComponentProps<typeof SelectPrimitive.Value>) => <SelectPrimitive.Value data-slot="select-value" {...props} />

function SelectTrigger({ className, size = "default", children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-line bg-white px-3 text-left text-[13.5px] whitespace-nowrap text-ink shadow-[0_1px_1px_rgb(14_27_54/0.03)] outline-none transition-[border-color,box-shadow] duration-150 hover:border-[#c9d3e6] focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-500 data-placeholder:text-ink-3 data-[size=default]:h-9 data-[size=sm]:h-8 data-[size=sm]:text-[13px] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-ink-3" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, position = "popper", align = "start", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border border-line-soft bg-white text-ink shadow-pop duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97] data-closed:animate-out data-closed:fade-out-0",
          position === "popper" && "w-full min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={cn("p-1.5", position === "popper" && "w-full min-w-(--radix-select-trigger-width) scroll-my-1")}>{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label data-slot="select-label" className={cn("px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-[0.06em] text-ink-3 uppercase", className)} {...props} />
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-[13px] outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-canvas data-[state=checked]:font-medium [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-brand-600" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("-mx-1.5 my-1.5 h-px bg-line-soft", className)} {...props} />
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton className={cn("flex cursor-default items-center justify-center py-1 text-ink-3", className)} {...props}>
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton className={cn("flex cursor-default items-center justify-center py-1 text-ink-3", className)} {...props}>
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue }
