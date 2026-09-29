import type { Certificate, Chamber, Councilor, Registration, UvergsEvent } from "@/types"
import { FEATURED_IDS } from "@/data/mock/people"
import { mockRead, mockWrite } from "./_mock-client"

export interface ParticipantHome {
  councilor: Councilor
  nextEvent: { event: UvergsEvent; registration: Registration } | null
  registrations: { event: UvergsEvent; registration: Registration }[]
  certificates: Certificate[]
  suggestedEvents: UvergsEvent[]
}

export interface ChamberPortalHome {
  chamber: Chamber
  councilors: Councilor[]
  eventsYear: number
  participations: number
  completeness: number
  upcoming: UvergsEvent[]
  pendingItems: { label: string; done: boolean }[]
}

/**
 * Portal Meu UVERGS (participante) e Portal da Câmara.
 * Etapa 2 → sessão do participante (login por CPF + código/magic link),
 * GET /api/me, GET /api/me/registrations, GET /api/me/certificates,
 * GET /api/chamber-portal (escopo pela Câmara do usuário autenticado).
 */
export const portalService = {
  getParticipantHome(councilorId: string = FEATURED_IDS.carlos) {
    return mockRead((db): ParticipantHome => {
      const councilor = db.councilors.find((c) => c.id === councilorId)!
      const regs = db.registrations.filter((r) => r.councilorId === councilorId && r.status !== "incompleta")
      const withEvent = regs
        .map((registration) => ({ registration, event: db.events.find((e) => e.id === registration.eventId)! }))
        .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate))
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const upcoming = withEvent.filter((x) => (x.event.endDate ?? x.event.startDate) >= startOfToday)
      // Prioriza o destaque (Seminário) como "próximo evento" do portal
      const nextEvent = upcoming.find((x) => x.event.highlight) ?? upcoming[0] ?? null
      const registeredIds = new Set(regs.map((r) => r.eventId))
      return {
        councilor,
        nextEvent,
        registrations: withEvent.reverse(),
        certificates: db.certificates.filter((c) => c.councilorId === councilorId && c.status === "emitido"),
        suggestedEvents: db.events.filter((e) => e.status === "inscricoes_abertas" && !registeredIds.has(e.id)).slice(0, 3),
      }
    })
  },

  updateProfile(councilorId: string, patch: Partial<Pick<Councilor, "email" | "phone" | "interests" | "preferredChannel">>) {
    return mockWrite((db) => {
      const c = db.councilors.find((c) => c.id === councilorId)!
      Object.assign(c, patch)
      return c
    })
  },

  getChamberHome(chamberId = "cm-4309100") {
    return mockRead((db): ChamberPortalHome => {
      const chamber = db.chambers.find((c) => c.id === chamberId)!
      const councilors = db.councilors.filter((c) => c.chamberId === chamberId)
      const complete = councilors.filter((c) => c.profileComplete).length
      return {
        chamber,
        councilors,
        eventsYear: chamber.eventsCount,
        participations: chamber.participantsYear,
        completeness: chamberId === "cm-4309100" ? 89 : Math.round((complete / Math.max(1, councilors.length)) * 100),
        upcoming: db.events.filter((e) => ["inscricoes_abertas", "agendado"].includes(e.status)).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 4),
        pendingItems: [
          { label: "Presidente e Mesa Diretora confirmados", done: true },
          { label: "Telefone e e-mail institucional", done: true },
          { label: "Endereço completo da sede", done: true },
          { label: "Responsável administrativo", done: true },
          { label: "Foto oficial dos vereadores", done: false },
        ],
      }
    })
  },
}
