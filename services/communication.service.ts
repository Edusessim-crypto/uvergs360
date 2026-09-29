import type { Campaign, CampaignInput, Segment, SegmentRule } from "@/types"
import { hashString } from "@/lib/random"
import { CURRENT_USER } from "@/data/mock/admin"
import { mockRead, mockWrite, newId, ServiceError } from "./_mock-client"

/**
 * Campanhas.
 * Etapa 2 → POST /api/campaigns, POST /api/campaigns/:id/send (fila BullMQ),
 * provedores: Resend (e-mail), WhatsApp Cloud API, Zenvia/Twilio (SMS);
 * métricas via webhooks de entrega/abertura/clique.
 */
export const campaignService = {
  list() {
    return mockRead((db) => [...db.campaigns].sort((a, b) => (b.sentAt ?? b.scheduledAt ?? b.createdAt).localeCompare(a.sentAt ?? a.scheduledAt ?? a.createdAt)))
  },

  getById(id: string) {
    return mockRead((db) => {
      const c = db.campaigns.find((c) => c.id === id)
      if (!c) throw new ServiceError("Campanha não encontrada", 404)
      return c
    })
  },

  create(input: CampaignInput) {
    return mockWrite((db) => {
      const now = new Date().toISOString()
      const campaign: Campaign = {
        id: newId("cp"),
        name: input.name,
        channel: input.channel,
        status: input.sendMode === "agora" ? "enviando" : "agendada",
        recipients: input.recipients,
        delivered: 0,
        openRate: null,
        clickRate: null,
        conversions: null,
        conversionLabel: input.eventId ? "inscrições" : "cliques",
        segmentName: input.segmentName,
        subject: input.subject,
        preheader: input.preheader,
        body: input.body,
        ctaLabel: input.ctaLabel,
        eventId: input.eventId,
        sentAt: input.sendMode === "agora" ? now : null,
        scheduledAt: input.sendMode === "agendar" ? input.scheduledAt ?? now : null,
        createdAt: now,
        owner: CURRENT_USER.name,
      }
      db.campaigns.unshift(campaign)
      return campaign
    }, [1200, 1700])
  },

  send(id: string) {
    return mockWrite((db) => {
      const c = db.campaigns.find((c) => c.id === id)
      if (!c) throw new ServiceError("Campanha não encontrada", 404)
      c.status = "enviando"
      c.sentAt = new Date().toISOString()
      c.scheduledAt = null
      return c
    }, [1200, 1600])
  },

  setPaused(id: string, paused: boolean) {
    return mockWrite((db) => {
      const c = db.campaigns.find((c) => c.id === id)
      if (!c) throw new ServiceError("Campanha não encontrada", 404)
      c.status = paused ? "pausada" : c.sentAt ? "enviada" : "agendada"
      return c
    })
  },

  duplicate(id: string) {
    return mockWrite((db) => {
      const c = db.campaigns.find((c) => c.id === id)
      if (!c) throw new ServiceError("Campanha não encontrada", 404)
      const copy: Campaign = { ...c, id: newId("cp"), name: `${c.name} (cópia)`, status: "rascunho", sentAt: null, scheduledAt: null, delivered: 0, openRate: null, clickRate: null, conversions: null, createdAt: new Date().toISOString(), owner: CURRENT_USER.name }
      db.campaigns.unshift(copy)
      return copy
    })
  },
}

/**
 * Jornadas (automação).
 * Etapa 2 → motor de automação com gatilhos por eventos de domínio + BullMQ (delays).
 */
export const journeyService = {
  list() {
    return mockRead((db) => db.journeys)
  },

  getById(id: string) {
    return mockRead((db) => {
      const j = db.journeys.find((j) => j.id === id)
      if (!j) throw new ServiceError("Jornada não encontrada", 404)
      return j
    })
  },

  setStatus(id: string, status: "ativa" | "pausada") {
    return mockWrite((db) => {
      const j = db.journeys.find((j) => j.id === id)
      if (!j) throw new ServiceError("Jornada não encontrada", 404)
      j.status = status
      j.updatedAt = new Date().toISOString()
      return j
    })
  },
}

/** Fatores de seleção usados pela estimativa simulada de segmentos. */
const BASE_CONTACTS = 9640
const MUNICIPALITY_SHARE: Record<string, number> = {
  "Caxias do Sul": 363 / BASE_CONTACTS,
  "Porto Alegre": 512 / BASE_CONTACTS,
  Gramado: 41 / BASE_CONTACTS,
  Canoas: 214 / BASE_CONTACTS,
  Pelotas: 198 / BASE_CONTACTS,
  "Santa Maria": 205 / BASE_CONTACTS,
}
const REGION_SHARE: Record<string, number> = {
  Metropolitana: 0.21, Serra: 0.13, Vales: 0.12, Litoral: 0.05, Central: 0.08, Norte: 0.16, Missões: 0.12, Fronteira: 0.06, Sul: 0.07,
}
const VALUE_SHARE: Record<string, number> = {
  "participou_evento:Sim": 0.62,
  "participou_evento:Não": 0.38,
  "cargo:Presidente": 0.051,
  "cargo:Vereador": 0.5,
  "cargo:Assessor parlamentar": 0.21,
  "cargo:Servidor da Câmara": 0.24,
  "situacao_cadastral:Completo": 0.86,
  "situacao_cadastral:Incompleto": 0.14,
  "portal:Ativo": 0.71,
  "portal:Não ativado": 0.29,
  "primeiro_mandato:Sim": 0.44,
  "primeiro_mandato:Não": 0.56,
}

function ruleShare(rule: SegmentRule) {
  let share: number
  if (rule.field === "municipio") share = MUNICIPALITY_SHARE[rule.value] ?? (8 + (hashString(rule.value) % 22)) / BASE_CONTACTS
  else if (rule.field === "regiao") share = REGION_SHARE[rule.value] ?? 0.1
  else if (rule.field === "camara") share = (10 + (hashString(rule.value) % 30)) / BASE_CONTACTS
  else if (rule.field === "interesse") share = 0.12 + (hashString(rule.value) % 20) / 100
  else if (rule.field === "evento") share = 0.02 + (hashString(rule.value) % 5) / 100
  else share = VALUE_SHARE[`${rule.field}:${rule.value}`] ?? 0.5
  return rule.operator === "e" ? share : 1 - share
}

/**
 * Segmentos.
 * Etapa 2 → POST /api/segments/estimate (consulta SQL gerada a partir das regras),
 * POST /api/segments.
 */
export const segmentService = {
  list() {
    return mockRead((db) => db.segments)
  },

  estimate(rules: SegmentRule[]) {
    return mockRead(() => {
      if (!rules.length) return BASE_CONTACTS
      const share = rules.reduce((acc, r) => acc * ruleShare(r), 1)
      return Math.max(0, Math.round(BASE_CONTACTS * share))
    }, [180, 320])
  },

  create(input: { name: string; description: string; rules: SegmentRule[]; count: number }) {
    return mockWrite((db) => {
      const segment: Segment = { id: newId("sg"), ...input, updatedAt: new Date().toISOString(), kind: "dinamico", trend: 0, usedInCampaigns: 0 }
      db.segments.unshift(segment)
      return segment
    })
  },

  baseContacts: BASE_CONTACTS,
}
