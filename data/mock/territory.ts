/**
 * DADOS DE DEMONSTRAÇÃO — território.
 * Os 497 municípios e seus códigos IBGE são reais (seed/municipios-rs.json).
 * As métricas de relacionamento são simuladas de forma determinística.
 */
import seed from "./seed/municipios-rs.json"
import type { Municipality, RegionId } from "@/types"
import { createRandom } from "@/lib/random"
import { daysAgo } from "./_clock"

export const REGION_META: Record<RegionId, { name: string; shortName: string; ddd: string; factor: number }> = {
  metropolitana: { name: "Região Metropolitana", shortName: "Metropolitana", ddd: "51", factor: 1.1 },
  serra: { name: "Serra Gaúcha", shortName: "Serra", ddd: "54", factor: 1.28 },
  litoral: { name: "Litoral Norte", shortName: "Litoral", ddd: "51", factor: 0.9 },
  vales: { name: "Vales", shortName: "Vales", ddd: "51", factor: 1.06 },
  central: { name: "Região Central", shortName: "Central", ddd: "55", factor: 1.0 },
  missoes: { name: "Missões e Noroeste", shortName: "Missões", ddd: "55", factor: 0.92 },
  norte: { name: "Norte e Alto Uruguai", shortName: "Norte", ddd: "54", factor: 0.96 },
  fronteira: { name: "Fronteira Oeste e Campanha", shortName: "Fronteira", ddd: "55", factor: 0.74 },
  sul: { name: "Região Sul", shortName: "Sul", ddd: "53", factor: 0.84 },
}

export const REGION_ORDER: RegionId[] = [
  "metropolitana", "serra", "vales", "litoral", "central", "norte", "missoes", "fronteira", "sul",
]

const MICRO_TO_REGION: Record<string, RegionId> = {
  "Porto Alegre": "metropolitana",
  "São Jerônimo": "metropolitana",
  Montenegro: "metropolitana",
  "Caxias do Sul": "serra",
  "Gramado-Canela": "serra",
  "Guaporé": "serra",
  Vacaria: "serra",
  "Osório": "litoral",
  "Santa Cruz do Sul": "vales",
  "Lajeado-Estrela": "vales",
  "Cachoeira do Sul": "vales",
  Soledade: "vales",
  "Santa Maria": "central",
  "Restinga Seca": "central",
  Santiago: "central",
  "Santa Rosa": "missoes",
  "Três Passos": "missoes",
  "Cerro Largo": "missoes",
  "Santo Ângelo": "missoes",
  "Ijuí": "missoes",
  "Cruz Alta": "missoes",
  "Frederico Westphalen": "norte",
  Erechim: "norte",
  Sananduva: "norte",
  "Passo Fundo": "norte",
  Carazinho: "norte",
  "Não-Me-Toque": "norte",
  "Campanha Ocidental": "fronteira",
  "Campanha Central": "fronteira",
  "Campanha Meridional": "fronteira",
  "Serras de Sudeste": "sul",
  Pelotas: "sul",
  "Jaguarão": "sul",
  "Litoral Lagunar": "sul",
  "Camaquã": "sul",
}

/** Número de cadeiras por município (demais: 9). Ajustado para totalizar 4.812. */
const SEATS: Record<string, number> = {
  "Porto Alegre": 36,
  "Caxias do Sul": 23,
  Canoas: 21, Pelotas: 21, "Santa Maria": 21, "Gravataí": 21, "Viamão": 21, "Novo Hamburgo": 21, "São Leopoldo": 21,
  "Rio Grande": 17, Alvorada: 17, "Passo Fundo": 17, "Sapucaia do Sul": 17, Uruguaiana: 17, "Santa Cruz do Sul": 17,
  Cachoeirinha: 17, "Bagé": 17, "Bento Gonçalves": 17,
  Erechim: 15, "Guaíba": 15, "Cachoeira do Sul": 15, "Sant'Ana do Livramento": 15, Esteio: 15, "Ijuí": 15,
  Sapiranga: 15, "Santo Ângelo": 15, Lajeado: 15, Alegrete: 15, Farroupilha: 15, "Venâncio Aires": 15,
  "Santa Rosa": 15, "Camaquã": 13, Vacaria: 13, Montenegro: 13, "Campo Bom": 13, Carazinho: 13, "Cruz Alta": 13,
  Taquara: 13, "São Borja": 13, "Parobé": 13, "Canguçu": 13, "Estância Velha": 13, "Tramandaí": 13, "Capão da Canoa": 13,
  "Santiago": 11, "São Gabriel": 11, "Osório": 11, "Canela": 11, "Estrela": 11, "Panambi": 11, "Frederico Westphalen": 11,
  Torres: 11, "Charqueadas": 11, "Rosário do Sul": 11, "Dom Pedrito": 11, "Itaqui": 11, "Garibaldi": 11,
  "Carlos Barbosa": 11, "Flores da Cunha": 11, "Nova Prata": 11, "Guaporé": 9, Gramado: 9,
}

