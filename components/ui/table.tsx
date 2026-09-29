import * as React from "react"
import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="scrollbar-thin relative w-full overflow-x-auto">
      <table data-slot="table" className={cn("w-full caption-bottom border-separate border-spacing-0 text-[13.5px]", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:bg-canvas/70", className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child_td]:border-b-0", className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={cn("group/row transition-colors duration-150 data-[state=selected]:bg-brand-50/60", className)} {...props} />
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 border-y border-line-soft px-4 text-left align-middle text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap text-ink-3 uppercase first:pl-5 last:pr-5 [&:has([role=checkbox])]:w-10 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("h-14 border-b border-line-soft px-4 align-middle whitespace-nowrap text-ink first:pl-5 last:pr-5 [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-4 text-sm text-ink-2", className)} {...props} />
}

export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow }
