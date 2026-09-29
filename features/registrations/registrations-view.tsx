"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { BadgeDollarSign, Send } from "lucide-react"
import { toast } from "sonner"
import type { Registration } from "@/types"
import { registrationService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { normalize } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, BulkAction } from "@/components/shared/data-table"
import { FilterBar, FilterSelect, ClearFilters } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { ExportMenu } from "@/components/shared/export-menu"
import { MetricCard } from "@/components/shared/metric-card"

export function RegistrationsView() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: qk.registrations, queryFn: () => registrationService.list() })
  const [q, setQ] = React.useState("")
  const [event, setEvent] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [payment, setPayment] = React.useState("all")
  const [municipality, setMunicipality] = React.useState("all")

  const opts = React.useMemo(() => {
    const ev = new Map<string, string>(), mu = new Set<string>()
    data?.forEach((r) => { ev.set(r.eventId, r.eventTitle); mu.add(r.municipalityName) })
    return {
      events: [...ev.entries()].map(([value, label]) => ({ value, label })),
      municipalities: [...mu].sort().map((m) => ({ value: m, label: m })),
    }
  }, [data])

  const rows = React.useMemo(() => {
    const n = normalize(q)
    return (data ?? []).filter(
      (r) =>
        (!n || normalize(r.participantName).includes(n) || r.code.toLowerCase().includes(n)) &&
        (event === "all" || r.eventId === event) &&
        (status === "all" || r.status === status) &&
        (payment === "all" || r.paymentStatus === payment) &&
        (municipality === "all" || r.municipalityName === municipality),
    )
  }, [data, q, event, status, payment, municipality])

  const confirm = useMutation({
    mutationFn: (ids: string[]) => registrationService.confirmPayment(ids),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: qk.registrations })
      toast.success(`${r.updated} pagamentos confirmados`)
    },
  })

  const columns = React.useMemo<ColumnDef<Registration>[]>(
    () => [
      { accessorKey: "participantName", header: "Participante", cell: ({ row }) => <div className="flex items-center gap-3"><PersonAvatar name={row.original.participantName} size="sm" /><div><div className="font-semibold text-ink">{row.original.participantName}</div><div className="font-mono text-[11px] text-ink-3">{row.original.code}</div></div></div> },
      { accessorKey: "eventTitle", header: "Evento", cell: ({ getValue }) => <span className="block max-w-[220px] truncate text-ink-2">{String(getValue())}</span> },
      { accessorKey: "createdAt", header: "Data", cell: ({ getValue }) => <span className="text-ink-2 tnum">{formatDateTime(String(getValue()))}</span> },
      { accessorKey: "chamberName", header: "Câmara", cell: ({ getValue }) => <span className="text-ink-2">{String(getValue()).replace("Câmara Municipal de", "Câmara de")}</span> },
      { accessorKey: "amount", header: "Valor", meta: { align: "right" }, cell: ({ getValue }) => (Number(getValue()) ? formatCurrency(Number(getValue())) : "—") },
      { accessorKey: "paymentStatus", header: "Pagamento", cell: ({ getValue }) => <StatusBadge domain="payment" value={String(getValue())} size="sm" /> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="registration" value={String(getValue())} size="sm" /> },
    ],
    [],
  )

  const pending = (data ?? []).filter((r) => r.paymentStatus === "pendente" && r.status !== "cancelada").length
  const incomplete = (data ?? []).filter((r) => r.status === "incompleta").length
  const revenue = (data ?? []).filter((r) => r.paymentStatus === "confirmado").reduce((a, r) => a + r.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader className="mb-0" title="Inscrições" description="Todas as inscrições dos eventos, com pagamento e situação." actions={<ExportMenu reportId="inscricoes" />} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Inscrições" value={data?.length} loading={isLoading} />
        <MetricCard label="Pagamentos pendentes" value={isLoading ? null : pending} loading={isLoading} />
        <MetricCard label="Inscrições incompletas" value={isLoading ? null : incomplete} loading={isLoading} href="/radar?situacao=inscricao_abandonada" />
        <MetricCard label="Receita confirmada" value={isLoading ? null : revenue} loading={isLoading} format={(n) => formatCurrency(n).replace(",00", "")} />
      </div>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => (r.councilorId ? router.push(`/vereadores/${r.councilorId}`) : router.push(`/eventos/${r.eventId}`))}
        enableSelection
        entity={["inscrição", "inscrições"]}
        toolbar={
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Buscar participante ou código…" className="max-w-xs" />
            <FilterSelect label="Evento" value={event} onChange={setEvent} options={opts.events} searchable />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: "confirmada", label: "Confirmada" }, { value: "incompleta", label: "Incompleta" }, { value: "cancelada", label: "Cancelada" }]} />
            <FilterSelect label="Pagamento" value={payment} onChange={setPayment} options={[{ value: "confirmado", label: "Confirmado" }, { value: "pendente", label: "Pendente" }, { value: "isento", label: "Isento" }]} />
            <FilterSelect label="Município" value={municipality} onChange={setMunicipality} options={opts.municipalities} searchable />
            <ClearFilters visible={[event, status, payment, municipality].some((x) => x !== "all") || !!q} onClear={() => { setEvent("all"); setStatus("all"); setPayment("all"); setMunicipality("all"); setQ("") }} />
          </FilterBar>
        }
        bulkActions={(sel, clear) => (
          <>
            <BulkAction icon={BadgeDollarSign} onClick={() => { confirm.mutate(sel.map((s) => s.id)); clear() }}>Confirmar pagamento</BulkAction>
            <BulkAction icon={Send} onClick={() => { toast.promise(registrationService.sendReminder(sel.map((s) => s.id)), { loading: "Enviando lembretes…", success: `Lembrete enviado para ${sel.length} inscritos` }); clear() }}>Enviar lembrete</BulkAction>
          </>
        )}
      />
    </div>
  )
}
