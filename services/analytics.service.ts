import type {
  ActivityItem,
  Councilor,
  DashboardOverview,
  HealthIndicator,
  Period,
  PriorityItem,
  RadarSituation,
  ReportDefinition,
  UvergsEvent,
} from "@/types"
import { RADAR_TARGETS } from "@/data/mock/people"
import { REGION_META, REGION_ORDER } from "@/data/mock/territory"
import { EVENT_IDS } from "@/data/mock/events"
import { formatNumber, formatPercent } from "@/lib/format"
import { mockRead, mockWrite } from "./_mock-client"

const PERIOD_DATA: Record<Period, { participations: number; events: number; attendance: number; newCouncilors: number; newChambers: number; deltas: number[] }> = {
  "30d": { participations: 812, events: 5, attendance: 86, newCouncilors: 38, newChambers: 2, deltas: [12.4, 2, 3.1] },
  "90d": { participations: 2146, events: 14, attendance: 84, newCouncilors: 126, newChambers: 5, deltas: [8.7, 3, 1.8] },
  ano: { participations: 6284, events: 42, attendance: 82, newCouncilors: 412, newChambers: 14, deltas: [18.2, 6, 2.4] },
}

const PERIOD_LABEL: Record<Period, string> = { "30d": "vs. 30 dias anteriores", "90d": "vs. trimestre anterior", ano: "vs. ano anterior" }

/**
 * Painel executivo.
 * Etapa 2 → GET /api/dashboard/overview?period=, GET /api/dashboard/priorities,
 * GET /api/activity?limit= (views materializadas / cache de 5 min).
 */
export const dashboardService = {
  getOverview(period: Period) {
    return mockRead((db): DashboardOverview => {
      const p = PERIOD_DATA[period]
      const monthly = db.monthly.map((m) => m.attendance)
      const growth = [4390, 4421, 4460, 4502, 4561, 4598, 4644, 4689, 4712, 4748, 4779, db.councilors.length]
      return {
        councilors: { value: db.councilors.length, delta: p.newCouncilors, deltaLabel: "novos cadastros no período", trend: growth },
        chambers: { value: db.chambers.length, total: db.municipalities.length, delta: p.newChambers, deltaLabel: "novas no período" },
        municipalities: { value: db.municipalities.filter((m) => m.reached).length, total: db.municipalities.length, delta: p.deltas[1], deltaLabel: "novos alcançados" },
        participations: { value: p.participations, delta: p.deltas[0], deltaLabel: PERIOD_LABEL[period], trend: monthly },
        events: { value: p.events, delta: p.deltas[1], deltaLabel: "a mais que o período anterior" },
        attendanceRate: { value: p.attendance, delta: p.deltas[2], deltaLabel: "p.p. " + PERIOD_LABEL[period] },
      }
    })
  },

  getPriorities() {
    return mockRead((db): PriorityItem[] => [
      { id: "p1", count: db.councilors.filter((c) => c.situation === "inscricao_abandonada").length, label: "inscrições incompletas", description: "Iniciadas e não concluídas nos últimos 7 dias", severity: "alta", href: "/radar?situacao=inscricao_abandonada" },
      { id: "p2", count: db.chambers.filter((c) => c.status === "desatualizada").length, label: "Câmaras com cadastro desatualizado", description: "Sem revisão há mais de 6 meses", severity: "media", href: "/camaras?status=desatualizada" },
      { id: "p3", count: db.councilors.filter((c) => !c.emailValid).length, label: "contatos sem e-mail válido", description: "Retornos de e-mail ou endereço inválido", severity: "media", href: "/vereadores?email=invalido" },
      { id: "p4", count: db.councilors.filter((c) => c.situation === "sem_interacao").length, label: "vereadores sem interação recente", description: "Nenhuma interação há mais de 90 dias", severity: "baixa", href: "/radar?situacao=sem_interacao" },
    ])
  },

  getRecentActivity(limit = 8) {
    return mockRead((db): ActivityItem[] => db.activity.filter((a) => a.at <= new Date().toISOString()).slice(0, limit))
  },

  getMonthly() {
    return mockRead((db) => db.monthly)
  },

  getUpcomingEvents(limit = 4) {
    return mockRead((db): UvergsEvent[] =>
      db.events
        .filter((e) => ["em_andamento", "inscricoes_abertas", "agendado", "esgotado"].includes(e.status))
        .sort((a, b) => Number(b.highlight ?? 0) - Number(a.highlight ?? 0) || a.startDate.localeCompare(b.startDate))
        .slice(0, limit)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    )
  },

  getHealth() {
    return mockRead((db): HealthIndicator[] => {
      const n = db.councilors.length
      return [
        { label: "Cadastros completos", value: Math.round((db.councilors.filter((c) => c.profileComplete).length / n) * 100), hint: "CPF, e-mail, telefone e Câmara" },
        { label: "E-mails válidos", value: Math.round((db.councilors.filter((c) => c.emailValid).length / n) * 1000) / 10, hint: "Sem retorno nos últimos envios" },
        { label: "Portal ativado", value: Math.round((db.councilors.filter((c) => c.portalActive).length / n) * 100), hint: "Acesso ao Meu UVERGS" },
        { label: "Câmaras atualizadas", value: Math.round((db.chambers.filter((c) => c.status === "atualizada").length / db.chambers.length) * 100), hint: "Revisadas nos últimos 6 meses" },
      ]
    })
  },
}

