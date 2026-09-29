import type { EventDashboard, EventInput, EventOrigin, Registration, UvergsEvent } from "@/types"
import { REGION_META, REGION_ORDER } from "@/data/mock/territory"
import { EVENT_IDS } from "@/data/mock/events"
import { generateForEvent } from "@/data/mock/registrations"
import { createRandom, hashString } from "@/lib/random"
import { daysBetween } from "@/lib/format"
import { slugify } from "@/lib/utils"
import { mockRead, mockWrite, newId, ServiceError } from "./_mock-client"

const ORIGIN_ORDER = ["E-mail", "WhatsApp", "Portal", "Orgânico", "Indicação"]

/**
 * Eventos.
 * Etapa 2 → GET /api/events, GET /api/events/:id, GET /api/events/:id/dashboard,
 * POST /api/events, PATCH /api/events/:id, GET /api/public/events/:slug
 */
export const eventService = {
  list() {
    return mockRead((db) => [...db.events].sort((a, b) => a.startDate.localeCompare(b.startDate)))
  },

  getById(id: string) {
    return mockRead((db) => {
      const e = db.events.find((e) => e.id === id)
      if (!e) throw new ServiceError("Evento não encontrado", 404)
      return e
    })
  },

  getBySlug(slug: string) {
    return mockRead((db) => {
      const e = db.events.find((e) => e.slug === slug)
      if (!e) throw new ServiceError("Evento não encontrado", 404)
      return e
    })
  },

  getRegistrations(id: string) {
    return mockRead((db): Registration[] => {
      const list = db.registrations.filter((r) => r.eventId === id)
      if (list.length) return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      // Eventos históricos: lista arquivada gerada sob demanda
      const ev = db.events.find((e) => e.id === id)
      if (!ev || ev.registered === 0) return []
      const byId = new Map(db.councilors.map((c) => [c.id, c]))
      const generated = generateForEvent(ev, db.councilors.filter((c) => c.situation !== "nunca_participou"), byId)
      db.registrations.push(...generated)
      return generated.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    })
  },

  getDashboard(id: string) {
    return mockRead((db): EventDashboard => {
      const event = db.events.find((e) => e.id === id)
      if (!event) throw new ServiceError("Evento não encontrado", 404)
      const rnd = createRandom(hashString(id + "dash"))
      const regs = db.registrations.filter((r) => r.eventId === id && r.status !== "incompleta" && r.status !== "cancelada")
      const isSeminario = id === EVENT_IDS.seminario

      const registered = event.registered
      const funnel = isSeminario
        ? [
            { label: "Alcançados", value: 2840 },
            { label: "Acessos à página", value: 842 },
            { label: "Iniciaram inscrição", value: 263 },
            { label: "Inscrições concluídas", value: 184 },
            { label: "Presença", value: null },
          ]
        : [
            { label: "Alcançados", value: Math.round(registered * rnd.float(12, 16)) },
            { label: "Acessos à página", value: Math.round(registered * rnd.float(4.2, 5.1)) },
            { label: "Iniciaram inscrição", value: Math.round(registered * rnd.float(1.32, 1.5)) },
            { label: "Inscrições concluídas", value: registered },
            { label: "Presença", value: event.present },
          ]

      let origins: EventOrigin[]
      if (isSeminario) {
        origins = [
          { label: "E-mail", value: 42 },
          { label: "WhatsApp", value: 28 },
          { label: "Portal", value: 16 },
          { label: "Orgânico", value: 9 },
          { label: "Indicação", value: 5 },
        ]
      } else {
        const counts = new Map<string, number>()
        regs.forEach((r) => counts.set(r.origin, (counts.get(r.origin) ?? 0) + 1))
        const total = Math.max(1, regs.length)
        origins = ORIGIN_ORDER.map((label) => ({ label, value: Math.round(((counts.get(label) ?? 0) / total) * 100) }))
      }

      // Evolução acumulada das inscrições (últimas 5 semanas até hoje ou até o evento)
      const end = new Date(Math.min(Date.now(), new Date(event.startDate).getTime()))
      const days = 35
      const points: EventDashboard["registrationsTimeline"] = []
      const sorted = regs.map((r) => new Date(r.createdAt).getTime()).sort((a, b) => a - b)
      let idx = 0
      let before = 0
      const startWindow = new Date(end)
      startWindow.setDate(startWindow.getDate() - days)
      startWindow.setHours(23, 59, 59, 999)
      while (idx < sorted.length && sorted[idx] <= startWindow.getTime()) {
        before++
        idx++
      }
      let total = before
      for (let d = days - 1; d >= 0; d--) {
        const day = new Date(end)
        day.setDate(day.getDate() - d)
        day.setHours(23, 59, 59, 999)
        let daily = 0
        while (idx < sorted.length && sorted[idx] <= day.getTime()) {
          daily++
          idx++
        }
        total += daily
        points.push({ date: day.toISOString(), label: `${day.getDate()}/${day.getMonth() + 1}`, total, daily })
      }
      // Escala para o total oficial do evento (inclui inscrições em lote de Câmaras)
      const scale = total > 0 ? Math.min(1.25, registered / total) : 1
      points.forEach((p) => {
        p.total = Math.round(p.total * scale)
        p.daily = Math.round(p.daily * scale)
      })
      if (points.length) points[points.length - 1].total = registered

      const regionOf = new Map(db.municipalities.map((m) => [m.name, m.regionId]))
      const byRegionMap = new Map<string, number>()
      regs.forEach((r) => {
        const reg = regionOf.get(r.municipalityName)
        if (reg) byRegionMap.set(reg, (byRegionMap.get(reg) ?? 0) + 1)
      })
      const byRegion = REGION_ORDER.map((regionId) => ({ regionId, label: REGION_META[regionId].shortName, value: byRegionMap.get(regionId) ?? 0 }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value)

      const daysToEvent = daysBetween(new Date(), new Date(event.startDate))
      const closed = event.status === "encerrado"
      const checklist = [
        { label: "Landing page publicada", done: event.status !== "rascunho" },
        { label: "Pagamentos habilitados (PIX e boleto)", done: event.price === 0 || event.status !== "rascunho", hint: event.price === 0 ? "Evento gratuito" : undefined },
        { label: "Credenciais digitais enviadas", done: closed || event.status === "em_andamento" || daysToEvent <= 7, hint: !closed && daysToEvent > 7 ? `Envio automático em ${daysToEvent - 7} dias` : undefined },
        { label: "Modelo de certificado configurado", done: true },
        { label: "Pesquisa de satisfação agendada", done: closed, hint: closed ? undefined : "Dispara ao fim do evento" },
        { label: "Equipe de check-in escalada", done: closed || event.status === "em_andamento" || daysToEvent <= 20 },
      ]

      return { event, funnel, origins, registrationsTimeline: points, byRegion, checklist, daysToEvent }
    })
  },

  create(input: EventInput) {
    return mockWrite((db) => {
      const city = input.city.trim() || "Porto Alegre"
      const municipality = db.municipalities.find((m) => m.name.toLowerCase() === city.toLowerCase())
      const event: UvergsEvent = {
        id: newId("ev"),
        slug: slugify(input.title),
        title: input.title,
        type: input.type,
        format: input.format,
        startDate: new Date(`${input.startDate}T08:30:00`).toISOString(),
        endDate: new Date(`${input.endDate || input.startDate}T17:30:00`).toISOString(),
        city: input.format === "Online" ? "Online" : city,
        regionId: municipality?.regionId ?? "metropolitana",
        venue: input.venue || (input.format === "Online" ? "Transmissão ao vivo" : "A definir"),
        address: input.address || `${city}/RS`,
        capacity: input.capacity,
        registered: 0,
        paymentsConfirmed: 0,
        present: null,
        chambersCount: 0,
        municipalitiesCount: 0,
        certificatesIssued: 0,
        nps: null,
        status: input.publish === "agora" ? "inscricoes_abertas" : input.publish === "agendar" ? "agendado" : "rascunho",
        price: input.price,
        priceNonMember: input.priceNonMember,
        workload: input.workload,
        description: input.description,
        audience: "Vereadores e servidores",
        program: [],
        speakers: [],
        createdAt: new Date().toISOString(),
      }
      db.events.push(event)
      return event
    }, [900, 1300])
  },
}
