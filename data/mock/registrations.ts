/**
 * DADOS DE DEMONSTRAÇÃO — inscrições, check-ins, certificados e avaliações.
 */
import type {
  Certificate,
  Councilor,
  Evaluation,
  PaymentStatus,
  Registration,
  RegistrationStatus,
  UvergsEvent,
} from "@/types"
import { createRandom, hashString, type Random } from "@/lib/random"
import { FIRST_NAMES_F, FIRST_NAMES_M, INTERESTS, NON_COUNCILOR_ROLES, SURNAMES } from "./_names"
import { EVENT_IDS } from "./events"
import { FEATURED_IDS } from "./people"
import { todayAt } from "./_clock"

const ORIGINS = [
  { value: "E-mail", weight: 42 },
  { value: "WhatsApp", weight: 28 },
  { value: "Portal", weight: 16 },
  { value: "Orgânico", weight: 9 },
  { value: "Indicação", weight: 5 },
]

function code(rnd: Random) {
  const chars = "0123456789ABCDEF"
  return "U360-" + Array.from({ length: 6 }, () => chars[rnd.int(0, 15)]).join("")
}

function randomPerson(rnd: Random) {
  const f = rnd.chance(0.45)
  return `${rnd.pick(f ? FIRST_NAMES_F : FIRST_NAMES_M)} ${rnd.pick(SURNAMES)}`
}

/** Distribui um instante entre a abertura das inscrições e o limite. */
function spreadDate(rnd: Random, fromDaysAgo: number, toDaysAgo: number) {
  const d = new Date()
  const days = rnd.float(Math.max(0, toDaysAgo), fromDaysAgo)
  d.setTime(d.getTime() - days * 86_400_000)
  d.setHours(rnd.int(7, 22), rnd.int(0, 59), 0, 0)
  if (d.getTime() > Date.now()) d.setTime(Date.now() - rnd.int(30, 400) * 60_000)
  return d.toISOString()
}

function daysFromNow(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / 86_400_000
}

export function buildRegistrations(events: UvergsEvent[], councilors: Councilor[]) {
  const registrations: Registration[] = []
  const handcrafted = new Set<string>(Object.values(EVENT_IDS))
  const active = councilors.filter((c) => c.situation !== "nunca_participou")
  const byId = new Map(councilors.map((c) => [c.id, c]))

  for (const ev of events) {
    if (!handcrafted.has(ev.id) || ev.registered === 0) continue
    registrations.push(...generateForEvent(ev, active, byId))
  }
  return registrations
}