export interface RadarSignal {
  id: RadarSituation
  label: string
  count: number
  urgency: "alta" | "media" | "baixa"
  weekDelta: number
  action: string
  description: string
}

export interface RadarRecommendation {
  id: string
  title: string
  description: string
  impact: string
  cta: string
  href?: string
  kind: "campanha" | "lote" | "mapa" | "tarefa"
}

/**
 * Radar UVERGS.
 * Etapa 2 → GET /api/radar/signals, GET /api/radar/opportunities
 * (regras de negócio executadas por job diário + score de prioridade).
 */
export const radarService = {
  getSignals() {
    return mockRead((db): RadarSignal[] => {
      const count = (s: RadarSituation) => db.councilors.filter((c) => c.situation === s).length
      return [
        { id: "inscricao_abandonada", label: "Inscrições abandonadas", count: count("inscricao_abandonada"), urgency: "alta", weekDelta: 6, action: "Retomar contato", description: "Pararam a inscrição antes do pagamento" },
        { id: "sem_interacao", label: "Sem interação recente", count: count("sem_interacao"), urgency: "alta", weekDelta: 4, action: "Reengajar", description: "Mais de 90 dias sem abrir ou participar" },
        { id: "cadastro_incompleto", label: "Cadastro incompleto", count: count("cadastro_incompleto"), urgency: "media", weekDelta: -3, action: "Atualizar cadastro", description: "E-mail inválido ou dados pendentes" },
        { id: "portal_nao_ativado", label: "Portal não ativado", count: count("portal_nao_ativado"), urgency: "media", weekDelta: -9, action: "Reenviar convite", description: "Convite enviado e acesso não realizado" },
        { id: "nunca_participou", label: "Nunca participou", count: count("nunca_participou"), urgency: "baixa", weekDelta: -12, action: "Convidar para evento", description: "Nenhuma participação no mandato" },
      ]
    })
  },

  getOpportunities() {
    return mockRead((db): Councilor[] => db.councilors.filter((c) => c.situation).sort((a, b) => b.priorityScore - a.priorityScore))
  },

  getRecommendations() {
    return mockRead((db): RadarRecommendation[] => {
      const semInteracao = db.councilors.filter((c) => c.situation === "sem_interacao")
      const byRegion = new Map<string, number>()
      semInteracao.forEach((c) => byRegion.set(c.regionId, (byRegion.get(c.regionId) ?? 0) + 1))
      const [topRegion, topCount] = [...byRegion.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["serra", 0]
      const share = Math.round((topCount / Math.max(1, semInteracao.length)) * 100)
      const seminario = db.events.find((e) => e.id === EVENT_IDS.seminario)!
      const daysLeft = Math.max(1, Math.round((new Date(seminario.startDate).getTime() - Date.now()) / 86_400_000) - 7)
      const abandoned = db.councilors.filter((c) => c.situation === "inscricao_abandonada").length
      const portal = db.councilors.filter((c) => c.situation === "portal_nao_ativado").length
      const never = db.councilors.filter((c) => c.situation === "nunca_participou" && c.firstTerm).length
      return [
        { id: "r1", kind: "campanha", title: `Retomar ${abandoned} inscrições abandonadas`, description: `As inscrições do Seminário encerram em ${daysLeft} dias. Uma sequência de e-mail + WhatsApp recupera em média 31% das inscrições.`, impact: `+${Math.round(abandoned * 0.31)} inscrições estimadas`, cta: "Criar campanha", href: "/campanhas/nova?segmento=inscricoes-abandonadas" },
        { id: "r2", kind: "mapa", title: `${REGION_META[topRegion as keyof typeof REGION_META].shortName} concentra ${share}% dos vereadores sem interação`, description: `${topCount} vereadores da região não interagem há mais de 90 dias. O Encontro Regional é a melhor oportunidade de reaproximação.`, impact: "Ação regional recomendada", cta: "Ver no mapa", href: `/territorio?regiao=${topRegion}` },
        { id: "r3", kind: "lote", title: `Reenviar convite do portal para ${portal} vereadores`, description: "Vereadores com portal ativo participam 2,3× mais de eventos. O convite por WhatsApp tem a melhor taxa de ativação.", impact: `+${Math.round(portal * 0.4)} ativações estimadas`, cta: "Enviar convites" },
        { id: "r4", kind: "tarefa", title: `${never} vereadores de primeiro mandato nunca participaram`, description: "Sugestão: convite personalizado para a Capacitação de Novos Vereadores e para o curso de Orçamento Público.", impact: "Público prioritário", cta: "Criar segmento", href: "/segmentos?novo=1" },
      ]
    })
  },

  getRegionDistribution() {
    return mockRead((db) =>
      REGION_ORDER.map((id) => ({
        regionId: id,
        label: REGION_META[id].shortName,
        value: db.councilors.filter((c) => c.regionId === id && c.situation && c.situation !== "nunca_participou").length,
      })).sort((a, b) => b.value - a.value),
    )
  },

  targets: RADAR_TARGETS,
}

/**
 * Metas & Impacto e Relatórios.
 * Etapa 2 → GET /api/goals, PUT /api/goals/:id, GET /api/reports/:id,
 * POST /api/reports/:id/export (geração assíncrona de PDF/XLSX).
 */
export const goalService = {
  list() {
    return mockRead((db) => db.goals)
  },
}

export const reportService = {
  list() {
    return mockRead((db): ReportDefinition[] => {
      const regions = REGION_ORDER.map((id) => {
        const ms = db.municipalities.filter((m) => m.regionId === id)
        return { id, label: REGION_META[id].shortName, participations: ms.reduce((a, m) => a + m.participations, 0), reached: ms.filter((m) => m.reached).length, total: ms.length }
      })
      const past = db.events.filter((e) => e.status === "encerrado").sort((a, b) => b.startDate.localeCompare(a.startDate))
      const byType = new Map<string, number>()
      past.forEach((e) => byType.set(e.type, (byType.get(e.type) ?? 0) + 1))
      const sentCampaigns = db.campaigns.filter((c) => c.openRate !== null)
      const issued = db.certificates.filter((c) => c.status === "emitido")
      const certsByEvent = new Map<string, number>()
      issued.forEach((c) => certsByEvent.set(c.eventTitle, (certsByEvent.get(c.eventTitle) ?? 0) + 1))
      const chambersByStatus = { atualizada: 0, desatualizada: 0, pendente: 0 }
      db.chambers.forEach((c) => chambersByStatus[c.status]++)
      const updatedAt = new Date().toISOString()

      return [
        {
          id: "eventos", title: "Eventos", category: "Eventos", updatedAt,
          description: "Eventos realizados, público, presença e satisfação.",
          highlights: [{ label: "Realizados", value: formatNumber(past.length) }, { label: "Presentes", value: formatNumber(past.reduce((a, e) => a + (e.present ?? 0), 0)) }, { label: "NPS médio", value: "72" }],
          series: [...byType.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
          columns: ["Evento", "Data", "Inscritos", "Presentes", "NPS"],
          rows: past.slice(0, 12).map((e) => ({ label: e.title, values: [new Date(e.startDate).toLocaleDateString("pt-BR"), e.registered, e.present ?? 0, e.nps ?? "—"] })),
        },
        {
          id: "participacoes", title: "Participações", category: "Relacionamento", updatedAt,
          description: "Participações mensais e taxa de presença do período.",
          highlights: [{ label: "Participações", value: "6.284" }, { label: "Presença", value: "82%" }, { label: "Participantes únicos", value: "5.284" }],
          series: db.monthly.map((m) => ({ label: m.month, value: m.attendance })),
          columns: ["Mês", "Inscrições", "Participações", "Presença"],
          rows: db.monthly.map((m) => ({ label: m.month, values: [m.registrations, m.attendance, formatPercent((m.attendance / m.registrations) * 100)] })),
        },
        {
          id: "territorio", title: "Território", category: "Território", updatedAt,
          description: "Cobertura por região, municípios alcançados e participação.",
          highlights: [{ label: "Municípios alcançados", value: "492 / 497" }, { label: "Regiões", value: "9" }, { label: "Cobertura", value: "99%" }],
          series: regions.map((r) => ({ label: r.label, value: r.participations })).sort((a, b) => b.value - a.value),
          columns: ["Região", "Municípios", "Alcançados", "Participações"],
          rows: regions.map((r) => ({ label: r.label, values: [r.total, r.reached, r.participations] })),
        },
        {
          id: "certificados", title: "Certificados", category: "Eventos", updatedAt,
          description: "Certificados emitidos por evento e carga horária certificada.",
          highlights: [{ label: "Emitidos", value: formatNumber(issued.length) }, { label: "Horas certificadas", value: formatNumber(issued.reduce((a, c) => a + c.workload, 0)) }, { label: "Validações", value: "1.206" }],
          series: [...certsByEvent.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6),
          columns: ["Evento", "Emitidos"],
          rows: [...certsByEvent.entries()].map(([label, v]) => ({ label, values: [v] })),
        },
        {
          id: "campanhas", title: "Campanhas", category: "Comunicação", updatedAt,
          description: "Desempenho de envios por canal: abertura, cliques e conversões.",
          highlights: [{ label: "Enviadas", value: formatNumber(sentCampaigns.length) }, { label: "Abertura média", value: "49%" }, { label: "Conversões", value: formatNumber(sentCampaigns.reduce((a, c) => a + (c.conversions ?? 0), 0)) }],
          series: sentCampaigns.map((c) => ({ label: c.name.split("—")[0].trim().slice(0, 22), value: c.openRate ?? 0 })),
          columns: ["Campanha", "Canal", "Destinatários", "Abertura", "Cliques"],
          rows: sentCampaigns.map((c) => ({ label: c.name, values: [c.channel === "email" ? "E-mail" : c.channel === "whatsapp" ? "WhatsApp" : "SMS", c.recipients, `${c.openRate}%`, `${c.clickRate}%`] })),
        },
        {
          id: "camaras", title: "Câmaras", category: "Relacionamento", updatedAt,
          description: "Qualidade cadastral, atualização e engajamento das Câmaras.",
          highlights: [{ label: "Cadastradas", value: formatNumber(db.chambers.length) }, { label: "Atualizadas", value: formatNumber(chambersByStatus.atualizada) }, { label: "Qualidade média", value: `${Math.round(db.chambers.reduce((a, c) => a + c.dataQuality, 0) / db.chambers.length)}%` }],
          series: [{ label: "Atualizadas", value: chambersByStatus.atualizada }, { label: "Pendentes", value: chambersByStatus.pendente }, { label: "Desatualizadas", value: chambersByStatus.desatualizada }],
          columns: ["Região", "Câmaras", "Qualidade média"],
          rows: REGION_ORDER.map((id) => {
            const cs = db.chambers.filter((c) => c.regionId === id)
            return { label: REGION_META[id].shortName, values: [cs.length, `${Math.round(cs.reduce((a, c) => a + c.dataQuality, 0) / Math.max(1, cs.length))}%`] }
          }),
        },
      ]
    })
  },

  export(id: string, format: "pdf" | "xlsx" | "csv") {
    return mockWrite(() => ({ id, format, fileName: `uvergs-360-${id}.${format}` }), [1300, 1900])
  },
}
