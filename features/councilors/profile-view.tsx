"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Download,
  Handshake,
  Landmark,
  ListChecks,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Smartphone,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"
import type { TimelineKind } from "@/types"
import { councilorService, chamberService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDate, formatDateRange, formatMaskedCpf, formatRelativeDay, formatShortDate } from "./profile-format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProfileHeader } from "@/components/shared/profile-header"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { Panel, DataRow } from "@/components/shared/panel"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { StatusBadge } from "@/components/shared/status-badge"
import { Ring } from "@/components/shared/meter"
import { EmptyState, ErrorState } from "@/components/shared/states"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { useBreadcrumbLabel } from "@/components/layout/shell-context"
import { CertificateDialog } from "@/features/certificates/certificate-dialog"
import { SendMessageDialog, RegisterInteractionDialog, CreateTaskDialog } from "./profile-dialogs"
import { CouncilorFormDrawer } from "./councilor-form"
import type { Certificate } from "@/types"

const FILTERS: { value: string; label: string; kinds: TimelineKind[] | null }[] = [
  { value: "todos", label: "Tudo", kinds: null },
  { value: "eventos", label: "Eventos", kinds: ["inscricao", "checkin", "pagamento", "avaliacao"] },
  { value: "comunicacoes", label: "Comunicações", kinds: ["email", "whatsapp"] },
  { value: "certificados", label: "Certificados", kinds: ["certificado"] },
  { value: "relacionamento", label: "Relacionamento", kinds: ["interacao", "tarefa", "cadastro", "portal"] },
]

