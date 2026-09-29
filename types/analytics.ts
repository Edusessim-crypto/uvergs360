import type { TimelineKind } from "./people"

export type Period = "30d" | "90d" | "ano"

export interface KpiValue {
  value: number
  total?: number
  delta: number
  deltaLabel: string
  trend?: number[]
}

export interface DashboardOverview {
  councilors: KpiValue
  chambers: KpiValue
  municipalities: KpiValue
  participations: KpiValue
  events: KpiValue
  attendanceRate: KpiValue
}

export interface PriorityItem {
  id: string
  count: number
  label: string
  description: string
  severity: "alta" | "media" | "baixa"
  href: string
}

export interface ActivityItem {
  id: string
  kind: TimelineKind
  title: string
  subject: string
  context?: string
  at: string
  href?: string
}

export interface MonthlyPoint {
  month: string
  registrations: number
  attendance: number
}

export interface HealthIndicator {
  label: string
  value: number
  hint: string
}

export interface Goal {
  id: string
  label: string
  description: string
  target: number
  actual: number
  unit: "número" | "percentual"
  category: "Participação" | "Eventos" | "Território" | "Relacionamento" | "Comunicação"
  quarterly: { quarter: string; target: number; actual: number | null }[]
}

export interface ReportDefinition {
  id: string
  title: string
  description: string
  category: string
  updatedAt: string
  highlights: { label: string; value: string }[]
  series: { label: string; value: number }[]
  rows: { label: string; values: (string | number)[] }[]
  columns: string[]
}

export interface Integration {
  id: string
  name: string
  category: string
  description: string
  providers: string[]
  status: "nao_configurado" | "configurado"
  capabilities: string[]
}

export interface AuditLog {
  id: string
  actor: string
  actorRole: string
  action: string
  entity: string
  entityLabel: string
  at: string
  ip: string
  severity: "info" | "alerta" | "critico"
}

export interface SearchResult {
  id: string
  group: "Municípios" | "Câmaras" | "Vereadores" | "Eventos" | "Certificados"
  title: string
  subtitle: string
  href: string
}
