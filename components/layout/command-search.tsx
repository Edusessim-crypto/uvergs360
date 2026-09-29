"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Award, CalendarDays, CornerDownLeft, Landmark, Loader2, MapPin, User } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { searchService } from "@/services"
import { useDebounce } from "@/hooks/use-debounce"
import { qk } from "@/lib/query-keys"
import { DEMO_TOUR } from "@/lib/navigation"
import type { SearchResult } from "@/types"
import { useShell } from "./shell-context"

const GROUP_ICON: Record<SearchResult["group"], typeof User> = {
  Municípios: MapPin,
  Câmaras: Landmark,
  Vereadores: User,
  Eventos: CalendarDays,
  Certificados: Award,
}

const SUGGESTIONS = ["Gramado", "Carlos Eduardo Martins", "Seminário", "Caxias do Sul"]

export function CommandSearch() {
  const { searchOpen, setSearchOpen } = useShell()
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const debounced = useDebounce(query, 160)

  const { data = [], isFetching } = useQuery({
    queryKey: qk.search(debounced),
    queryFn: () => searchService.search(debounced),
    enabled: debounced.trim().length >= 2,
    placeholderData: (prev) => prev,
  })

  React.useEffect(() => {
    if (!searchOpen) setQuery("")
  }, [searchOpen])

  const go = (href: string) => {
    setSearchOpen(false)
    router.push(href)
  }

  const groups = React.useMemo(() => {
    const map = new Map<SearchResult["group"], SearchResult[]>()
    if (debounced.trim().length < 2) return map
    data.forEach((r) => map.set(r.group, [...(map.get(r.group) ?? []), r]))
    return map
  }, [data, debounced])

  const typing = query.trim().length >= 2

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent size="lg" showCloseButton={false} className="top-[14vh] translate-y-0 p-0 data-open:slide-in-from-top-2">
        <DialogTitle className="sr-only">Busca global</DialogTitle>
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar vereadores, Câmaras, municípios, eventos, certificados…"
            right={isFetching && typing ? <Loader2 className="size-4 animate-spin text-ink-3" /> : <kbd className="rounded border border-line px-1.5 text-[11px] text-ink-3">esc</kbd>}
          />
          <CommandList>
            {!typing && (
              <>
                <CommandGroup heading="Sugestões">
                  {SUGGESTIONS.map((s) => (
                    <CommandItem key={s} value={`sug-${s}`} onSelect={() => setQuery(s)}>
                      <span className="flex size-7 items-center justify-center rounded-md bg-canvas-2 text-ink-3">
                        <ArrowRight className="size-3.5" />
                      </span>
                      <span className="text-ink-2">
                        Buscar por <span className="font-medium text-ink">{s}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Acesso rápido">
                  {DEMO_TOUR.map((t) => (
                    <CommandItem key={t.href} value={`nav-${t.href}`} onSelect={() => go(t.href)}>
                      <span className="flex size-7 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                        <ArrowRight className="size-3.5" />
                      </span>
                      <span className="flex-1 font-medium">{t.title}</span>
                      <span className="hidden text-xs text-ink-3 sm:block">{t.line}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {typing && !isFetching && data.length === 0 && debounced === query && <CommandEmpty>Nenhum resultado para “{query}”.</CommandEmpty>}
            {typing &&
              [...groups.entries()].map(([group, items]) => {
                const Icon = GROUP_ICON[group]
                return (
                  <CommandGroup key={group} heading={group}>
                    {items.map((r) => (
                      <CommandItem key={r.id} value={r.id} onSelect={() => go(r.href)}>
                        <span className="flex size-8 items-center justify-center rounded-md border border-line-soft bg-white text-ink-2">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-ink">{r.title}</span>
                          <span className="block truncate text-xs text-ink-3">{r.subtitle}</span>
                        </span>
                        <CornerDownLeft className="size-3.5 text-ink-4 opacity-0 group-data-[selected=true]/item:opacity-100" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
          </CommandList>
          <div className="flex items-center gap-4 border-t border-line-soft bg-canvas/60 px-5 py-2.5 text-[11.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-line bg-white px-1">↑</kbd>
              <kbd className="rounded border border-line bg-white px-1">↓</kbd> navegar
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-line bg-white px-1">↵</kbd> abrir
            </span>
            <span className="ml-auto">Busca em 4.812 vereadores, 487 Câmaras e 497 municípios</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