export function generateForEvent(ev: UvergsEvent, pool: Councilor[], byId: Map<string, Councilor>) {
  const rnd = createRandom(hashString(ev.id))
  const list: Registration[] = []
  const startOffset = daysFromNow(ev.startDate)
  const openedDaysAgo = Math.max(10, 48 - Math.min(0, startOffset)) + Math.max(0, -startOffset)
  const closeDaysAgo = Math.max(0, -startOffset + 1)

  // Participantes regionais têm preferência em encontros regionais
  const regional = ev.type === "Encontro Regional" ? pool.filter((c) => c.regionId === ev.regionId) : pool
  const source = regional.length > ev.registered * 0.7 ? regional : pool
  const shuffled = rnd.shuffle(source)

  const forced: string[] = []
  if (ev.id === EVENT_IDS.seminario) forced.push(FEATURED_IDS.carlos, FEATURED_IDS.carlosMendes)
  if (ev.id === EVENT_IDS.capacitacao) forced.push(FEATURED_IDS.carlos, FEATURED_IDS.ana, FEATURED_IDS.marcos, FEATURED_IDS.mariana)
  if (ev.id === EVENT_IDS.congresso) forced.push(FEATURED_IDS.carlos, FEATURED_IDS.joao, FEATURED_IDS.mariana)

  const chosen: (Councilor | null)[] = forced.map((id) => byId.get(id) ?? null).filter(Boolean)
  let i = 0
  while (chosen.length < ev.registered) {
    if (rnd.chance(0.22)) {
      chosen.push(null) // participante não vereador (assessor/servidor)
    } else {
      const c = shuffled[i++ % shuffled.length]
      if (!chosen.includes(c) && !forced.includes(c.id) && c.situation !== "inscricao_abandonada") chosen.push(c)
    }
  }

  const unpaid = ev.registered - ev.paymentsConfirmed
  const presentTarget = ev.present ?? 0

  chosen.forEach((c, idx) => {
    const payment: PaymentStatus =
      ev.price === 0 ? "isento" : idx >= ev.registered - unpaid ? "pendente" : rnd.chance(0.04) ? "isento" : "confirmado"
    const createdAt = spreadDate(rnd, openedDaysAgo, closeDaysAgo)
    const fallbackChamber = pool[rnd.int(0, pool.length - 1)]
    list.push({
      id: `ins-${ev.id.slice(3, 10)}-${idx}`,
      code: code(rnd),
      participantName: c ? c.name : randomPerson(rnd),
      councilorId: c ? c.id : null,
      eventId: ev.id,
      eventTitle: ev.title,
      createdAt,
      chamberName: c ? c.chamberName : fallbackChamber.chamberName,
      municipalityName: c ? c.municipalityName : fallbackChamber.municipalityName,
      role: c ? c.role : rnd.pick(NON_COUNCILOR_ROLES),
      paymentStatus: payment,
      status: "confirmada" as RegistrationStatus,
      amount: payment === "isento" ? 0 : ev.price,
      origin: rnd.weighted(ORIGINS),
      checkedInAt: null,
    })
  })

  // Presença: primeiros N confirmados (com pagamento ok)
  if (presentTarget > 0) {
    const isToday = ev.id === EVENT_IDS.capacitacao
    let eligible = rnd.shuffle(
      list.filter((r) => r.paymentStatus !== "pendente" && !(isToday && r.councilorId === FEATURED_IDS.carlos)),
    )
    if (isToday) {
      // Últimas entradas da narrativa: Ana Souza e Marcos Lima
      const lastOnes = [FEATURED_IDS.marcos, FEATURED_IDS.ana]
      const rest = eligible.filter((r) => !lastOnes.includes(r.councilorId ?? ""))
      const tail = lastOnes.map((id) => eligible.find((r) => r.councilorId === id)).filter((r): r is Registration => Boolean(r))
      eligible = [...rest.slice(0, presentTarget - tail.length), ...tail]
    }
    const start = new Date(ev.startDate)
    eligible.slice(0, presentTarget).forEach((r, k) => {
      const d = new Date(start)
      if (ev.status === "em_andamento") {
        // Chegadas da manhã: entre 35 min antes do início e 75 min após (ou até agora)
        const windowEnd = Math.min(Date.now() - 2 * 60_000, start.getTime() + 75 * 60_000)
        const windowStart = Math.min(start.getTime() - 35 * 60_000, windowEnd - 60 * 60_000)
        d.setTime(windowStart + ((windowEnd - windowStart) * (k + 1)) / presentTarget)
      } else {
        d.setMinutes(d.getMinutes() - 30 + Math.round((k / presentTarget) * 70))
      }
      r.checkedInAt = d.toISOString()
    })
  }

  // Ajustes narrativos
  if (ev.id === EVENT_IDS.seminario) {
    const carlos = list.find((r) => r.councilorId === FEATURED_IDS.carlos)
    if (carlos) {
      carlos.createdAt = todayAt(9, 42, 18)
      carlos.origin = "WhatsApp"
      carlos.paymentStatus = "confirmado"
      carlos.code = "U360-7F4A21"
    }
    const mendes = list.find((r) => r.councilorId === FEATURED_IDS.carlosMendes)
    if (mendes) {
      mendes.createdAt = todayAt(9, 42, 16)
      mendes.paymentStatus = "pendente"
    }
  }

  if (ev.id === EVENT_IDS.congresso) {
    for (const id of [FEATURED_IDS.carlos, FEATURED_IDS.joao, FEATURED_IDS.mariana]) {
      const r = list.find((x) => x.councilorId === id)
      if (!r) continue
      r.paymentStatus = "confirmado"
      if (!r.checkedInAt) {
        const swap = list.find((x) => x.checkedInAt && !x.councilorId)
        if (swap) swap.checkedInAt = null
        const at = new Date(ev.startDate)
        at.setHours(8, 12 + (hashString(id) % 40), 0, 0)
        r.checkedInAt = at.toISOString()
      }
    }
  }

  if (ev.id === EVENT_IDS.capacitacao) {
    const mariana = list.find((r) => r.councilorId === FEATURED_IDS.mariana)
    if (mariana) {
      if (!mariana.checkedInAt) {
        const swap = list.find((r) => r.checkedInAt && !r.councilorId)
        if (swap) swap.checkedInAt = null
      }
      mariana.paymentStatus = "confirmado"
      mariana.checkedInAt = todayAt(9, 35, 7)
    }
  }

  // Inscrições abandonadas (incompletas) vinculadas ao Radar
  if (ev.id === EVENT_IDS.seminario || ev.id === EVENT_IDS.serra) {
    const abandoned = pool.filter(
      (c) => c.situation === "inscricao_abandonada" && (c.situationDetail ?? "").includes(ev.id === EVENT_IDS.seminario ? "Seminário" : "Serra"),
    )
    abandoned.forEach((c, k) => {
      list.push({
        id: `ins-${ev.id.slice(3, 10)}-inc-${k}`,
        code: code(rnd),
        participantName: c.name,
        councilorId: c.id,
        eventId: ev.id,
        eventTitle: ev.title,
        createdAt: c.lastInteractionAt ?? spreadDate(rnd, 3, 0),
        chamberName: c.chamberName,
        municipalityName: c.municipalityName,
        role: c.role,
        paymentStatus: "pendente",
        status: "incompleta",
        amount: ev.price,
        origin: rnd.weighted(ORIGINS),
        checkedInAt: null,
      })
    })
  }

  // Alguns cancelamentos e lista de espera para realismo
  list.forEach((r) => {
    if (r.status === "confirmada" && r.paymentStatus === "pendente" && rnd.chance(0.12)) r.status = "cancelada"
  })

  return list
}

