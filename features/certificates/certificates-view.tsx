"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Copy, Download, Eye, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import type { Certificate } from "@/types"
import { certificateService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDate } from "@/lib/format"
import { normalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, BulkAction } from "@/components/shared/data-table"
import { FilterBar, FilterSelect, ClearFilters } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { MetricCard } from "@/components/shared/metric-card"
import { CertificateDialog, copyValidation, downloadCertificate } from "./certificate-dialog"

export function CertificatesView() {
  const params = useSearchParams()
  const { data, isLoading } = useQuery({ queryKey: qk.certificates, queryFn: () => certificateService.list() })
  const [q, setQ] = React.useState(params.get("codigo") ?? "")
  const [event, setEvent] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [open, setOpen] = React.useState<Certificate | null>(null)

  const events = React.useMemo(() => [...new Map((data ?? []).map((c) => [c.eventId, c.eventTitle])).entries()].map(([value, label]) => ({ value, label })), [data])
  const rows = React.useMemo(() => {
    const n = normalize(q)
    return (data ?? []).filter((c) => (!n || normalize(c.participantName).includes(n) || c.code.toLowerCase().includes(n)) && (event === "all" || c.eventId === event) && (status === "all" || c.status === status))
  }, [data, q, event, status])

  const columns = React.useMemo<ColumnDef<Certificate>[]>(
    () => [
      { accessorKey: "participantName", header: "Participante", cell: ({ row }) => <div className="flex items-center gap-3"><PersonAvatar name={row.original.participantName} size="sm" /><div><div className="font-semibold text-ink">{row.original.participantName}</div><div className="text-xs text-ink-3">{row.original.chamberName.replace("Câmara Municipal de", "Câmara de")}</div></div></div> },
      { accessorKey: "eventTitle", header: "Evento", cell: ({ getValue }) => <span className="block max-w-[240px] truncate text-ink-2">{String(getValue())}</span> },
      { accessorKey: "workload", header: "Carga horária", meta: { align: "right" }, cell: ({ getValue }) => `${getValue()}h` },
      { accessorKey: "issuedAt", header: "Emissão", cell: ({ getValue }) => formatDate(String(getValue())) },
      { accessorKey: "code", header: "Código", cell: ({ getValue }) => <span className="font-mono text-xs text-ink-2">{String(getValue())}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="certificate" value={String(getValue())} size="sm" /> },
      {
        id: "acoes",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button size="xs" variant="ghost" onClick={() => setOpen(row.original)}><Eye />Visualizar</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="icon-xs" variant="ghost" aria-label="Mais"><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => downloadCertificate(row.original)}><Download />Baixar PDF</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => copyValidation(row.original.code)}><Copy />Copiar validação</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  )

  const issued = (data ?? []).filter((c) => c.status === "emitido")
  return (
    <div className="space-y-6">
      <PageHeader className="mb-0" title="Certificados" description="Emissão, download e validação pública dos certificados de participação." />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Certificados emitidos" value={isLoading ? null : issued.length} loading={isLoading} />
        <MetricCard label="Horas certificadas" value={isLoading ? null : issued.reduce((a, c) => a + c.workload, 0)} loading={isLoading} />
        <MetricCard label="Pendentes de emissão" value={isLoading ? null : (data ?? []).filter((c) => c.status === "pendente").length} loading={isLoading} />
      </div>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={setOpen}
        enableSelection
        entity={["certificado", "certificados"]}
        toolbar={
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Buscar participante ou código…" className="max-w-xs" />
            <FilterSelect label="Evento" value={event} onChange={setEvent} options={events} searchable />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: "emitido", label: "Emitido" }, { value: "pendente", label: "Pendente" }, { value: "revogado", label: "Revogado" }]} />
            <ClearFilters visible={event !== "all" || status !== "all" || !!q} onClear={() => { setEvent("all"); setStatus("all"); setQ("") }} />
          </FilterBar>
        }
        bulkActions={(sel, clear) => (
          <BulkAction icon={Download} onClick={() => { toast.promise(certificateService.download(sel.map((s) => s.id)), { loading: "Gerando arquivo…", success: `${sel.length} certificados prontos (ZIP)` }); clear() }}>Baixar selecionados</BulkAction>
        )}
      />
      <CertificateDialog certificate={open} onOpenChange={(v) => !v && setOpen(null)} />
    </div>
  )
}
