"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Layers, Mail, MoreHorizontal, Plus, Send, UserCheck } from "lucide-react"
import { toast } from "sonner"
import type { Councilor } from "@/types"
import { councilorService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatRelativeDay } from "@/lib/format"
import { normalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, BulkAction } from "@/components/shared/data-table"
import { FilterBar, FilterSelect, ClearFilters } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { ExportMenu } from "@/components/shared/export-menu"
import { CouncilorFormDrawer } from "./councilor-form"

const PARTICIPATION = [
  { value: "alta", label: "Alta (4+ no ano)" },
  { value: "media", label: "Média (2–3)" },
  { value: "baixa", label: "Baixa (1)" },
  { value: "nenhuma", label: "Nenhuma" },
]

export function CouncilorsView() {
  const router = useRouter()
  const params = useSearchParams()
  const { data, isLoading } = useQuery({ queryKey: qk.councilors, queryFn: () => councilorService.list() })
  const [q, setQ] = React.useState("")
  const [municipality, setMunicipality] = React.useState("all")
  const [region, setRegion] = React.useState("all")
  const [chamber, setChamber] = React.useState("all")
  const [status, setStatus] = React.useState(params.get("email") === "invalido" ? "email_invalido" : "all")
  const [participation, setParticipation] = React.useState("all")
  const [creating, setCreating] = React.useState(params.get("novo") === "1")

  const options = React.useMemo(() => {
    const m = new Map<string, string>(), r = new Map<string, string>(), c = new Map<string, string>()
    data?.forEach((x) => {
      m.set(x.municipalityId, x.municipalityName)
      r.set(x.regionId, x.regionName)
      c.set(x.chamberId, x.chamberName.replace("Câmara Municipal de ", ""))
    })
    const toOpts = (map: Map<string, string>) => [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
    return { municipalities: toOpts(m), regions: toOpts(r), chambers: toOpts(c) }
  }, [data])

  const rows = React.useMemo(() => {
    const n = normalize(q)
    return (data ?? []).filter(
      (c) =>
        (!n || normalize(c.name).includes(n) || c.email.includes(n) || normalize(c.municipalityName).includes(n)) &&
        (municipality === "all" || c.municipalityId === municipality) &&
        (region === "all" || c.regionId === region) &&
        (chamber === "all" || c.chamberId === chamber) &&
        (status === "all" || (status === "email_invalido" ? !c.emailValid : c.status === status)) &&
        (participation === "all" || c.participation === participation),
    )
  }, [data, q, municipality, region, chamber, status, participation])

  const columns = React.useMemo<ColumnDef<Councilor>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonAvatar name={row.original.name} size="sm" />
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{row.original.name}</div>
              <div className="truncate text-xs text-ink-3">{row.original.role}</div>
            </div>
          </div>
        ),
      },
      { accessorKey: "municipalityName", header: "Município", cell: ({ row }) => <div><div className="text-ink">{row.original.municipalityName}</div><div className="text-xs text-ink-3">{row.original.regionName}</div></div> },
      { accessorKey: "chamberName", header: "Câmara", cell: ({ getValue }) => <span className="text-ink-2">{String(getValue()).replace("Câmara Municipal de", "Câmara de")}</span> },
      {
        id: "contact",
        header: "Contato",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <div className={row.original.emailValid ? "truncate text-ink-2" : "truncate text-danger-700"}>{row.original.email}</div>
            <div className="text-xs text-ink-3">{row.original.phone}</div>
          </div>
        ),
      },
      {
        accessorKey: "lastInteractionAt",
        header: "Última interação",
        cell: ({ getValue }) => <span className="text-ink-2">{getValue() ? formatRelativeDay(String(getValue())) : "Nunca"}</span>,
        sortingFn: (a, b) => (a.original.lastInteractionAt ?? "").localeCompare(b.original.lastInteractionAt ?? ""),
      },
      { accessorKey: "eventsCount", header: "Eventos", meta: { align: "right" }, cell: ({ getValue }) => <span className="font-semibold text-ink">{String(getValue())}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="councilor" value={String(getValue())} size="sm" /> },
      {
        id: "menu",
        enableSorting: false,
        header: "",
        meta: { className: "w-10" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Ações"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push(`/vereadores/${row.original.id}`)}><UserCheck />Abrir Perfil 360º</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.success("Mensagem enviada", { description: row.original.email })}><Mail />Enviar e-mail</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => toast.success("Adicionado ao segmento “Convidados especiais”")}><Layers />Adicionar a segmento</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router],
  )

  const anyFilter = [municipality, region, chamber, status, participation].some((v) => v !== "all") || !!q
  const clear = () => {
    setQ(""); setMunicipality("all"); setRegion("all"); setChamber("all"); setStatus("all"); setParticipation("all")
  }

  return (
    <div>
      <PageHeader
        title="Vereadores"
        description={`${(data?.length ?? 4812).toLocaleString("pt-BR")} vereadores cadastrados em ${options.chambers.length || 487} Câmaras do Rio Grande do Sul.`}
        actions={
          <>
            <ExportMenu reportId="vereadores" />
            <Button onClick={() => setCreating(true)}><Plus />Novo vereador</Button>
          </>
        }
      />
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/vereadores/${r.id}`)}
        enableSelection
        entity={["vereador", "vereadores"]}
        toolbar={
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por nome, e-mail ou município…" className="max-w-xs" />
            <FilterSelect label="Município" value={municipality} onChange={setMunicipality} options={options.municipalities} searchable />
            <FilterSelect label="Região" value={region} onChange={setRegion} options={options.regions} allLabel="Todas" />
            <FilterSelect label="Câmara" value={chamber} onChange={setChamber} options={options.chambers} searchable allLabel="Todas" />
            <FilterSelect
              label="Situação"
              value={status}
              onChange={setStatus}
              allLabel="Todas"
              options={[
                { value: "ativo", label: "Ativo" },
                { value: "incompleto", label: "Cadastro incompleto" },
                { value: "email_invalido", label: "Sem e-mail válido" },
              ]}
            />
            <FilterSelect label="Participação" value={participation} onChange={setParticipation} options={PARTICIPATION} allLabel="Todas" />
            <ClearFilters visible={anyFilter} onClear={clear} />
          </FilterBar>
        }
        bulkActions={(sel, done) => (
          <>
            <BulkAction icon={Send} onClick={() => { toast.promise(councilorService.sendMessage(sel.map((s) => s.id), "E-mail", "Comunicado UVERGS"), { loading: "Enviando…", success: `E-mail enviado para ${sel.length} vereadores` }); done() }}>Enviar e-mail</BulkAction>
            <BulkAction icon={Layers} onClick={() => { toast.success(`${sel.length} vereadores adicionados ao segmento`); done() }}>Adicionar a segmento</BulkAction>
            <BulkAction icon={Mail} onClick={() => { toast.success("Convites do portal reenviados"); done() }}>Convidar ao portal</BulkAction>
          </>
        )}
      />
      <CouncilorFormDrawer open={creating} onOpenChange={setCreating} />
    </div>
  )
}
