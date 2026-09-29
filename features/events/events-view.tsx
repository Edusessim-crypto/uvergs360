"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { LayoutGrid, List, Plus } from "lucide-react"
import type { UvergsEvent } from "@/types"
import { eventService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDateRange, formatNumber } from "@/lib/format"
import { normalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EventCard } from "@/components/shared/event-card"
import { DataTable } from "@/components/shared/data-table"
import { FilterBar, FilterSelect, ClearFilters } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { StatusBadge } from "@/components/shared/status-badge"
import { Meter } from "@/components/shared/meter"
import { EmptyState } from "@/components/shared/states"

const UPCOMING = ["em_andamento", "inscricoes_abertas", "agendado", "esgotado", "rascunho"]

export function EventsView() {
  const router = useRouter()
  const { data, isLoading } = useQuery({ queryKey: qk.events, queryFn: () => eventService.list() })
  const [tab, setTab] = React.useState<"proximos" | "realizados">("proximos")
  const [view, setView] = React.useState<"cards" | "tabela">("cards")
  const [q, setQ] = React.useState("")
  const [type, setType] = React.useState("all")
  const [format, setFormat] = React.useState("all")

  const rows = React.useMemo(() => {
    const n = normalize(q)
    const list = (data ?? []).filter(
      (e) =>
        (tab === "proximos" ? UPCOMING.includes(e.status) : e.status === "encerrado") &&
        (!n || normalize(e.title).includes(n) || normalize(e.city).includes(n)) &&
        (type === "all" || e.type === type) &&
        (format === "all" || e.format === format),
    )
    return tab === "realizados" ? list.reverse() : list
  }, [data, tab, q, type, format])

  const counts = { proximos: (data ?? []).filter((e) => UPCOMING.includes(e.status)).length, realizados: (data ?? []).filter((e) => e.status === "encerrado").length }
  const types = [...new Set((data ?? []).map((e) => e.type))].map((t) => ({ value: t, label: t }))

  const columns = React.useMemo<ColumnDef<UvergsEvent>[]>(
    () => [
      { accessorKey: "title", header: "Evento", cell: ({ row }) => <div><div className="font-semibold text-ink">{row.original.title}</div><div className="text-xs text-ink-3">{row.original.type} · {row.original.format}</div></div> },
      { accessorKey: "startDate", header: "Data", cell: ({ row }) => formatDateRange(row.original.startDate, row.original.endDate) },
      { accessorKey: "city", header: "Local" },
      {
        accessorKey: "registered",
        header: "Inscritos",
        cell: ({ row }) => (
          <div className="w-36">
            <div className="mb-1 text-xs text-ink-2"><span className="font-semibold text-ink">{formatNumber(row.original.registered)}</span> / {formatNumber(row.original.capacity)}</div>
            <Meter value={row.original.registered} max={row.original.capacity} size="sm" />
          </div>
        ),
      },
      { accessorKey: "present", header: "Presentes", meta: { align: "right" }, cell: ({ getValue }) => (getValue() === null ? "—" : formatNumber(Number(getValue()))) },
      { accessorKey: "nps", header: "NPS", meta: { align: "right" }, cell: ({ getValue }) => (getValue() === null ? "—" : String(getValue())) },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="event" value={String(getValue())} size="sm" /> },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Eventos"
        description="Planeje, divulgue e acompanhe todo o ciclo dos eventos da UVERGS."
        actions={<Button asChild><Link href="/eventos/novo"><Plus />Novo evento</Link></Button>}
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "proximos", label: <>Próximos <span className="text-ink-3 tnum">{counts.proximos}</span></> },
            { value: "realizados", label: <>Realizados <span className="text-ink-3 tnum">{counts.realizados}</span></> },
          ]}
        />
        <FilterBar
          className="lg:justify-end"
          right={
            <SegmentedControl
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: "cards", label: <LayoutGrid className="size-4" aria-label="Cards" /> },
                { value: "tabela", label: <List className="size-4" aria-label="Tabela" /> },
              ]}
            />
          }
        >
          <SearchInput value={q} onChange={setQ} placeholder="Buscar evento ou cidade…" className="max-w-xs" />
          <FilterSelect label="Tipo" value={type} onChange={setType} options={types} />
          <FilterSelect label="Formato" value={format} onChange={setFormat} options={[{ value: "Presencial", label: "Presencial" }, { value: "Online", label: "Online" }, { value: "Híbrido", label: "Híbrido" }]} />
          <ClearFilters visible={type !== "all" || format !== "all" || !!q} onClear={() => { setType("all"); setFormat("all"); setQ("") }} />
        </FilterBar>
      </div>

      {view === "tabela" ? (
        <DataTable columns={columns} data={rows} loading={isLoading} onRowClick={(e) => router.push(`/eventos/${e.id}`)} entity={["evento", "eventos"]} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[248px] rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="card"><EmptyState title="Nenhum evento encontrado" description="Ajuste os filtros ou crie um novo evento." action={<Button asChild><Link href="/eventos/novo"><Plus />Novo evento</Link></Button>} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  )
}
