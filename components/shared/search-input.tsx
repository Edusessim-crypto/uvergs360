"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { fieldBase } from "@/components/ui/input"

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(fieldBase, "h-9 pr-8 pl-9")}
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-ink-3 hover:bg-canvas-2 hover:text-ink"
          aria-label="Limpar busca"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
