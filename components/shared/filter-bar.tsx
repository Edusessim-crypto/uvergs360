"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { cn, normalize } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
  hint?: string
}

export function FilterBar({ children, className, right }: { children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

/**
 * Filtro de valor único. `"all"` representa ausência de filtro.
 * Com `searchable`, abre uma lista com busca (ideal para municípios e Câmaras).
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  searchable,
  allLabel = "Todos",
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  searchable?: boolean
  allLabel?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const active = value !== "all"
  const selected = options.find((o) => o.value === value)

  const filtered = React.useMemo(() => {
    if (!q) return options.slice(0, 200)
    const n = normalize(q)
    return options.filter((o) => normalize(o.label).includes(n)).slice(0, 200)
  }, [options, q])

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setQ("")
      }}
    >
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
            active ? "border-brand-200 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-2 hover:border-[#c9d3e6] hover:text-ink",
            className,
          )}
        >
          <span className={cn(active && "text-brand-600/70")}>{label}</span>
          {active && <span className="max-w-[160px] truncate font-semibold">{selected?.label}</span>}
          {active ? (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                onChange("all")
              }}
              className="-mr-1 ml-0.5 flex size-4 items-center justify-center rounded hover:bg-brand-100"
              aria-label={`Remover filtro ${label}`}
            >
              <X className="size-3" />
            </span>
          ) : (
            <ChevronDown className="size-3.5 text-ink-3" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command shouldFilter={false}>
          {searchable && (
            <div className="border-b border-line-soft">
              <CommandInput value={q} onValueChange={setQ} placeholder={`Buscar ${label.toLowerCase()}…`} className="text-[13.5px]" />
            </div>
          )}
          <CommandList className="max-h-72 p-1.5">
            <CommandEmpty className="py-6 text-[13px]">Nenhuma opção encontrada.</CommandEmpty>
            <CommandGroup>
              {!q && (
                <CommandItem
                  value="__all"
                  onSelect={() => {
                    onChange("all")
                    setOpen(false)
                  }}
                  className="py-2"
                >
                  <span className="flex-1 text-ink-2">{allLabel}</span>
                  {!active && <Check className="size-4 text-brand-600" />}
                </CommandItem>
              )}
              {filtered.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  onSelect={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className="py-2"
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="text-xs text-ink-3 tnum">{o.hint}</span>}
                  {value === o.value && <Check className="size-4 text-brand-600" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ClearFilters({ visible, onClear }: { visible: boolean; onClear: () => void }) {
  if (!visible) return null
  return (
    <Button variant="ghost" size="sm" onClick={onClear} className="text-ink-3">
      Limpar filtros
    </Button>
  )
}
