/**
 * DADOS DE DEMONSTRAÇÃO — Câmaras e vereadores.
 * Pessoas são fictícias; municípios são reais.
 */
import type { Chamber, Councilor, CouncilorRole, Municipality, RadarSituation } from "@/types"
import { createRandom, type Random } from "@/lib/random"
import { normalize, slugify } from "@/lib/utils"
import { FIRST_NAMES_F, FIRST_NAMES_M, INTERESTS, STREETS, SURNAMES } from "./_names"
import { REGION_META } from "./territory"
import { dayAt, daysAgo, todayAt } from "./_clock"

export const RADAR_TARGETS: Record<RadarSituation, number> = {
  inscricao_abandonada: 23,
  sem_interacao: 47,
  cadastro_incompleto: 31,
  portal_nao_ativado: 84,
  nunca_participou: 628,
}

/** Pessoas em destaque na narrativa da demonstração. */
const FEATURED: {
  key: string
  name: string
  gender: "M" | "F"
  municipality: string
  role?: CouncilorRole
  situation?: RadarSituation | null
}[] = [
  { key: "carlos-eduardo-martins", name: "Carlos Eduardo Martins", gender: "M", municipality: "Gramado", situation: null },
  { key: "lucas-martins", name: "Lucas Martins", gender: "M", municipality: "Canoas", situation: "inscricao_abandonada" },
  { key: "carlos-mendes", name: "Carlos Mendes", gender: "M", municipality: "Santa Cruz do Sul", situation: null },
  { key: "mariana-alves", name: "Mariana Alves", gender: "F", municipality: "Caxias do Sul", situation: null },
  { key: "joao-ferreira", name: "João Ferreira", gender: "M", municipality: "Pelotas", situation: null },
  { key: "ana-souza", name: "Ana Souza", gender: "F", municipality: "Novo Hamburgo", situation: null },
  { key: "marcos-lima", name: "Marcos Lima", gender: "M", municipality: "Passo Fundo", situation: null },
  { key: "renata-bortolini", name: "Renata Bortolini", gender: "F", municipality: "Bento Gonçalves", situation: "sem_interacao" },
  { key: "paulo-zanella", name: "Paulo Zanella", gender: "M", municipality: "Farroupilha", situation: "inscricao_abandonada" },
]

export const FEATURED_IDS = {
  carlos: "vr-carlos-eduardo-martins",
  lucas: "vr-lucas-martins",
  carlosMendes: "vr-carlos-mendes",
  mariana: "vr-mariana-alves",
  joao: "vr-joao-ferreira",
  ana: "vr-ana-souza",
  marcos: "vr-marcos-lima",
}

function makeName(rnd: Random, gender: "M" | "F") {
  const first = rnd.pick(gender === "M" ? FIRST_NAMES_M : FIRST_NAMES_F)
  const withMiddle = rnd.chance(0.28)
  const middle = withMiddle ? " " + rnd.pick(gender === "M" ? FIRST_NAMES_M : FIRST_NAMES_F) : ""
  const last = rnd.pick(SURNAMES)
  const last2 = rnd.chance(0.35) ? " " + rnd.pick(SURNAMES) : ""
  const name = `${first}${middle} ${last}${last2}`
  return name.split(" ").length > 4 ? `${first} ${last}${last2}` : name
}

function makeCpf(rnd: Random) {
  return Array.from({ length: 11 }, () => rnd.int(0, 9)).join("")
}

function makePhone(rnd: Random, ddd: string, mobile = true) {
  return mobile
    ? `(${ddd}) 9${rnd.int(8100, 9999)}-${rnd.int(1000, 9999)}`
    : `(${ddd}) 3${rnd.int(200, 799)}-${rnd.int(1000, 9999)}`
}

function emailFor(name: string, domain: string) {
  const parts = normalize(name).split(" ")
  return `${parts[0]}.${parts[parts.length - 1]}@${domain}`.replace(/[^a-z0-9.@-]/g, "")
}

