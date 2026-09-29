"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Landmark, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { Chamber } from "@/types"
import { chamberService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatRelativeDay } from "@/lib/format"
import { cn, normalize } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, BulkAction } from "@/components/shared/data-table"
import { FilterBar, FilterSelect, ClearFilters } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { ExportMenu } from "@/components/shared/export-menu"
import { MetricCard } from "@/components/shared/metric-card"

function Quality({ value }: { value: number }) {
  const tone = value >= 85 ? "bg-success-500" : value >= 70 ? "bg-brand-500" : "bg-danger-500"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-canvas-2"><div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} /></div>
      <span className="text-xs font-semibold text-ink tnum">{value}%</span>
    </div>
  )
}

export function ChambersView() {
  const router = useRouter()
  const params = useSearchParams()
  const { data, isLoading } = useQuery({ queryKey: qk.chambers, queryFn: () => chamberService.list() })
  const [q, setQ] = React.useState("")
  const [region, setRegion] = React.useState("all")
  const [status, setStatus] = React.useState(params.get("status") ?? "all")

  const rows = React.useMemo(() => {
    const n = normalize(q)
    return (data ?? []).filter((c) => (!n || normalize(c.name).includes(n) || normalize(c.president).includes(n)) && (region === "all" || c.regionId === region) && (status === "all" || c.status === status))
  }, [data, q, region, status])

  const regions = [...new Map((data ?? []).map((c) => [c.regionId, c.regionName])).entries()].map(([value, label]) => ({ value, label }))
  const count = (s: string) => (data ?? []).filter((c) => c.status === s).length

  const columns = React.useMemo<ColumnDef<Chamber>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Câmara",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-canvas text-ink-2"><Landmark className="size-4" /></span>
            <div><div className="font-semibold text-ink">{row.original.name}</div><div className="text-xs text-ink-3">Presidente {row.original.president}</div></div>
          </div>
        ),
      },
      { accessorKey: "municipalityName", header: "Município" },
      { accessorKey: "regionName", header: "Região" },
      { accessorKey: "councilorsCount", header: "Vereadores", meta: { align: "right" } },
      { accessorKey: "participantsYear", header: "Participações", meta: { align: "right" } },
      { accessorKey: "dataQuality", header: "Qualidade cadastral", cell: ({ getValue }) => <Quality value={Number(getValue())} /> },
      { accessorKey: "updatedAt", header: "Última atualização", cell: ({ getValue }) => <span className="text-ink-2">{formatRelativeDay(String(getValue()))}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="chamber" value={String(getValue())} size="sm" /> },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader className="mb-0" title="Câmaras" description="Câmaras Municipais cadastradas, qualidade dos dados e engajamento." actions={<ExportMenu reportId="camaras" />} />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Atualizadas" value={isLoading ? null : count("atualizada")} loading={isLoading} deltaLabel="revisadas nos últimos 6 meses" />
        <MetricCard label="Validação pendente" value={isLoading ? null : count("pendente")} loading={isLoading} deltaLabel="aguardando confirmação da Câmara" />
        <MetricCard label="Desatualizadas" value={isLoading ? null : count("desatualizada")} loading={isLoading} deltaLabel="sem revisão há mais de 6 meses" />
      </div>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/camaras/${r.id}`)}
        enableSelection
        entity={["Câmara", "Câmaras"]}
        toolbar={
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Buscar Câmara ou presidente…" className="max-w-xs" />
            <FilterSelect label="Região" value={region} onChange={setRegion} options={regions} allLabel="Todas" />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: "atualizada", label: "Atualizada" }, { value: "pendente", label: "Validação pendente" }, { value: "desatualizada", label: "Desatualizada" }]} />
            <ClearFilters visible={region !== "all" || status !== "all" || !!q} onClear={() => { setRegion("all"); setStatus("all"); setQ("") }} />
          </FilterBar>
        }
        bulkActions={(sel, clear) => (
          <BulkAction icon={RefreshCw} onClick={() => { toast.promise(chamberService.requestUpdate(sel.map((s) => s.id)), { loading: "Enviando solicitações…", success: `Atualização solicitada a ${sel.length} Câmaras` }); clear() }}>
            Solicitar atualização
          </BulkAction>
        )}
      />
    </div>
  )
}
