"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { BarChart3, CheckCheck, CreditCard, HardDrive, Mail, MessageCircle, MessageSquareText, Plug, UserPlus } from "lucide-react"
import { toast } from "sonner"
import type { AuditLog, User, UserRole } from "@/types"
import { auditService, integrationService, notificationService, userService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatDateTime, formatTimeAgo } from "@/lib/format"
import { cn, normalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar"
import { SearchInput } from "@/components/shared/search-input"
import { Field } from "@/components/shared/field"
import { NotificationRow } from "@/components/layout/notification-menu"
import { useCurrentUser } from "@/hooks/use-current-user"

const ROLES: UserRole[] = ["Administrador", "Gestor", "Operador de eventos", "Comunicação", "Leitura"]

/* ------------------------------ Usuários ------------------------------ */
export function UsersView() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: qk.users, queryFn: () => userService.list() })
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", email: "", role: "Operador de eventos" as UserRole, area: "Eventos" })
  const invite = useMutation({
    mutationFn: () => userService.invite(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users })
      toast.success("Convite enviado", { description: form.email })
      setOpen(false)
      setForm({ name: "", email: "", role: "Operador de eventos", area: "Eventos" })
    },
  })
  const role = useMutation({ mutationFn: ({ id, r }: { id: string; r: UserRole }) => userService.updateRole(id, r), onSuccess: () => { qc.invalidateQueries({ queryKey: qk.users }); toast.success("Permissão atualizada") } })

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "name", header: "Usuário", cell: ({ row }) => <div className="flex items-center gap-3"><PersonAvatar name={row.original.name} size="sm" /><div><div className="font-semibold text-ink">{row.original.name}</div><div className="text-xs text-ink-3">{row.original.email}</div></div></div> },
      { accessorKey: "area", header: "Área" },
      {
        accessorKey: "role",
        header: "Papel",
        cell: ({ row }) => (
          <Select value={row.original.role} onValueChange={(r) => role.mutate({ id: row.original.id, r: r as UserRole })}>
            <SelectTrigger size="sm" className="w-[190px]" data-no-row-click><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        ),
      },
      { accessorKey: "lastAccessAt", header: "Último acesso", cell: ({ getValue }) => (getValue() ? formatTimeAgo(String(getValue())) : "—") },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge domain="user" value={String(getValue())} size="sm" /> },
    ],
    [role],
  )

  return (
    <div>
      <PageHeader title="Usuários" description="Equipe com acesso ao UVERGS 360 e seus papéis de permissão." actions={<Button onClick={() => setOpen(true)}><UserPlus />Convidar usuário</Button>} />
      <DataTable columns={columns} data={data ?? []} loading={isLoading} entity={["usuário", "usuários"]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar usuário</DialogTitle><DialogDescription>O convite chega por e-mail com link de acesso.</DialogDescription></DialogHeader>
          <DialogBody className="space-y-4">
            <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@uvergs.org.br" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Papel"><Select value={form.role} onValueChange={(r) => setForm({ ...form, role: r as UserRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Área"><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => (form.name && form.email.includes("@") ? invite.mutate() : toast.error("Preencha nome e e-mail válidos"))} loading={invite.isPending}>Enviar convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------------------------- Integrações ----------------------------- */
const INT_ICON: Record<string, typeof Plug> = { "int-email": Mail, "int-whatsapp": MessageCircle, "int-sms": MessageSquareText, "int-pagamentos": CreditCard, "int-storage": HardDrive, "int-analytics": BarChart3 }

export function IntegrationsView() {
  const { data, isLoading } = useQuery({ queryKey: qk.integrations, queryFn: () => integrationService.list() })
  return (
    <div>
      <PageHeader title="Integrações" description="Conexões com provedores externos de comunicação, pagamento e dados." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[230px] rounded-xl" />)}
        {data?.map((i) => {
          const Icon = INT_ICON[i.id] ?? Plug
          return (
            <div key={i.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-lg bg-canvas text-ink-2"><Icon className="size-5" /></span>
                <StatusBadge domain="integration" value={i.status} size="sm" />
              </div>
              <div className="mt-4 font-display text-[16px] font-semibold text-ink">{i.name}</div>
              <div className="text-xs text-ink-3">{i.category}</div>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-2">{i.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{i.providers.map((p) => <Badge key={p} variant="outline" size="sm">{p}</Badge>)}</div>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => toast.info(`${i.name}`, { description: "A configuração deste provedor será habilitada na próxima etapa." })}>Configurar futuramente</Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------ Auditoria ----------------------------- */
export function AuditView() {
  const { data, isLoading } = useQuery({ queryKey: qk.audit, queryFn: () => auditService.list() })
  const [q, setQ] = React.useState("")
  const [sev, setSev] = React.useState("all")
  const rows = (data ?? []).filter((a) => (sev === "all" || a.severity === sev) && (!q || normalize(`${a.actor} ${a.action} ${a.entityLabel}`).includes(normalize(q))))
  const columns = React.useMemo<ColumnDef<AuditLog>[]>(
    () => [
      { accessorKey: "at", header: "Data e hora", cell: ({ getValue }) => <span className="text-ink-2 tnum">{formatDateTime(String(getValue()))}</span> },
      { accessorKey: "actor", header: "Usuário", cell: ({ row }) => <div><div className="font-medium text-ink">{row.original.actor}</div><div className="text-xs text-ink-3">{row.original.actorRole}</div></div> },
      { accessorKey: "action", header: "Ação", cell: ({ row }) => <div><div className="text-ink">{row.original.action}</div><div className="text-xs text-ink-3">{row.original.entity} · {row.original.entityLabel}</div></div> },
      { accessorKey: "severity", header: "Nível", cell: ({ getValue }) => { const v = String(getValue()); return <Badge size="sm" dot variant={v === "critico" ? "danger" : v === "alerta" ? "warning" : "neutral"}>{v === "critico" ? "Crítico" : v === "alerta" ? "Alerta" : "Info"}</Badge> } },
      { accessorKey: "ip", header: "IP", cell: ({ getValue }) => <span className="font-mono text-xs text-ink-3">{String(getValue())}</span> },
    ],
    [],
  )
  return (
    <div>
      <PageHeader title="Auditoria" description="Registro imutável de ações sensíveis realizadas na plataforma." />
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        entity={["registro", "registros"]}
        toolbar={<FilterBar><SearchInput value={q} onChange={setQ} placeholder="Buscar usuário ou ação…" className="max-w-xs" /><FilterSelect label="Nível" value={sev} onChange={setSev} options={[{ value: "info", label: "Info" }, { value: "alerta", label: "Alerta" }, { value: "critico", label: "Crítico" }]} /></FilterBar>}
      />
    </div>
  )
}

/* ---------------------------- Configurações --------------------------- */
export function SettingsView() {
  const params = useSearchParams()
  const user = useCurrentUser()
  const save = () => toast.success("Configurações salvas")
  return (
    <div>
      <PageHeader title="Configurações" description="Preferências da conta e da organização." />
      <Tabs defaultValue={params.get("aba") ?? "perfil"}>
        <TabsList>
          <TabsTrigger value="perfil">Meu perfil</TabsTrigger>
          <TabsTrigger value="organizacao">Organização</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil">
          <Panel title="Meu perfil" className="max-w-3xl">
            <div className="mb-6 flex items-center gap-4"><PersonAvatar name={user.name || "U"} size="xl" /><div><div className="font-display text-lg font-semibold text-ink">{user.name}</div><div className="text-[13px] text-ink-3">{user.role} · {user.organization}</div></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome"><Input defaultValue={user.name} key={user.name} /></Field>
              <Field label="E-mail"><Input defaultValue={user.email} key={user.email} /></Field>
              <Field label="Telefone"><Input defaultValue="(51) 99230-1180" /></Field>
              <Field label="Cargo"><Input defaultValue="Diretor executivo" /></Field>
            </div>
            <div className="mt-6 flex justify-end"><Button onClick={save}>Salvar</Button></div>
          </Panel>
        </TabsContent>
        <TabsContent value="organizacao">
          <Panel title="Organização" className="max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Razão social"><Input defaultValue="União dos Vereadores do Rio Grande do Sul" /></Field>
              <Field label="Sigla"><Input defaultValue="UVERGS" /></Field>
              <Field label="E-mail institucional"><Input defaultValue="contato@uvergs.org.br" /></Field>
              <Field label="Fuso horário"><Input defaultValue="America/Sao_Paulo (GMT-3)" /></Field>
            </div>
            <div className="mt-5 rounded-lg bg-canvas px-4 py-3 text-[12.5px] text-ink-2">Ambiente: <span className="font-semibold text-ink">Demonstração (Etapa 1)</span> — dados simulados, sem envio real de mensagens ou cobranças.</div>
            <div className="mt-6 flex justify-end"><Button onClick={save}>Salvar</Button></div>
          </Panel>
        </TabsContent>
        <TabsContent value="notificacoes">
          <Panel title="Notificações" className="max-w-3xl">
            <div className="space-y-3">
              {["Novas inscrições", "Pagamentos confirmados", "Campanhas concluídas", "Câmaras que atualizaram dados", "Resumo diário por e-mail"].map((t, i) => (
                <label key={t} className="flex items-center justify-between rounded-lg border border-line-soft px-4 py-3"><span className="text-[13.5px] text-ink">{t}</span><Switch defaultChecked={i !== 4} onCheckedChange={save} /></label>
              ))}
            </div>
          </Panel>
        </TabsContent>
        <TabsContent value="seguranca">
          <Panel title="Segurança" className="max-w-3xl">
            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-lg border border-line-soft px-4 py-3"><span><span className="block text-[13.5px] font-medium text-ink">Verificação em duas etapas</span><span className="text-xs text-ink-3">Código por aplicativo autenticador</span></span><Switch defaultChecked onCheckedChange={save} /></label>
              <label className="flex items-center justify-between rounded-lg border border-line-soft px-4 py-3"><span><span className="block text-[13.5px] font-medium text-ink">Encerrar sessões inativas</span><span className="text-xs text-ink-3">Após 30 minutos sem uso</span></span><Switch defaultChecked onCheckedChange={save} /></label>
              <Button variant="secondary" onClick={() => toast.success("E-mail para redefinição de senha enviado")}>Redefinir senha</Button>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------------------------- Notificações ---------------------------- */
export function NotificationsView() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: qk.notifications, queryFn: () => notificationService.list() })
  const markAll = useMutation({ mutationFn: () => notificationService.markAllRead(), onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }) })
  return (
    <div>
      <PageHeader title="Notificações" description="Alertas e acontecimentos importantes da plataforma." actions={<Button variant="secondary" onClick={() => markAll.mutate()} loading={markAll.isPending}><CheckCheck />Marcar todas como lidas</Button>} />
      <div className="card max-w-3xl p-2">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="m-2 h-14" />)}
        {data?.map((n) => (
          <div key={n.id} className={cn(!n.read && "rounded-md bg-brand-50/40")}>
            <NotificationRow n={n} onClick={() => n.href && router.push(n.href)} />
          </div>
        ))}
      </div>
    </div>
  )
}