export function buildPeople(municipalities: Municipality[]) {
  const rnd = createRandom(2025)
  const chambers: Chamber[] = []
  const councilors: Councilor[] = []

  const byName = new Map(municipalities.map((m) => [m.name, m]))
  const featuredByMunicipality = new Map<string, typeof FEATURED>()
  for (const f of FEATURED) {
    const list = featuredByMunicipality.get(f.municipality) ?? []
    list.push(f)
    featuredByMunicipality.set(f.municipality, list)
  }

  let seq = 1
  for (const m of municipalities) {
    if (!m.chamberId) continue
    const meta = REGION_META[m.regionId]
    const slug = slugify(m.name).replace(/-/g, "")
    const domain = `camara${slug}.rs.leg.br`
    const chamberName = `Câmara Municipal de ${m.name}`
    const featured = featuredByMunicipality.get(m.name) ?? []

    const members: Councilor[] = []
    for (let s = 0; s < m.seats; s++) {
      const f = featured[s]
      const gender: "M" | "F" = f ? f.gender : rnd.chance(0.19) ? "F" : "M"
      const name = f ? f.name : makeName(rnd, gender)
      const role: CouncilorRole =
        f?.role ??
        (s === 1 && !f ? "Presidente"
          : s === 2 ? "Vice-presidente"
          : s === 3 ? "1º Secretário"
          : s === 4 ? "2º Secretário"
          : gender === "F" ? "Vereadora" : "Vereador")
      const id = f ? `vr-${f.key}` : `vr-${String(seq).padStart(4, "0")}`
      seq++
      const interests = rnd.sample(INTERESTS, rnd.int(2, 5))
      members.push({
        id,
        name,
        gender,
        cpf: makeCpf(rnd),
        email: emailFor(name, domain),
        emailValid: true,
        phone: makePhone(rnd, meta.ddd),
        role,
        mandate: "2025–2028",
        municipalityId: m.id,
        municipalityName: m.name,
        regionId: m.regionId,
        regionName: meta.shortName,
        chamberId: m.chamberId,
        chamberName,
        status: "ativo",
        portalActive: true,
        profileComplete: true,
        situation: null,
        priorityScore: 0,
        lastInteractionAt: daysAgo(rnd.int(0, 70), rnd.int(8, 19), rnd.int(0, 59)),
        eventsCount: 0,
        certificatesCount: 0,
        participationsYear: 0,
        participation: "baixa",
        engagementScore: 0,
        interests,
        preferredChannel: rnd.weighted([
          { value: "WhatsApp" as const, weight: 5 },
          { value: "E-mail" as const, weight: 4 },
          { value: "Telefone" as const, weight: 1 },
        ]),
        birthDate: dayAt(-rnd.int(28 * 365, 68 * 365)),
        firstTerm: rnd.chance(0.44),
        createdAt: daysAgo(rnd.int(200, 1100)),
        isDemoFeatured: Boolean(f),
      })
    }
    councilors.push(...members)

    const president = members.find((c) => c.role === "Presidente") ?? members[0]
    const adminGenderF = rnd.chance(0.6)
    chambers.push({
      id: m.chamberId,
      name: chamberName,
      municipalityId: m.id,
      municipalityName: m.name,
      regionId: m.regionId,
      regionName: meta.shortName,
      phone: makePhone(rnd, meta.ddd, false),
      email: `contato@${domain}`,
      website: `www.${domain}`,
      address: `${rnd.pick(STREETS)}, ${rnd.int(40, 1900)} — Centro, ${m.name}/RS`,
      president: president.name,
      presidentId: president.id,
      adminContact: makeName(rnd, adminGenderF ? "F" : "M"),
      adminContactRole: rnd.pick(
        adminGenderF
          ? ["Diretora Administrativa", "Secretária-geral", "Coordenadora Legislativa"]
          : ["Diretor Administrativo", "Secretário-geral", "Chefe de Gabinete"],
      ),
      councilorsCount: m.seats,
      participantsYear: 0,
      eventsCount: m.eventsAttended,
      certificatesCount: 0,
      dataQuality: m.dataQuality,
      updatedAt: daysAgo(rnd.int(2, 150)),
      status: "atualizada",
      portalActive: true,
    })
  }

  assignRadarSituations(councilors, rnd)
  assignParticipation(councilors, municipalities, rnd)
  assignChamberHealth(chambers, rnd)

  // Participantes e certificados por Câmara derivados dos vereadores
  const byChamber = new Map<string, Councilor[]>()
  for (const c of councilors) {
    const list = byChamber.get(c.chamberId) ?? []
    list.push(c)
    byChamber.set(c.chamberId, list)
  }
  for (const ch of chambers) {
    const list = byChamber.get(ch.id) ?? []
    const m = byName.get(ch.municipalityName)
    ch.participantsYear = m ? m.participations : 0
    ch.certificatesCount = list.reduce((a, c) => a + c.certificatesCount, 0)
  }

  applyFeaturedDetails(councilors, chambers)
  return { chambers, councilors }
}

