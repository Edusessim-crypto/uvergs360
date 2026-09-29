import type { RegionId } from "./territory"

export type CouncilorRole =
  | "Vereador"
  | "Vereadora"
  | "Presidente"
  | "Vice-presidente"
  | "1º Secretário"
  | "2º Secretário"

export type CouncilorStatus = "ativo" | "incompleto" | "inativo"

export type RadarSituation =
  | "inscricao_abandonada"
  | "sem_interacao"
  | "cadastro_incompleto"
  | "portal_nao_ativado"
  | "nunca_participou"

export type ParticipationLevel = "alta" | "media" | "baixa" | "nenhuma"

export interface Councilor {
  id: string
  name: string
  gender: "M" | "F"
  cpf: string
  email: string
  emailValid: boolean
  phone: string
  role: CouncilorRole
  mandate: string
  municipalityId: string
  municipalityName: string
  regionId: RegionId
  regionName: string
  chamberId: string
  chamberName: string
  status: CouncilorStatus
  portalActive: boolean
  profileComplete: boolean
  situation: RadarSituation | null
  situationDetail?: string
  priorityScore: number
  lastInteractionAt: string | null
  eventsCount: number
  certificatesCount: number
  participationsYear: number
  participation: ParticipationLevel
  engagementScore: number
  interests: string[]
  preferredChannel: "E-mail" | "WhatsApp" | "Telefone"
  birthDate: string
  firstTerm: boolean
  createdAt: string
  isDemoFeatured?: boolean
}

export interface CouncilorInput {
  name: string
  cpf: string
  email: string
  phone: string
  municipalityId: string
  chamberId: string
  role: CouncilorRole
  mandate: string
}

export type TimelineKind =
  | "inscricao"
  | "checkin"
  | "certificado"
  | "email"
  | "whatsapp"
  | "cadastro"
  | "pagamento"
  | "interacao"
  | "tarefa"
  | "avaliacao"
  | "portal"

export interface TimelineItem {
  id: string
  kind: TimelineKind
  title: string
  description?: string
  meta?: string
  at: string
  actor?: string
  href?: string
}

export type TaskStatus = "aberta" | "concluida"
export type TaskPriority = "alta" | "media" | "baixa"

export interface Task {
  id: string
  title: string
  assignee: string
  dueAt: string
  status: TaskStatus
  priority: TaskPriority
  councilorId?: string
  councilorName?: string
}

export type UserRole = "Administrador" | "Gestor" | "Operador de eventos" | "Comunicação" | "Leitura"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: "ativo" | "convidado" | "suspenso"
  lastAccessAt: string | null
  area: string
}
