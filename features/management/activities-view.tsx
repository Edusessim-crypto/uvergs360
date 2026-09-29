"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { TimelineKind } from "@/types"
import { dashboardService } from "@/services"
import { qk } from "@/lib/query-keys"
import { normalize } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/states"

const KINDS: { value: TimelineKind; label: string }[] = [
  { value: "inscricao", label: "Inscrições" },
  { value: "pagamento", label: "Pagamentos" },
  { value: "checkin", label: "Check-ins" },
  { value: "certificado", label: "Certificados" },
  { value: "email", label: "E-mails" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "cadastro", label: "Cadastros" },
  { value: "portal", label: "Portal" },
]

export function ActivitiesView() {
  const { data, isLoading } = useQuery({ queryKey: qk.recentActivity(200), queryFn: () => dashboardService.getRecentActivity(200) })
  const [q, setQ] = React.useState("")
  const [kind, setKind] = React.useState("all")
  const rows = (data ?? [])
    .filter((a) => (kind === "all" || a.kind === kind) && (!q || normalize(`${a.subject} ${a.context}`).includes(normalize(q))))
    .map((a) => ({ id: a.id, kind: a.kind, title: a.title, description: a.subject, meta: a.context, at: a.at, href: a.href }))

  return (
    <div>
      <PageHeader title="Atividades" description="Tudo o que acontece no relacionamento com vereadores e Câmaras, em ordem cronológica." />
      <Panel title="Linha do tempo institucional" action={<FilterBar><SearchInput value={q} onChange={setQ} placeholder="Buscar pessoa ou evento…" className="w-56" /><FilterSelect label="Tipo" value={kind} onChange={setKind} options={KINDS} /></FilterBar>}>
        {isLoading ? <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div> : rows.length ? <ActivityTimeline items={rows} /> : <EmptyState title="Nenhuma atividade encontrada" />}
      </Panel>
    </div>
  )
}