const TARGET_COUNCILORS = 4812
const TARGET_PARTICIPATIONS = 6284
const PROTECTED = new Set(Object.keys(SEATS))

type Seed = { id: string; nome: string; micro: string }

export function buildMunicipalities(): Municipality[] {
  const rnd = createRandom(4300)
  const rows = seed as Seed[]

  // Municípios sem Câmara cadastrada (10) e não alcançados (5)
  const smallOnes = rows.filter((r) => !PROTECTED.has(r.nome))
  const notRegistered = new Set(rnd.sample(smallOnes, 10).map((r) => r.id))
  const notReached = new Set([...notRegistered].slice(0, 5))

  const base = rows.map((r) => {
    const regionId = MICRO_TO_REGION[r.micro] ?? "central"
    const registered = !notRegistered.has(r.id)
    return {
      row: r,
      regionId,
      registered,
      reached: !notReached.has(r.id),
      seats: registered ? (SEATS[r.nome] ?? 9) : 0,
    }
  })

  // Ajuste fino para o total de 4.812 vereadores cadastrados
  let total = base.reduce((a, b) => a + b.seats, 0)
  const adjustable = rnd.shuffle(base.filter((b) => b.registered && !PROTECTED.has(b.row.nome)))
  let i = 0
  while (total < TARGET_COUNCILORS && i < adjustable.length * 3) {
    const item = adjustable[i % adjustable.length]
    if (item.seats < 13) {
      item.seats += 2
      total += 2
    }
    i++
  }

  // Participações distribuídas por peso (cadeiras × engajamento regional)
  const weights = base.map((b) =>
    b.reached ? Math.max(0.6, b.seats * REGION_META[b.regionId].factor * rnd.float(0.35, 1.7)) : 0,
  )
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => (w / weightSum) * TARGET_PARTICIPATIONS)
  const floors = raw.map((v, idx) => (base[idx].reached ? Math.max(1, Math.floor(v)) : 0))
  let remaining = TARGET_PARTICIPATIONS - floors.reduce((a, b) => a + b, 0)
  const order = raw.map((v, idx) => ({ idx, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac)
  for (let k = 0; remaining !== 0 && k < order.length * 2; k++) {
    const { idx } = order[k % order.length]
    if (!base[idx].reached) continue
    if (remaining > 0) {
      floors[idx]++
      remaining--
    } else if (floors[idx] > 1) {
      floors[idx]--
      remaining++
    }
  }

  return base.map((b, idx) => {
    const participations = floors[idx]
    const perSeat = b.seats ? participations / b.seats : 0
    const eventsAttended = b.reached ? Math.min(38, Math.max(1, Math.round(Math.sqrt(participations) * rnd.float(1.1, 1.9)))) : 0
    const activity30d = b.reached ? Math.max(0, Math.round(participations * rnd.float(0.06, 0.24) + rnd.int(0, 3))) : 0
    const dataQuality = b.registered ? Math.round(Math.min(100, 58 + perSeat * 14 + rnd.float(0, 24))) : 0
    return {
      id: b.row.id,
      name: b.row.nome,
      regionId: b.regionId,
      regionName: REGION_META[b.regionId].shortName,
      microregion: b.row.micro,
      chamberId: b.registered ? `cm-${b.row.id}` : null,
      seats: b.seats,
      councilorsCount: b.seats,
      participations,
      eventsAttended,
      activity30d,
      dataQuality,
      reached: b.reached,
      lastActivityAt: b.reached ? daysAgo(rnd.int(0, 75), rnd.int(8, 18), rnd.int(0, 59)) : null,
    } satisfies Municipality
  })
}
