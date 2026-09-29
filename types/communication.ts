export type CampaignChannel = "email" | "whatsapp" | "sms"
export type CampaignStatus = "rascunho" | "agendada" | "enviando" | "enviada" | "pausada"

export interface Campaign {
  id: string
  name: string
  channel: CampaignChannel
  status: CampaignStatus
  recipients: number
  delivered: number
  openRate: number | null
  clickRate: number | null
  conversions: number | null
  conversionLabel: string
  segmentName: string
  subject: string
  preheader: string
  body: string
  ctaLabel: string
  eventId?: string
  sentAt: string | null
  scheduledAt: string | null
  createdAt: string
  owner: string
}

export interface CampaignInput {
  name: string
  objective: string
  eventId?: string
  segmentId: string
  segmentName: string
  recipients: number
  channel: CampaignChannel
  subject: string
  preheader: string
  body: string
  ctaLabel: string
  sendMode: "agora" | "agendar"
  scheduledAt?: string
}

export type JourneyStatus = "ativa" | "pausada" | "rascunho"

export type JourneyNodeKind = "gatilho" | "espera" | "condicao" | "acao" | "fim"

export interface JourneyNode {
  id: string
  kind: JourneyNodeKind
  title: string
  detail: string
  channel?: CampaignChannel
  stats?: { label: string; value: string }
  branches?: { label: string; nodes: JourneyNode[] }[]
}

export interface Journey {
  id: string
  name: string
  description: string
  status: JourneyStatus
  trigger: string
  enrolled: number
  inProgress: number
  completed: number
  conversionRate: number
  conversionLabel: string
  updatedAt: string
  nodes: JourneyNode[]
}

export type SegmentField =
  | "municipio"
  | "regiao"
  | "camara"
  | "cargo"
  | "participou_evento"
  | "evento"
  | "interesse"
  | "situacao_cadastral"
  | "portal"
  | "primeiro_mandato"

export type SegmentOperator = "e" | "nao_e"

export interface SegmentRule {
  id: string
  field: SegmentField
  operator: SegmentOperator
  value: string
}

export interface Segment {
  id: string
  name: string
  description: string
  count: number
  rules: SegmentRule[]
  updatedAt: string
  kind: "dinamico" | "estatico"
  trend: number
  usedInCampaigns: number
}

export interface Notification {
  id: string
  kind: "inscricao" | "pagamento" | "campanha" | "camara" | "certificado" | "sistema" | "tarefa"
  title: string
  description: string
  at: string
  read: boolean
  href?: string
}