export function buildCertificates(events: UvergsEvent[], registrations: Registration[], councilors: Councilor[]) {
  const rnd = createRandom(912)
  const certificates: Certificate[] = []
  const eventById = new Map(events.map((e) => [e.id, e]))
  const pastHandcrafted = [EVENT_IDS.congresso, EVENT_IDS.sul, EVENT_IDS.saude, EVENT_IDS.fronteira, EVENT_IDS.regimento]

  for (const evId of pastHandcrafted) {
    const ev = eventById.get(evId)!
    const attendees = registrations.filter((r) => r.eventId === evId && r.checkedInAt)
    const issueDay = new Date(ev.endDate ?? ev.startDate)
    issueDay.setDate(issueDay.getDate() + (evId === EVENT_IDS.congresso ? 8 : 5))
    issueDay.setHours(9, 18, 0, 0)
    attendees.forEach((r, k) => {
      const issued = k < ev.certificatesIssued
      const at = new Date(issueDay)
      at.setMinutes(at.getMinutes() + Math.floor(k / 8))
      certificates.push({
        id: `cert-${evId.slice(3, 9)}-${k}`,
        code: `UVG-${new Date(ev.startDate).getFullYear()}-${String(hashString(r.id) % 1_000_000).padStart(6, "0")}`,
        participantName: r.participantName,
        councilorId: r.councilorId,
        chamberName: r.chamberName,
        eventId: ev.id,
        eventTitle: ev.title,
        eventDate: ev.startDate,
        city: ev.city,
        workload: ev.workload,
        issuedAt: at.toISOString(),
        status: issued ? "emitido" : rnd.chance(0.15) ? "revogado" : "pendente",
      })
    })
  }

  // Certificado de hoje (atividade recente: "Certificado emitido — João Ferreira")
  const joao = councilors.find((c) => c.id === FEATURED_IDS.joao)
  const congresso = eventById.get(EVENT_IDS.congresso)!
  const joaoCert = certificates.find((c) => c.councilorId === FEATURED_IDS.joao && c.eventId === EVENT_IDS.congresso)
  if (joaoCert) {
    joaoCert.issuedAt = todayAt(9, 18, 42)
    joaoCert.status = "emitido"
  } else if (joao) {
    certificates.unshift({
      id: "cert-joao-hoje",
      code: "UVG-2026-048213",
      participantName: joao.name,
      councilorId: joao.id,
      chamberName: joao.chamberName,
      eventId: congresso.id,
      eventTitle: congresso.title,
      eventDate: congresso.startDate,
      city: congresso.city,
      workload: congresso.workload,
      issuedAt: todayAt(9, 18, 42),
      status: "emitido",
    })
  }

  // Certificados históricos de Carlos Eduardo Martins (5 no total)
  const carlosCerts = certificates.filter((c) => c.councilorId === FEATURED_IDS.carlos)
  const carlos = councilors.find((c) => c.id === FEATURED_IDS.carlos)!
  const olderThanCongresso = (e: UvergsEvent) => Date.now() - new Date(e.startDate).getTime() > 35 * 86_400_000
  const history = events
    .filter((e) => e.status === "encerrado" && !pastHandcrafted.includes(e.id as never) && olderThanCongresso(e))
    .sort((a, b) => Number(b.regionId === "serra") - Number(a.regionId === "serra"))
    .slice(0, 5 - carlosCerts.length)
  history.forEach((ev, k) => {
    const at = new Date(ev.startDate)
    at.setDate(at.getDate() + 4)
    certificates.push({
      id: `cert-carlos-${k}`,
      code: `UVG-${at.getFullYear()}-${String(310_442 + k * 7919).padStart(6, "0")}`,
      participantName: carlos.name,
      councilorId: carlos.id,
      chamberName: carlos.chamberName,
      eventId: ev.id,
      eventTitle: ev.title,
      eventDate: ev.startDate,
      city: ev.city,
      workload: ev.workload,
      issuedAt: at.toISOString(),
      status: "emitido",
    })
  })
  const congressoCarlos = certificates.find((c) => c.councilorId === FEATURED_IDS.carlos && c.eventId === EVENT_IDS.congresso)
  if (congressoCarlos) {
    congressoCarlos.status = "emitido"
    congressoCarlos.code = "UVG-2026-000412"
  }

  return certificates.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
}

