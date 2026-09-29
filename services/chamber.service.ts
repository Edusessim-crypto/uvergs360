import type { ActivityItem, Chamber, UvergsEvent } from "@/types"
import { createRandom, hashString } from "@/lib/random"
import { daysAgo } from "@/data/mock/_clock"
import { mockRead, mockWrite, ServiceError } from "./_mock-client"

export interface ChamberEventParticipation {
  event: UvergsEvent
  participants: number
}

/**
 * Câmaras Municipais.
 * Etapa 2 → GET /api/chambers, GET /api/chambers/:id, PATCH /api/chambers/:id,
 * GET /api/chambers/:id/events, GET /api/chambers/:id/activity
 */
export const chamberService = {
  list() {
    return mockRead((db) => db.chambers)
  },

  getById(id: string) {
    return mockRead((db) => {
      const c = db.chambers.find((c) => c.id === id)
      if (!c) throw new ServiceError("Câmara não encontrada", 404)
      return c
    })
  },

  getByMunicipality(municipalityId: string) {
    return mockRead((db) => db.chambers.find((c) => c.municipalityId === municipalityId) ?? null)
  },

  getEvents(id: string) {
    return mockRead((db): ChamberEventParticipation[] => {
      const chamber = db.chambers.find((c) => c.id === id)
      if (!chamber) return []
      const counts = new Map<string, number>()
      for (const r of db.registrations) {
        if (r.chamberName === chamber.name && r.status !== "incompleta") counts.set(r.eventId, (counts.get(r.eventId) ?? 0) + 1)
      }
      const rnd = createRandom(hashString(id))
      const past = db.events.filter((e) => e.status === "encerrado" && !counts.has(e.id))
      const extra = rnd.sample(past, Math.max(0, Math.min(past.length, chamber.eventsCount - counts.size)))
      extra.forEach((e) => counts.set(e.id, rnd.int(1, Math.max(1, Math.round(chamber.councilorsCount / 3)))))
      return db.events
        .filter((e) => counts.has(e.id))
        .map((event) => ({ event, participants: counts.get(event.id)! }))
        .sort((a, b) => b.event.startDate.localeCompare(a.event.startDate))
    })
  },

  getActivity(id: string) {
    return mockRead((db): ActivityItem[] => {
      const chamber = db.chambers.find((c) => c.id === id)
      if (!chamber) return []
      const members = db.councilors.filter((c) => c.chamberId === id)
      const memberIds = new Set(members.map((m) => m.id))
      const items: ActivityItem[] = db.registrations
        .filter((r) => r.councilorId && memberIds.has(r.councilorId))
        .flatMap((r) => {
          const list: ActivityItem[] = [
            { id: `ca-i-${r.id}`, kind: "inscricao", title: r.status === "incompleta" ? "Inscrição iniciada" : "Inscrição concluída", subject: r.participantName, context: r.eventTitle, at: r.createdAt, href: `/vereadores/${r.councilorId}` },
          ]
          if (r.checkedInAt) list.push({ id: `ca-c-${r.id}`, kind: "checkin", title: "Check-in registrado", subject: r.participantName, context: r.eventTitle, at: r.checkedInAt, href: `/vereadores/${r.councilorId}` })
          return list
        })
      items.push({ id: `ca-upd-${id}`, kind: "cadastro", title: "Cadastro da Câmara atualizado", subject: chamber.adminContact, context: "Presidente, telefone e endereço", at: chamber.updatedAt })
      items.push({ id: `ca-portal-${id}`, kind: "portal", title: "Portal da Câmara acessado", subject: chamber.adminContact, context: "Revisão da lista de vereadores", at: daysAgo(4, 14, 22) })
      return items.filter((i) => i.at <= new Date().toISOString()).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14)
    })
  },

  update(id: string, patch: Partial<Chamber>) {
    return mockWrite((db) => {
      const c = db.chambers.find((c) => c.id === id)
      if (!c) throw new ServiceError("Câmara não encontrada", 404)
      Object.assign(c, patch, { updatedAt: new Date().toISOString(), status: "atualizada" })
      return c
    })
  },

  /** Etapa 2 → POST /api/chambers/:id/update-request (e-mail + tarefa) */
  requestUpdate(ids: string[]) {
    return mockWrite(() => ({ requested: ids.length }))
  },
}
