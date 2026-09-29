import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "gold"

const MAP = {
  councilor: {
    ativo: ["Ativo", "success"],
    incompleto: ["Incompleto", "warning"],
    inativo: ["Inativo", "neutral"],
  },
  situation: {
    inscricao_abandonada: ["Inscrição incompleta", "danger"],
    sem_interacao: ["Sem interação recente", "warning"],
    cadastro_incompleto: ["Cadastro incompleto", "warning"],
    portal_nao_ativado: ["Portal não ativado", "brand"],
    nunca_participou: ["Nunca participou", "neutral"],
  },
  chamber: {
    atualizada: ["Atualizada", "success"],
    desatualizada: ["Desatualizada", "danger"],
    pendente: ["Validação pendente", "warning"],
  },
  event: {
    rascunho: ["Rascunho", "neutral"],
    agendado: ["Agendado", "brand"],
    inscricoes_abertas: ["Inscrições abertas", "success"],
    esgotado: ["Esgotado", "gold"],
    em_andamento: ["Acontecendo agora", "brand"],
    encerrado: ["Encerrado", "neutral"],
  },
  registration: {
    confirmada: ["Confirmada", "success"],
    incompleta: ["Incompleta", "warning"],
    cancelada: ["Cancelada", "danger"],
    lista_espera: ["Lista de espera", "neutral"],
  },
  payment: {
    confirmado: ["Confirmado", "success"],
    pendente: ["Pendente", "warning"],
    isento: ["Isento", "neutral"],
    estornado: ["Estornado", "danger"],
  },
  campaign: {
    rascunho: ["Rascunho", "neutral"],
    agendada: ["Agendada", "brand"],
    enviando: ["Enviando", "brand"],
    enviada: ["Enviada", "success"],
    pausada: ["Pausada", "warning"],
  },
  certificate: {
    emitido: ["Emitido", "success"],
    pendente: ["Pendente", "warning"],
    revogado: ["Revogado", "danger"],
  },
  journey: {
    ativa: ["Ativa", "success"],
    pausada: ["Pausada", "warning"],
    rascunho: ["Rascunho", "neutral"],
  },
  user: {
    ativo: ["Ativo", "success"],
    convidado: ["Convite enviado", "brand"],
    suspenso: ["Suspenso", "danger"],
  },
  integration: {
    nao_configurado: ["Não configurado", "neutral"],
    configurado: ["Configurado", "success"],
  },
  task: {
    aberta: ["Aberta", "brand"],
    concluida: ["Concluída", "success"],
  },
} as const satisfies Record<string, Record<string, readonly [string, Tone]>>

export type StatusDomain = keyof typeof MAP

const LIVE = new Set(["em_andamento", "enviando"])

export function statusLabel(domain: StatusDomain, value: string) {
  const entry = (MAP[domain] as Record<string, readonly [string, Tone]>)[value]
  return entry ? entry[0] : value
}

export function StatusBadge({ domain, value, size = "default", className }: { domain: StatusDomain; value: string; size?: "sm" | "default" | "lg"; className?: string }) {
  const entry = (MAP[domain] as Record<string, readonly [string, Tone]>)[value]
  if (!entry) return null
  const [label, tone] = entry
  const live = LIVE.has(value)
  return (
    <Badge variant={tone} size={size} className={className}>
      {live ? (
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
          <span className="relative size-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <span className={cn("size-1.5 rounded-full bg-current", tone === "neutral" ? "opacity-50" : "opacity-80")} aria-hidden />
      )}
      {label}
    </Badge>
  )
}