function assignRadarSituations(councilors: Councilor[], rnd: Random) {
  const featuredSituations = new Map(FEATURED.map((f) => [`vr-${f.key}`, f.situation]))
  const pool = rnd.shuffle(councilors.filter((c) => !featuredSituations.has(c.id)))
  const counts: Record<RadarSituation, number> = { ...RADAR_TARGETS }

  for (const c of councilors) {
    const s = featuredSituations.get(c.id)
    if (s) {
      c.situation = s
      counts[s]--
    }
  }

  const taken = new Set<string>()
  const takeFrom = (list: Councilor[], n: number, s: RadarSituation) => {
    let got = 0
    for (let i = 0; i < list.length && got < n; i++) {
      const c = list[i]
      if (taken.has(c.id) || c.situation) continue
      c.situation = s
      taken.add(c.id)
      got++
    }
    return got
  }
  // "Sem interação recente" com concentração na Serra e no Norte (sinal regional)
  const serraGot = takeFrom(pool.filter((c) => c.regionId === "serra"), 17, "sem_interacao")
  const norteGot = takeFrom(pool.filter((c) => c.regionId === "norte"), 9, "sem_interacao")
  takeFrom(pool, counts.sem_interacao - serraGot - norteGot, "sem_interacao")
  takeFrom(pool, counts.inscricao_abandonada, "inscricao_abandonada")
  takeFrom(pool.slice(200), counts.cadastro_incompleto, "cadastro_incompleto")
  takeFrom(pool.slice(400), counts.portal_nao_ativado, "portal_nao_ativado")
  takeFrom(pool.slice(700), counts.nunca_participou, "nunca_participou")

  const abandonedEvents = ["Seminário de Gestão Pública", "Seminário de Gestão Pública", "Encontro Regional Serra"]
  for (const c of councilors) {
    switch (c.situation) {
      case "inscricao_abandonada":
        c.situationDetail = `${rnd.pick(abandonedEvents)} — parou na etapa ${rnd.int(2, 3)} de 4`
        c.lastInteractionAt = daysAgo(rnd.int(0, 3), rnd.int(8, 18), rnd.int(0, 59))
        c.priorityScore = rnd.int(82, 97)
        break
      case "sem_interacao":
        c.lastInteractionAt = daysAgo(rnd.int(92, 260))
        c.situationDetail = "Sem abrir comunicações nos últimos 90 dias"
        c.priorityScore = rnd.int(60, 86)
        break
      case "cadastro_incompleto":
        c.emailValid = false
        c.profileComplete = false
        c.status = "incompleto"
        c.email = c.email.replace("@", rnd.chance(0.5) ? "@@" : ".")
        c.situationDetail = rnd.pick(["E-mail inválido", "E-mail retornou (bounce)", "E-mail inválido e telefone desatualizado"])
        c.priorityScore = rnd.int(55, 78)
        break
      case "portal_nao_ativado":
        c.portalActive = false
        c.situationDetail = `Convite enviado há ${rnd.int(4, 40)} dias`
        c.priorityScore = rnd.int(38, 62)
        break
      case "nunca_participou":
        c.portalActive = false
        c.situationDetail = c.firstTerm ? "Primeiro mandato — nenhum evento" : "Nenhum evento no mandato atual"
        c.priorityScore = rnd.int(18, c.firstTerm ? 58 : 44)
        c.lastInteractionAt = rnd.chance(0.6) ? daysAgo(rnd.int(30, 300)) : null
        break
    }
  }
}

