import type { RegionId } from "./territory"

export type EventStatus =
  | "rascunho"
  | "agendado"
  | "inscricoes_abertas"
  | "esgotado"
  | "em_andamento"
  | "encerrado"

export type EventFormat = "Presencial" | "Online" | "Híbrido"

export type EventType =
  | "Seminário"
  | "Congresso"
  | "Encontro Regional"
  | "Curso"
  | "Webinar"
  | "Fórum"
  | "Capacitação"

export interface EventProgramItem {
  time: string
  title: string
  speaker?: string
  day: number
}

export interface EventSpeaker {
  name: string
  role: string
}

export interface EventFunnelStep {
  label: string
  value: number | null
}

export interface EventOrigin {
  label: string
  value: number
}

export interface UvergsEvent {
  id: string
  slug: string
  title: string
  type: EventType
  format: EventFormat
  startDate: string
  endDate: string | null
  city: string
  regionId: RegionId
  venue: string
  address: string
  capacity: number
  registered: number
  paymentsConfirmed: number
  present: number | null
  chambersCount: number
  municipalitiesCount: number
  certificatesIssued: number
  nps: number | null
  status: EventStatus
  price: number
  priceNonMember: number
  workload: number
  description: string
  audience: string
  highlight?: boolean
  program: EventProgramItem[]
  speakers: EventSpeaker[]
  createdAt: string
}

export interface EventDashboard {
  event: UvergsEvent
  funnel: EventFunnelStep[]
  origins: EventOrigin[]
  registrationsTimeline: { date: string; label: string; total: number; daily: number }[]
  byRegion: { regionId: RegionId; label: string; value: number }[]
  checklist: { label: string; done: boolean; hint?: string }[]
  daysToEvent: number
}

export interface EventInput {
  title: string
  type: EventType
  format: EventFormat
  description: string
  startDate: string
  endDate: string
  city: string
  venue: string
  address: string
  capacity: number
  registrationOpen: string
  registrationClose: string
  price: number
  priceNonMember: number
  workload: number
  certificate: boolean
  publish: "agora" | "agendar" | "rascunho"
}

export type RegistrationStatus = "confirmada" | "incompleta" | "cancelada" | "lista_espera"
export type PaymentStatus = "confirmado" | "pendente" | "isento" | "estornado"

export interface Registration {
  id: string
  code: string
  participantName: string
  councilorId: string | null
  eventId: string
  eventTitle: string
  createdAt: string
  chamberName: string
  municipalityName: string
  role: string
  paymentStatus: PaymentStatus
  status: RegistrationStatus
  amount: number
  origin: string
  checkedInAt: string | null
}

export interface CheckInEntry {
  id: string
  registrationId: string
  name: string
  chamberName: string
  at: string
}

export interface CheckInSession {
  eventId: string
  eventTitle: string
  eventDay: string
  registered: number
  present: number
  recent: CheckInEntry[]
}

export interface ScanResult {
  registration: Registration
  alreadyCheckedIn: boolean
}

export type CertificateStatus = "emitido" | "pendente" | "revogado"

export interface Certificate {
  id: string
  code: string
  participantName: string
  councilorId: string | null
  chamberName: string
  eventId: string
  eventTitle: string
  eventDate: string
  city: string
  workload: number
  issuedAt: string
  status: CertificateStatus
}

export interface Evaluation {
  id: string
  eventId: string
  eventTitle: string
  respondentName: string
  chamberName: string
  score: number
  rating: number
  comment: string
  interests: string[]
  at: string
}

export interface EvaluationSummary {
  nps: number
  responses: number
  averageRating: number
  promoters: number
  passives: number
  detractors: number
  responseRate: number
  distribution: { score: number; count: number }[]
  interests: { label: string; value: number }[]
  byEvent: { eventId: string; eventTitle: string; nps: number; responses: number }[]
}
