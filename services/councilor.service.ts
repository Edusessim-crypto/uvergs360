import type { Campaign, Certificate, Councilor, CouncilorInput, Registration, Task, TimelineItem, TimelineKind } from "@/types"
import { buildTimeline } from "@/data/mock/activity"
import { CURRENT_USER } from "@/data/mock/admin"
import { REGION_META } from "@/data/mock/territory"
import { mockRead, mockWrite, newId, ServiceError } from "./_mock-client"

export interface InteractionInput {
  kind: TimelineKind
  title: string
  description?: string
  at: string
}

export interface TaskInput {
  title: string
  assignee: string
  dueAt: string
  priority: Task["priority"]
}

export interface CommunicationRecord {
  id: string
  campaignName: string
  channel: Campaign["channel"]
  sentAt: string
  status: "entregue" | "aberto" | "clicado" | "respondido"
}

/**
 * Vereadores.
 * Etapa 2 → GET /api/councilors (paginação/filtros no servidor), GET /api/councilors/:id,
 * POST /api/councilors, PATCH /api/councilors/:id
 */
export const councilorService = {
  list() {
    return mockRead((db) => db.councilors)
  },

  getById(id: string) {
    return mockRead((db) => {
      const c = db.councilors.find((c) => c.id === id)
      if (!c) throw new ServiceError("Vereador não encontrado", 404)
      return c
    })
  },

  listByChamber(chamberId: string) {
    return mockRead((db) => db.councilors.filter((c) => c.chamberId === chamberId))
  },

  getTimeline(id: string) {
    return mockRead((db): TimelineItem[] => {
      const c = db.councilors.find((c) => c.id === id)
      if (!c) return []
      const base = buildTimeline(c, db.registrations, db.certificates, db.events)
      const manual = db.manualTimeline[id] ?? []
      return [...manual, ...base].sort((a, b) => b.at.localeCompare(a.at))
    })
  },

  getRegistrations(id: string) {
    return mockRead((db): Registration[] =>
      db.registrations.filter((r) => r.councilorId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  },

  getCertificates(id: string) {
    return mockRead((db): Certificate[] => db.certificates.filter((c) => c.councilorId === id))
  },

  getTasks(id: string) {
    return mockRead((db) => db.tasks.filter((t) => t.councilorId === id))
  },

  getCommunications(id: string) {
    return mockRead((db): CommunicationRecord[] => {
      const c = db.councilors.find((c) => c.id === id)
      if (!c) return []
      const sent = db.campaigns.filter((cp) => cp.sentAt && cp.status !== "rascunho")
      const statuses: CommunicationRecord["status"][] = ["aberto", "clicado", "entregue", "aberto", "respondido"]
      return sent.slice(0, c.isDemoFeatured ? 7 : 4).map((cp, i) => ({
        id: `${cp.id}-${id}`,
        campaignName: cp.name,
        channel: cp.channel,
        sentAt: cp.sentAt!,
        status: cp.channel === "whatsapp" && i % 2 === 0 ? "respondido" : statuses[i % statuses.length],
      }))
    })
  },

  create(input: CouncilorInput) {
    return mockWrite((db) => {
      const chamber = db.chambers.find((c) => c.id === input.chamberId)
      const municipality = db.municipalities.find((m) => m.id === input.municipalityId)
      if (!chamber || !municipality) throw new ServiceError("Câmara ou município inválido")
      const now = new Date().toISOString()
      const councilor: Councilor = {
        id: newId("vr"),
        name: input.name,
        gender: input.role === "Vereadora" ? "F" : "M",
        cpf: input.cpf.replace(/\D/g, ""),
        email: input.email,
        emailValid: true,
        phone: input.phone,
        role: input.role,
        mandate: input.mandate,
        municipalityId: municipality.id,
        municipalityName: municipality.name,
        regionId: municipality.regionId,
        regionName: REGION_META[municipality.regionId].shortName,
        chamberId: chamber.id,
        chamberName: chamber.name,
        status: "ativo",
        portalActive: false,
        profileComplete: true,
        situation: "portal_nao_ativado",
        situationDetail: "Cadastro recém-criado — convite pendente",
        priorityScore: 52,
        lastInteractionAt: now,
        eventsCount: 0,
        certificatesCount: 0,
        participationsYear: 0,
        participation: "nenhuma",
        engagementScore: 10,
        interests: [],
        preferredChannel: "E-mail",
        birthDate: now,
        firstTerm: true,
        createdAt: now,
      }
      db.councilors.unshift(councilor)
      db.manualTimeline[councilor.id] = [
        { id: newId("tl"), kind: "cadastro", title: "Cadastro criado", description: chamber.name, meta: `Por ${CURRENT_USER.name}`, at: now },
      ]
      return councilor
    })
  },

  update(id: string, patch: Partial<Councilor>) {
    return mockWrite((db) => {
      const c = db.councilors.find((c) => c.id === id)
      if (!c) throw new ServiceError("Vereador não encontrado", 404)
      Object.assign(c, patch)
      ;(db.manualTimeline[id] ||= []).unshift({
        id: newId("tl"),
        kind: "cadastro",
        title: "Dados cadastrais atualizados",
        description: "Edição pela equipe UVERGS",
        meta: `Por ${CURRENT_USER.name}`,
        at: new Date().toISOString(),
      })
      return c
    })
  },

  registerInteraction(id: string, input: InteractionInput) {
    return mockWrite((db) => {
      const item: TimelineItem = { id: newId("tl"), ...input, meta: `Registrado por ${CURRENT_USER.name}`, actor: CURRENT_USER.name }
      ;(db.manualTimeline[id] ||= []).unshift(item)
      const c = db.councilors.find((c) => c.id === id)
      if (c && input.at > (c.lastInteractionAt ?? "")) c.lastInteractionAt = input.at
      return item
    })
  },

  createTask(id: string, input: TaskInput) {
    return mockWrite((db) => {
      const c = db.councilors.find((c) => c.id === id)
      const task: Task = { id: newId("tk"), ...input, status: "aberta", councilorId: id, councilorName: c?.name }
      db.tasks.unshift(task)
      return task
    })
  },

  toggleTask(taskId: string) {
    return mockWrite((db) => {
      const t = db.tasks.find((t) => t.id === taskId)
      if (t) t.status = t.status === "aberta" ? "concluida" : "aberta"
      return t
    }, [120, 240])
  },

  /** Etapa 2 → POST /api/messages (fila BullMQ → Resend / WhatsApp Cloud API) */
  sendMessage(ids: string[], channel: "E-mail" | "WhatsApp", subject: string) {
    return mockWrite((db) => {
      const at = new Date().toISOString()
      for (const id of ids) {
        ;(db.manualTimeline[id] ||= []).unshift({
          id: newId("tl"),
          kind: channel === "WhatsApp" ? "whatsapp" : "email",
          title: channel === "WhatsApp" ? "WhatsApp enviado" : "E-mail enviado",
          description: subject,
          meta: `Por ${CURRENT_USER.name}`,
          at,
        })
      }
      return { sent: ids.length }
    }, [900, 1400])
  },
}