function assignParticipation(councilors: Councilor[], municipalities: Municipality[], rnd: Random) {
  const perSeat = new Map(municipalities.map((m) => [m.id, m.seats ? m.participations / m.seats : 0]))
  for (const c of councilors) {
    if (c.situation === "nunca_participou") {
      c.eventsCount = 0
      c.participationsYear = 0
      c.certificatesCount = 0
    } else {
      const base = perSeat.get(c.municipalityId) ?? 1
      const year = Math.max(c.situation === "sem_interacao" ? 0 : 1, Math.round(base * rnd.float(0.2, 1.1)))
      c.participationsYear = Math.min(9, year)
      c.eventsCount = c.participationsYear + rnd.int(0, 6)
      c.certificatesCount = Math.max(0, c.eventsCount - rnd.int(0, 2))
    }
    c.participation =
      c.participationsYear >= 4 ? "alta" : c.participationsYear >= 2 ? "media" : c.participationsYear >= 1 ? "baixa" : "nenhuma"
    const recency = c.lastInteractionAt ? Math.max(0, 100 - (Date.now() - new Date(c.lastInteractionAt).getTime()) / 86_400_000) : 0
    c.engagementScore = Math.round(Math.min(98, c.participationsYear * 9 + recency * 0.35 + (c.portalActive ? 12 : 0) + rnd.int(0, 10)))
    if (c.situation === null) c.priorityScore = rnd.int(4, 30)
  }
}

function assignChamberHealth(chambers: Chamber[], rnd: Random) {
  const shuffled = rnd.shuffle(chambers.filter((c) => !["Gramado", "Porto Alegre", "Caxias do Sul", "Canoas"].includes(c.municipalityName)))
  shuffled.slice(0, 12).forEach((c) => {
    c.status = "desatualizada"
    c.dataQuality = rnd.int(41, 66)
    c.updatedAt = daysAgo(rnd.int(190, 420))
  })
  shuffled.slice(12, 21).forEach((c) => {
    c.status = "pendente"
    c.portalActive = false
    c.dataQuality = rnd.int(62, 78)
  })
}

function applyFeaturedDetails(councilors: Councilor[], chambers: Chamber[]) {
  const carlos = councilors.find((c) => c.id === FEATURED_IDS.carlos)
  if (carlos) {
    Object.assign(carlos, {
      role: "Vereador",
      email: "carlos.martins@camaragramado.rs.leg.br",
      phone: "(54) 99812-4410",
      cpf: "48213076052",
      status: "ativo",
      portalActive: true,
      profileComplete: true,
      situation: null,
      lastInteractionAt: todayAt(9, 42, 18),
      eventsCount: 6,
      certificatesCount: 5,
      participationsYear: 3,
      participation: "media",
      engagementScore: 86,
      interests: ["Gestão pública", "Turismo", "Orçamento e finanças", "Tecnologia e inovação"],
      preferredChannel: "WhatsApp",
      firstTerm: false,
      birthDate: dayAt(-(47 * 365 + 120)),
      createdAt: daysAgo(1012),
    } satisfies Partial<Councilor>)
  }

  const lucas = councilors.find((c) => c.id === FEATURED_IDS.lucas)
  if (lucas) {
    lucas.lastInteractionAt = todayAt(8, 57, 64)
    lucas.situationDetail = "Seminário de Gestão Pública — parou na etapa 3 de 4"
    lucas.priorityScore = 98
  }

  const gramado = chambers.find((c) => c.municipalityName === "Gramado")
  if (gramado) {
    gramado.status = "atualizada"
    gramado.dataQuality = 96
    gramado.updatedAt = daysAgo(1, 16, 20)
    gramado.phone = "(54) 3286-0100"
    gramado.address = "Rua São Pedro, 369 — Centro, Gramado/RS"
    gramado.participantsYear = 28
    gramado.eventsCount = 14
  }
}
