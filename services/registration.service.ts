import type { CheckInEntry, CheckInSession, Registration, ScanResult } from "@/types"
import { EVENT_IDS } from "@/data/mock/events"
import { FEATURED_IDS } from "@/data/mock/people"
import { mockRead, mockWrite, newId, ServiceError } from "./_mock-client"

export interface PublicRegistrationInput {
  eventId: string
  name: string
  cpf: string
  email: string
  phone: string
  municipalityName: string
  chamberName: string
  role: string
  paymentMethod: "pix" | "boleto" | "empenho"
}

/**
 * Inscrições.
 * Etapa 2 → GET /api/registrations, POST /api/public/events/:slug/registrations,
 * webhooks de pagamento (PIX/boleto) atualizando paymentStatus.
 */
export const registrationService = {
  list() {
    return mockRead((db) => [...db.registrations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  /** Etapa 2 → POST /api/registrations/:id/reminder (fila de mensagens) */
  sendReminder(ids: string[]) {
    return mockWrite(() => ({ sent: ids.length }), [700, 1100])
  },

  confirmPayment(ids: string[]) {
    return mockWrite((db) => {
      db.registrations.forEach((r) => {
        if (ids.includes(r.id)) {
          r.paymentStatus = "confirmado"
          if (r.status === "incompleta") r.status = "confirmada"
        }
      })
      return { updated: ids.length }
    })
  },

  createPublic(input: PublicRegistrationInput) {
    return mockWrite((db) => {
      const ev = db.events.find((e) => e.id === input.eventId)
      if (!ev) throw new ServiceError("Evento não encontrado", 404)
      const code = "U360-" + Math.random().toString(16).slice(2, 8).toUpperCase()
      const registration: Registration = {
        id: newId("ins"),
        code,
        participantName: input.name,
        councilorId: null,
        eventId: ev.id,
        eventTitle: ev.title,
        createdAt: new Date().toISOString(),
        chamberName: input.chamberName,
        municipalityName: input.municipalityName,
        role: input.role,
        paymentStatus: ev.price === 0 ? "isento" : input.paymentMethod === "pix" ? "confirmado" : "pendente",
        status: "confirmada",
        amount: ev.price,
        origin: "Orgânico",
        checkedInAt: null,
      }
      db.registrations.unshift(registration)
      ev.registered += 1
      if (registration.paymentStatus !== "pendente") ev.paymentsConfirmed += 1
      db.notifications.unshift({
        id: newId("nt"),
        kind: "inscricao",
        title: "Nova inscrição",
        description: `${input.name} se inscreveu em ${ev.title}`,
        at: registration.createdAt,
        read: false,
        href: "/inscricoes",
      })
      return registration
    }, [1100, 1600])
  },
}

/**
 * Check-in.
 * Etapa 2 → leitura via câmera (getUserMedia + decodificador de QR),
 * POST /api/checkin/scan { token } validando assinatura do QR, persistência no banco
 * e sincronização offline para dispositivos da equipe.
 */
export const checkinService = {
  listEvents() {
    return mockRead((db) =>
      db.events
        .filter((e) => ["em_andamento", "inscricoes_abertas", "esgotado"].includes(e.status) && e.format !== "Online")
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    )
  },

  getSession(eventId: string = EVENT_IDS.capacitacao) {
    return mockRead((db): CheckInSession => {
      const ev = db.events.find((e) => e.id === eventId)
      if (!ev) throw new ServiceError("Evento não encontrado", 404)
      const regs = db.registrations.filter((r) => r.eventId === eventId && r.status === "confirmada")
      const present = regs.filter((r) => r.checkedInAt)
      const recent: CheckInEntry[] = present
        .sort((a, b) => b.checkedInAt!.localeCompare(a.checkedInAt!))
        .slice(0, 8)
        .map((r) => ({ id: `ck-${r.id}`, registrationId: r.id, name: r.participantName, chamberName: r.chamberName, at: r.checkedInAt! }))
      return {
        eventId,
        eventTitle: ev.title,
        eventDay: ev.startDate,
        registered: ev.status === "em_andamento" ? ev.registered : regs.length,
        present: present.length,
        recent,
      }
    }, [100, 200])
  },

  /** Simula a leitura de um QR Code: devolve o próximo participante ainda não presente. */
  scan(eventId: string) {
    return mockRead((db): ScanResult => {
      const pending = db.registrations.filter((r) => r.eventId === eventId && r.status === "confirmada" && !r.checkedInAt)
      const carlos = pending.find((r) => r.councilorId === FEATURED_IDS.carlos)
      const pick = carlos ?? pending.find((r) => r.councilorId) ?? pending[0]
      if (!pick) throw new ServiceError("Todos os inscritos já registraram presença.", 409)
      return { registration: pick, alreadyCheckedIn: false }
    }, [950, 1150])
  },

  search(eventId: string, query: string) {
    return mockRead((db) => {
      const q = query.trim().toLowerCase()
      if (q.length < 2) return []
      return db.registrations
        .filter((r) => r.eventId === eventId && r.status === "confirmada" && (r.participantName.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)))
        .slice(0, 6)
    }, [80, 160])
  },

  confirm(registrationId: string) {
    return mockWrite((db): CheckInEntry => {
      const r = db.registrations.find((r) => r.id === registrationId)
      if (!r) throw new ServiceError("Inscrição não encontrada", 404)
      if (r.checkedInAt) throw new ServiceError("Presença já registrada para este participante.", 409)
      r.checkedInAt = new Date().toISOString()
      const ev = db.events.find((e) => e.id === r.eventId)
      if (ev && ev.present !== null) ev.present += 1
      const entry = { id: newId("ck"), registrationId: r.id, name: r.participantName, chamberName: r.chamberName, at: r.checkedInAt }
      db.sessionCheckIns.unshift(entry)
      if (r.councilorId) {
        const c = db.councilors.find((c) => c.id === r.councilorId)
        if (c) c.lastInteractionAt = r.checkedInAt
      }
      db.activity.unshift({ id: newId("at"), kind: "checkin", title: "Check-in realizado", subject: r.participantName, context: r.eventTitle, at: r.checkedInAt, href: r.councilorId ? `/vereadores/${r.councilorId}` : undefined })
      return entry
    }, [450, 700])
  },
}
