"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Globe, Landmark, Mail, MapPin, Phone, RefreshCw, User } from "lucide-react"
import { toast } from "sonner"
import type { Councilor } from "@/types"
import { chamberService, councilorService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDate, formatRelativeDay, formatDateRange, formatNumber } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ProfileHeader } from "@/components/shared/profile-header"
import { Panel, DataRow } from "@/components/shared/panel"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { DataTable } from "@/components/shared/data-table"
import { ActivityFeed } from "@/components/shared/activity-timeline"
import { Meter } from "@/components/shared/meter"
import { Field } from "@/components/shared/field"
import { ErrorState, EmptyState } from "@/components/shared/states"
import { useBreadcrumbLabel } from "@/components/layout/shell-context"

export function ChamberProfileView({ id }: { id: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const chamber = useQuery({ queryKey: qk.chamber(id), queryFn: () => chamberService.getById(id) })
  const members = useQuery({ queryKey: qk.chamberCouncilors(id), queryFn: () => councilorService.listByChamber(id) })
  const events = useQuery({ queryKey: qk.chamberEvents(id), queryFn: () => chamberService.getEvents(id) })
  const activity = useQuery({ queryKey: qk.chamberActivity(id), queryFn: () => chamberService.getActivity(id) })
  useBreadcrumbLabel(chamber.data?.name)

  const [form, setForm] = React.useState({ phone: "", email: "", website: "", address: "", adminContact: "" })
  React.useEffect(() => {
    if (chamber.data) setForm({ phone: chamber.data.phone, email: chamber.data.email, website: chamber.data.website, address: chamber.data.address, adminContact: chamber.data.adminContact })
  }, [chamber.data])
  const save = useMutation({
    mutationFn: () => chamberService.update(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chamber(id) })
      qc.invalidateQueries({ queryKey: qk.chambers })
      toast.success("Dados da Câmara atualizados")
    },
  })

  const columns = React.useMemo<ColumnDef<Councilor>[]>(
    () => [
      { accessorKey: "name", header: "Vereador", cell: ({ row }) => <div className="flex items-center gap-3"><PersonAvatar name={row.original.name} size="sm" /><div><div className="font-semibold text-ink">{row.original.name}</div><div className="text-xs text-ink-3">{row.original.role}</div></div></div> },
      { accessorKey: "email", header: "E-mail", cell: ({ getValue }) => <span className="text-ink-2">{String(getValue())}</span> },
      { accessorKey: "eventsCount", header: "Eventos", meta: { align: "right" } },
      { accessorKey: "lastInteractionAt", header: "Última interação", cell: ({ getValue }) => (getValue() ? formatRelativeDay(String(getValue())) : "Nunca") },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="councilor" value={String(getValue())} size="sm" /> },
    ],
    [],
  )

  if (chamber.isError) return <div className="card"><ErrorState title="Câmara não encontrada" /></div>
  const c = chamber.data
  if (!c) return <Skeleton className="h-[520px] w-full rounded-xl" />

  return (
    <div className="space-y-6">
      <ProfileHeader
        avatar={<span className="flex size-[88px] items-center justify-center rounded-2xl bg-white text-navy-900 shadow-raised ring-4 ring-white"><Landmark className="size-10" strokeWidth={1.6} /></span>}
        eyebrow={<StatusBadge domain="chamber" value={c.status} size="sm" />}
        title={c.name}
        subtitle={`${c.municipalityName} — RS · Região ${c.regionName}`}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{c.phone}</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{c.email}</span>
            <span className="inline-flex items-center gap-1.5"><Globe className="size-3.5" />{c.website}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => toast.success("Solicitação enviada", { description: `${c.adminContact} receberá o link do Portal da Câmara.` })}><RefreshCw />Solicitar atualização</Button>
            <Button asChild><Link href="/portal-camara" target="_blank">Ver portal da Câmara</Link></Button>
          </>
        }
        stats={[
          { label: "Vereadores", value: c.councilorsCount },
          { label: "Participantes no ano", value: formatNumber(c.participantsYear) },
          { label: "Eventos", value: c.eventsCount },
          { label: "Certificados", value: c.certificatesCount },
          { label: "Qualidade cadastral", value: `${c.dataQuality}%` },
        ]}
      />

      <Tabs defaultValue="visao">
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="vereadores">Vereadores</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Dados institucionais">
              <div className="hairline-divide">
                <DataRow label="Presidente" value={c.presidentId ? <Link className="link" href={`/vereadores/${c.presidentId}`}>{c.president}</Link> : c.president} />
                <DataRow label="Responsável administrativo" value={<span>{c.adminContact}<span className="block text-xs font-normal text-ink-3">{c.adminContactRole}</span></span>} />
                <DataRow label="Telefone" value={c.phone} />
                <DataRow label="E-mail" value={c.email} />
                <DataRow label="Site" value={c.website} />
                <DataRow label="Endereço" value={c.address} />
                <DataRow label="Atualizado" value={formatDate(c.updatedAt)} />
              </div>
            </Panel>
            <Panel title="Mesa e vereadores" description={`${c.councilorsCount} cadeiras`}>
              <ul className="space-y-2">
                {(members.data ?? []).slice(0, 7).map((m) => (
                  <li key={m.id}>
                    <Link href={`/vereadores/${m.id}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-canvas">
                      <PersonAvatar name={m.name} size="sm" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-ink">{m.name}</span><span className="block text-[11.5px] text-ink-3">{m.role}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Atividade recente">
              {activity.data?.length ? <ActivityFeed items={activity.data.slice(0, 6)} showDate /> : <EmptyState compact title="Sem atividade recente" />}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="vereadores">
          <DataTable columns={columns} data={members.data ?? []} loading={members.isLoading} onRowClick={(r) => router.push(`/vereadores/${r.id}`)} entity={["vereador", "vereadores"]} />
        </TabsContent>

        <TabsContent value="eventos">
          <Panel title="Participação em eventos" flush>
            {(events.data ?? []).length === 0 ? (
              <EmptyState title="Nenhuma participação registrada" />
            ) : (
              <ul className="divide-y divide-line-soft border-t border-line-soft">
                {events.data!.map(({ event, participants }) => (
                  <li key={event.id}>
                    <Link href={`/eventos/${event.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-canvas/70">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-ink">{event.title}</div>
                        <div className="text-xs text-ink-3">{formatDateRange(event.startDate, event.endDate)} · {event.city}</div>
                      </div>
                      <span className="text-[13px] text-ink-2"><span className="font-semibold text-ink">{participants}</span> participantes</span>
                      <StatusBadge domain="event" value={event.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="atividades">
          <Panel title="Histórico da Câmara">{activity.data?.length ? <ActivityFeed items={activity.data} showDate /> : <EmptyState compact title="Sem atividades" />}</Panel>
        </TabsContent>

        <TabsContent value="dados">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Panel title="Editar dados da Câmara">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Site"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
                <Field label="Responsável administrativo"><Input value={form.adminContact} onChange={(e) => setForm({ ...form, adminContact: e.target.value })} /></Field>
                <Field label="Endereço" className="sm:col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
              </div>
              <div className="mt-5 flex justify-end"><Button onClick={() => save.mutate()} loading={save.isPending}>Salvar alterações</Button></div>
            </Panel>
            <Panel title="Qualidade cadastral">
              <div className="font-display text-[34px] font-semibold text-ink tnum">{c.dataQuality}%</div>
              <Meter className="mt-3" value={c.dataQuality} tone={c.dataQuality >= 85 ? "success" : "warning"} />
              <ul className="mt-4 space-y-2 text-[13px] text-ink-2">
                <li className="flex items-center gap-2"><User className="size-4 text-ink-3" />Mesa diretora confirmada</li>
                <li className="flex items-center gap-2"><Phone className="size-4 text-ink-3" />Contatos institucionais</li>
                <li className="flex items-center gap-2"><MapPin className="size-4 text-ink-3" />Endereço da sede</li>
              </ul>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