const COMMENTS_PROMOTER = [
  "Conteúdo excelente e muito aplicado à realidade das Câmaras.",
  "Organização impecável, palestrantes de alto nível.",
  "Saio com ideias concretas para aplicar no meu mandato.",
  "A oficina de fiscalização de contratos foi o ponto alto.",
  "Credenciamento rápido e material muito bem feito.",
  "Excelente oportunidade de troca com colegas de outras regiões.",
  "Painel de orçamento muito didático. Parabéns à UVERGS!",
]
const COMMENTS_PASSIVE = [
  "Bom evento, mas algumas palestras poderiam ser mais curtas.",
  "Gostaria de mais tempo para perguntas.",
  "Conteúdo bom, o almoço poderia ser melhor organizado.",
]
const COMMENTS_DETRACTOR = [
  "O som do auditório atrapalhou no segundo dia.",
  "Faltou material impresso para acompanhar as palestras.",
]

/** Distribuições calibradas: Congresso → NPS 72, 138 respostas, nota média 9,1. */
const EVAL_PLAN: Record<string, { responses: number; promoters: number; detractors: number }> = {
  [EVENT_IDS.congresso]: { responses: 138, promoters: 108, detractors: 8 },
  [EVENT_IDS.sul]: { responses: 42, promoters: 31, detractors: 2 },
  [EVENT_IDS.saude]: { responses: 51, promoters: 40, detractors: 2 },
  [EVENT_IDS.fronteira]: { responses: 30, promoters: 21, detractors: 3 },
  [EVENT_IDS.regimento]: { responses: 77, promoters: 58, detractors: 4 },
}

export function buildEvaluations(events: UvergsEvent[], registrations: Registration[]) {
  const rnd = createRandom(7272)
  const evaluations: Evaluation[] = []
  for (const [eventId, plan] of Object.entries(EVAL_PLAN)) {
    const ev = events.find((e) => e.id === eventId)!
    const attendees = rnd.shuffle(registrations.filter((r) => r.eventId === eventId && r.checkedInAt))
    const end = new Date(ev.endDate ?? ev.startDate)
    for (let k = 0; k < plan.responses; k++) {
      const r = attendees[k % attendees.length]
      const kind = k < plan.promoters ? "p" : k < plan.promoters + plan.detractors ? "d" : "n"
      const score = kind === "p" ? (rnd.chance(0.72) ? 10 : 9) : kind === "n" ? rnd.pick([7, 8, 8]) : rnd.pick([5, 6, 6])
      const rating = kind === "p" ? (rnd.chance(0.46) ? 10 : 9) : kind === "n" ? rnd.pick([8, 8, 9]) : rnd.pick([6, 7])
      const at = new Date(end)
      at.setHours(at.getHours() + rnd.int(2, 24 * 6))
      evaluations.push({
        id: `av-${eventId.slice(3, 9)}-${k}`,
        eventId,
        eventTitle: ev.title,
        respondentName: r.participantName,
        chamberName: r.chamberName,
        score,
        rating,
        comment: rnd.chance(kind === "p" ? 0.45 : 0.8) ? rnd.pick(kind === "p" ? COMMENTS_PROMOTER : kind === "n" ? COMMENTS_PASSIVE : COMMENTS_DETRACTOR) : "",
        interests: rnd.sample(INTERESTS.slice(0, 11), rnd.int(1, 3)),
        at: at.toISOString(),
      })
    }
  }
  return evaluations.sort((a, b) => b.at.localeCompare(a.at))
}
