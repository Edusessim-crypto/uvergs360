/**
 * "Banco" em memória da demonstração.
 *
 * ⚠️ DADOS DE DEMONSTRAÇÃO — este módulo existe apenas na Etapa 1.
 * Os serviços em /services são os únicos consumidores; na Etapa 2 eles
 * passarão a chamar a API real e este arquivo poderá ser removido.
 *
 * O banco é construído sob demanda uma única vez por sessão do navegador.
 * Mutações (novo vereador, check-in, campanha criada) ficam em memória até
 * o recarregamento da página.
 */
import type {
  ActivityItem,
  AuditLog,
  Campaign,
  Certificate,
  Chamber,
  CheckInEntry,
  Councilor,
  Evaluation,
  Goal,
  Integration,
  Journey,
  MonthlyPoint,
  Municipality,
  Notification,
  Registration,
  Segment,
  Task,
  TimelineItem,
  User,
  UvergsEvent,
} from "@/types"
import { buildMunicipalities } from "./territory"
import { buildPeople } from "./people"
import { buildEvents } from "./events"
import { buildCertificates, buildEvaluations, buildRegistrations } from "./registrations"
import { buildRecentActivity, buildTasks } from "./activity"
import { buildCampaigns, buildJourneys, buildNotifications, buildSegments } from "./communication"
import { buildAuditLogs, buildGoals, buildIntegrations, buildMonthlySeries, buildUsers } from "./admin"

export { DEMO_DATA } from "./_clock"

export interface MockDatabase {
  municipalities: Municipality[]
  chambers: Chamber[]
  councilors: Councilor[]
  events: UvergsEvent[]
  registrations: Registration[]
  certificates: Certificate[]
  evaluations: Evaluation[]
  activity: ActivityItem[]
  tasks: Task[]
  campaigns: Campaign[]
  journeys: Journey[]
  segments: Segment[]
  notifications: Notification[]
  users: User[]
  integrations: Integration[]
  audit: AuditLog[]
  goals: Goal[]
  monthly: MonthlyPoint[]
  /** Interações registradas manualmente nesta sessão, por vereador. */
  manualTimeline: Record<string, TimelineItem[]>
  /** Check-ins feitos nesta sessão (mais recentes primeiro). */
  sessionCheckIns: CheckInEntry[]
}

let database: MockDatabase | null = null

export function getDb(): MockDatabase {
  if (database) return database
  const municipalities = buildMunicipalities()
  const { chambers, councilors } = buildPeople(municipalities)
  const events = buildEvents()
  const registrations = buildRegistrations(events, councilors)
  const certificates = buildCertificates(events, registrations, councilors)
  const evaluations = buildEvaluations(events, registrations)

  database = {
    municipalities,
    chambers,
    councilors,
    events,
    registrations,
    certificates,
    evaluations,
    activity: buildRecentActivity(councilors, events),
    tasks: buildTasks(councilors),
    campaigns: buildCampaigns(),
    journeys: buildJourneys(),
    segments: buildSegments(),
    notifications: buildNotifications(),
    users: buildUsers(),
    integrations: buildIntegrations(),
    audit: buildAuditLogs(),
    goals: buildGoals(),
    monthly: buildMonthlySeries(),
    manualTimeline: {},
    sessionCheckIns: [],
  }
  return database
}
