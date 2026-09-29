import type { Evaluation, EvaluationSummary } from "@/types"
import { mockRead, mockWrite, ServiceError } from "./_mock-client"

/**
 * Certificados.
 * Etapa 2 → GET /api/certificates, geração de PDF no servidor (fila) + storage (S3/R2),
 * GET /api/public/certificates/:code para validação pública via QR.
 */
export const certificateService = {
  list() {
    return mockRead((db) => db.certificates)
  },

  getByCode(code: string) {
    return mockRead((db) => {
      const c = db.certificates.find((c) => c.code.toLowerCase() === code.toLowerCase())
      if (!c) throw new ServiceError("Certificado não encontrado", 404)
      return c
    })
  },

  /** Etapa 2 → GET /api/certificates/:id/pdf (URL assinada do storage) */
  download(ids: string[]) {
    return mockWrite(() => ({ files: ids.length }), [900, 1400])
  },

  issue(ids: string[]) {
    return mockWrite((db) => {
      const now = new Date().toISOString()
      db.certificates.forEach((c) => {
        if (ids.includes(c.id) && c.status !== "emitido") {
          c.status = "emitido"
          c.issuedAt = now
        }
      })
      return { issued: ids.length }
    })
  },
}

/**
 * Avaliações e NPS.
 * Etapa 2 → GET /api/evaluations?eventId=, formulário público de pesquisa,
 * agregações calculadas no banco.
 */
export const evaluationService = {
  list(eventId?: string) {
    return mockRead((db): Evaluation[] => (eventId ? db.evaluations.filter((e) => e.eventId === eventId) : db.evaluations))
  },

  summary(eventId?: string) {
    return mockRead((db): EvaluationSummary => {
      const list = eventId ? db.evaluations.filter((e) => e.eventId === eventId) : db.evaluations
      const promoters = list.filter((e) => e.score >= 9).length
      const detractors = list.filter((e) => e.score <= 6).length
      const passives = list.length - promoters - detractors
      const nps = list.length ? Math.round(((promoters - detractors) / list.length) * 100) : 0
      const interestCounts = new Map<string, number>()
      list.forEach((e) => e.interests.forEach((i) => interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1)))
      const eventIds = [...new Set(db.evaluations.map((e) => e.eventId))]
      const present = eventId ? db.events.find((e) => e.id === eventId)?.present ?? list.length : eventIds.reduce((a, id) => a + (db.events.find((e) => e.id === id)?.present ?? 0), 0)
      return {
        nps,
        responses: list.length,
        averageRating: list.length ? list.reduce((a, e) => a + e.rating, 0) / list.length : 0,
        promoters,
        passives,
        detractors,
        responseRate: present ? Math.round((list.length / present) * 100) : 0,
        distribution: Array.from({ length: 11 }, (_, score) => ({ score, count: list.filter((e) => e.score === score).length })),
        interests: [...interestCounts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8),
        byEvent: eventIds.map((id) => {
          const evs = db.evaluations.filter((e) => e.eventId === id)
          const p = evs.filter((e) => e.score >= 9).length
          const d = evs.filter((e) => e.score <= 6).length
          return { eventId: id, eventTitle: evs[0].eventTitle, nps: Math.round(((p - d) / evs.length) * 100), responses: evs.length }
        }),
      }
    })
  },
}