export function ProfileView({ id }: { id: string }) {
  const qc = useQueryClient()
  const councilor = useQuery({ queryKey: qk.councilor(id), queryFn: () => councilorService.getById(id) })
  const timeline = useQuery({ queryKey: qk.councilorTimeline(id), queryFn: () => councilorService.getTimeline(id) })
  const tasks = useQuery({ queryKey: qk.councilorTasks(id), queryFn: () => councilorService.getTasks(id) })
  const regs = useQuery({ queryKey: qk.councilorRegistrations(id), queryFn: () => councilorService.getRegistrations(id) })
  const certs = useQuery({ queryKey: qk.councilorCertificates(id), queryFn: () => councilorService.getCertificates(id) })
  const comms = useQuery({ queryKey: qk.councilorCommunications(id), queryFn: () => councilorService.getCommunications(id) })
  const chamberId = councilor.data?.chamberId
  const chamber = useQuery({ queryKey: qk.chamber(chamberId ?? ""), queryFn: () => chamberService.getById(chamberId!), enabled: !!chamberId })

  const [dialog, setDialog] = React.useState<"msg" | "int" | "task" | "edit" | null>(null)
  const [filter, setFilter] = React.useState("todos")
  const [cert, setCert] = React.useState<Certificate | null>(null)
  useBreadcrumbLabel(councilor.data?.name)

  const toggleTask = useMutation({
    mutationFn: (taskId: string) => councilorService.toggleTask(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.councilorTasks(id) }),
  })
  const savePrefs = useMutation({
    mutationFn: (patch: Parameters<typeof councilorService.update>[1]) => councilorService.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.councilor(id) })
      toast.success("Preferências atualizadas")
    },
  })

  if (councilor.isError) return <div className="card"><ErrorState title="Vereador não encontrado" description="O registro pode ter sido removido." /></div>
  const c = councilor.data
  if (!c) return <ProfileSkeleton />

  const filterKinds = FILTERS.find((f) => f.value === filter)?.kinds
  const items = (timeline.data ?? []).filter((t) => !filterKinds || filterKinds.includes(t.kind))
  const openTasks = (tasks.data ?? []).filter((t) => t.status === "aberta").length
  const engagementLabel = c.engagementScore >= 75 ? "Alto" : c.engagementScore >= 45 ? "Moderado" : "Baixo"
  const issuedCerts = (certs.data ?? []).filter((x) => x.status === "emitido")

  return (
    <div className="space-y-6">
      <ProfileHeader
        avatar={<PersonAvatar name={c.name} size="2xl" ring className="shadow-raised" />}
        eyebrow={
          <>
            <Badge variant="navy" size="sm">{c.role}</Badge>
            <span className="text-[12.5px] text-ink-3">Mandato {c.mandate}{c.firstTerm ? " · 1º mandato" : ""}</span>
          </>
        }
        title={c.name}
        subtitle={
          <Link href={`/camaras/${c.chamberId}`} className="font-medium text-ink-2 hover:text-brand-600">
            {c.chamberName}
          </Link>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{c.municipalityName} — RS · {c.regionName}</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{c.email}</span>
            <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{c.phone}</span>
          </>
        }
        tags={
          <>
            {c.profileComplete ? (
              <Badge variant="success"><BadgeCheck />Cadastro completo</Badge>
            ) : (
              <Badge variant="warning"><TriangleAlert />Cadastro incompleto</Badge>
            )}
            {c.portalActive ? <Badge variant="brand"><Smartphone />Portal ativo</Badge> : <Badge variant="neutral"><Smartphone />Portal não ativado</Badge>}
            {c.situation && <StatusBadge domain="situation" value={c.situation} />}
          </>
        }
        actions={
          <>
            <Button onClick={() => setDialog("msg")}><Mail />Enviar mensagem</Button>
            <Button variant="secondary" onClick={() => setDialog("int")}><Handshake />Registrar interação</Button>
            <Button variant="secondary" onClick={() => setDialog("task")}><ListChecks />Criar tarefa</Button>
            <Button variant="secondary" onClick={() => setDialog("edit")}><Pencil />Editar</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Mais ações"><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => toast.success("Convite do portal reenviado", { description: c.email })}><Smartphone />Reenviar convite do portal</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast.success("Ficha 360º exportada", { description: "PDF gerado com o histórico completo." })}><Download />Exportar ficha 360º</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        stats={[
          { label: "Última interação", value: c.lastInteractionAt ? formatRelativeDay(c.lastInteractionAt) : "Nunca" },
          { label: "Eventos", value: c.eventsCount, hint: "no histórico" },
          { label: "Certificados", value: c.certificatesCount },
          { label: "Interesses", value: c.interests.length },
          { label: "Participações no ano", value: c.participationsYear },
        ]}
      />

      <Tabs defaultValue="visao">
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="comunicacoes">Comunicações</TabsTrigger>
          <TabsTrigger value="interesses">Interesses</TabsTrigger>
          <TabsTrigger value="dados">Dados cadastrais</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <Panel
              title="Linha do tempo do relacionamento"
              description={`${timeline.data?.length ?? "—"} registros · da primeira interação até hoje`}
              action={<SegmentedControl size="sm" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f.value, label: f.label }))} className="hidden md:inline-flex" />}
            >
              {timeline.isLoading ? (
                <div className="space-y-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : items.length ? (
                <ActivityTimeline items={items} />
              ) : (
                <EmptyState compact title="Nenhum registro neste filtro" />
              )}
            </Panel>

            <div className="space-y-6">
              <Panel title="Engajamento" description="Índice calculado pela participação, recência e canais">
                <div className="flex items-center gap-5">
                  <Ring value={c.engagementScore} size={84} stroke={7} tone={c.engagementScore >= 75 ? "success" : "brand"}>
                    <div className="text-center">
                      <div className="font-display text-[22px] leading-none font-semibold text-ink tnum">{c.engagementScore}</div>
                      <div className="text-[10px] text-ink-3">de 100</div>
                    </div>
                  </Ring>
                  <div className="min-w-0 space-y-1.5 text-[13px]">
                    <div className="font-semibold text-ink">Engajamento {engagementLabel.toLowerCase()}</div>
                    <div className="text-ink-2">Participa de {c.participation === "alta" ? "quase todos" : c.participation === "media" ? "boa parte" : "poucos"} dos eventos da região.</div>
                    <div className="text-ink-3">Canal preferido: <span className="font-medium text-ink">{c.preferredChannel}</span></div>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Tarefas"
                description={`${openTasks} em aberto`}
                action={<Button size="xs" variant="ghost" onClick={() => setDialog("task")}>Nova</Button>}
              >
                {(tasks.data ?? []).length === 0 ? (
                  <p className="text-[13px] text-ink-3">Nenhuma tarefa vinculada.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {tasks.data!.map((t) => (
                      <li key={t.id} className="flex items-start gap-3">
                        <Checkbox className="mt-0.5" checked={t.status === "concluida"} onCheckedChange={() => toggleTask.mutate(t.id)} />
                        <div className="min-w-0 flex-1">
                          <div className={cn("text-[13px] leading-snug font-medium", t.status === "concluida" ? "text-ink-3 line-through" : "text-ink")}>{t.title}</div>
                          <div className="text-[11.5px] text-ink-3">{t.assignee} · até {formatShortDate(t.dueAt)}</div>
                        </div>
                        {t.priority === "alta" && t.status === "aberta" && <Badge variant="danger" size="sm">Alta</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Interesses">
                <div className="flex flex-wrap gap-2">
                  {c.interests.length ? c.interests.map((i) => <Badge key={i} variant="outline" size="lg">{i}</Badge>) : <span className="text-[13px] text-ink-3">Nenhum interesse informado.</span>}
                </div>
              </Panel>

              <Panel title="Câmara" action={<Button size="xs" variant="ghost" asChild><Link href={`/camaras/${c.chamberId}`}>Abrir</Link></Button>}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink-2"><Landmark className="size-5" /></span>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-ink">{c.chamberName}</div>
                    <div className="text-xs text-ink-3">{chamber.data ? `${chamber.data.councilorsCount} vereadores · Presidente ${chamber.data.president}` : "—"}</div>
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="atividades">
          <Panel title="Todas as atividades" action={<Button size="sm" variant="secondary" onClick={() => setDialog("int")}><Handshake />Registrar interação</Button>}>
            {items.length ? <ActivityTimeline items={timeline.data ?? []} /> : <EmptyState compact title="Sem atividades" />}
          </Panel>
        </TabsContent>

        <TabsContent value="eventos">
          <Panel title="Participação em eventos" description="Inscrições, pagamento e presença" flush>
            {(regs.data ?? []).length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nenhuma inscrição registrada" description="Quando o vereador se inscrever em um evento, ele aparece aqui." />
            ) : (
              <ul className="divide-y divide-line-soft border-t border-line-soft">
                {regs.data!.map((r) => (
                  <li key={r.id}>
                    <Link href={`/eventos/${r.eventId}`} className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-canvas/70">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><CalendarDays className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink">{r.eventTitle}</div>
                        <div className="text-xs text-ink-3">Inscrição em {formatDate(r.createdAt)} · código {r.code} · via {r.origin}</div>
                      </div>
                      <StatusBadge domain="registration" value={r.status} size="sm" />
                      <StatusBadge domain="payment" value={r.paymentStatus} size="sm" />
                      <span className="w-28 text-right text-[12.5px] text-ink-2">{r.checkedInAt ? `Presente ${formatShortDate(r.checkedInAt)}` : "—"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="certificados">
          {issuedCerts.length === 0 ? (
            <div className="card"><EmptyState icon={Award} title="Nenhum certificado emitido" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {issuedCerts.map((x) => (
                <button key={x.id} onClick={() => setCert(x)} className="card group/c p-5 text-left transition-all hover:-translate-y-px hover:border-gold-100 hover:shadow-raised">
                  <div className="flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-gold-50 text-gold-700"><Award className="size-5" /></span>
                    <span className="text-xs font-medium text-ink-3">{x.workload}h</span>
                  </div>
                  <div className="mt-4 font-display text-[15px] leading-snug font-semibold text-ink">{x.eventTitle}</div>
                  <div className="mt-1 text-xs text-ink-3">{formatDateRange(x.eventDate)} · {x.city}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3 text-xs">
                    <span className="font-mono text-ink-2">{x.code}</span>
                    <span className="font-semibold text-brand-600 group-hover/c:underline">Visualizar</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comunicacoes">
          <Panel title="Comunicações recebidas" description="Campanhas e mensagens individuais" flush>
            <ul className="divide-y divide-line-soft border-t border-line-soft">
              {(comms.data ?? []).map((m) => (
                <li key={m.id} className="flex items-center gap-4 px-6 py-3.5">
                  <span className={cn("flex size-9 items-center justify-center rounded-lg", m.channel === "whatsapp" ? "bg-[#e7f4f1] text-[#0f7a63]" : "bg-[#f1ebfb] text-[#6b3fc0]")}>
                    {m.channel === "whatsapp" ? <MessageCircle className="size-4" /> : <Mail className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-ink">{m.campaignName}</div>
                    <div className="text-xs text-ink-3">{m.channel === "whatsapp" ? "WhatsApp" : m.channel === "sms" ? "SMS" : "E-mail"} · {formatDate(m.sentAt)}</div>
                  </div>
                  <Badge variant={m.status === "clicado" || m.status === "respondido" ? "success" : m.status === "aberto" ? "brand" : "neutral"} size="sm" dot>
                    {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="interesses">
          <Panel title="Áreas de interesse" description="Usadas para personalizar convites e segmentos">
            <InterestsEditor selected={c.interests} onSave={(interests) => savePrefs.mutate({ interests })} saving={savePrefs.isPending} />
          </Panel>
        </TabsContent>

        <TabsContent value="dados">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Dados pessoais" action={<Button size="xs" variant="ghost" onClick={() => setDialog("edit")}><Pencil />Editar</Button>}>
              <div className="hairline-divide">
                <DataRow label="Nome" value={c.name} />
                <DataRow label="CPF" value={formatMaskedCpf(c.cpf)} />
                <DataRow label="E-mail" value={<span className={cn(!c.emailValid && "text-danger-700")}>{c.email}{!c.emailValid && " (inválido)"}</span>} />
                <DataRow label="Telefone" value={c.phone} />
                <DataRow label="Cadastrado em" value={formatDate(c.createdAt)} />
              </div>
            </Panel>
            <Panel title="Vínculo institucional">
              <div className="hairline-divide">
                <DataRow label="Câmara" value={c.chamberName} />
                <DataRow label="Município" value={`${c.municipalityName} — RS`} />
                <DataRow label="Região" value={c.regionName} />
                <DataRow label="Cargo" value={c.role} />
                <DataRow label="Mandato" value={c.mandate} />
              </div>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="preferencias">
          <Panel title="Preferências de contato" description="Respeitadas por campanhas e jornadas automáticas">
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-[13px] font-medium text-ink">Canal preferido</div>
                <SegmentedControl
                  value={c.preferredChannel}
                  onChange={(v) => savePrefs.mutate({ preferredChannel: v })}
                  options={[{ value: "WhatsApp", label: "WhatsApp" }, { value: "E-mail", label: "E-mail" }, { value: "Telefone", label: "Telefone" }]}
                />
              </div>
              {[
                ["Convites de eventos", "Receber convites de eventos da região e estaduais", true],
                ["Boletim mensal", "Resumo institucional da UVERGS", true],
                ["Lembretes de evento", "D-7 e D-1 antes dos eventos inscritos", true],
                ["Pesquisas de satisfação", "Após eventos com presença confirmada", c.participationsYear > 0],
              ].map(([title, desc, on]) => (
                <label key={String(title)} className="flex items-center justify-between gap-4 rounded-lg border border-line-soft px-4 py-3">
                  <span>
                    <span className="block text-[13.5px] font-medium text-ink">{title}</span>
                    <span className="block text-xs text-ink-3">{desc}</span>
                  </span>
                  <Switch defaultChecked={Boolean(on)} onCheckedChange={() => toast.success("Preferência salva")} />
                </label>
              ))}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>

      <SendMessageDialog councilor={c} open={dialog === "msg"} onOpenChange={(v) => setDialog(v ? "msg" : null)} />
      <RegisterInteractionDialog councilor={c} open={dialog === "int"} onOpenChange={(v) => setDialog(v ? "int" : null)} />
      <CreateTaskDialog councilor={c} open={dialog === "task"} onOpenChange={(v) => setDialog(v ? "task" : null)} />
      <CouncilorFormDrawer councilor={c} open={dialog === "edit"} onOpenChange={(v) => setDialog(v ? "edit" : null)} />
      <CertificateDialog certificate={cert} onOpenChange={(v) => !v && setCert(null)} />
    </div>
  )
}

import { INTEREST_OPTIONS } from "./profile-format"

function InterestsEditor({ selected, onSave, saving }: { selected: string[]; onSave: (v: string[]) => void; saving: boolean }) {
  const [value, setValue] = React.useState(selected)
  React.useEffect(() => setValue(selected), [selected])
  const dirty = value.join() !== selected.join()
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((i) => {
          const on = value.includes(i)
          return (
            <button
              key={i}
              onClick={() => setValue(on ? value.filter((v) => v !== i) : [...value, i])}
              className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-2 hover:bg-canvas")}
            >
              {i}
            </button>
          )
        })}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => onSave(value)} disabled={!dirty} loading={saving}>Salvar interesses</Button>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    </div>
  )
}
