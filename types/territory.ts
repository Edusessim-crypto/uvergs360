export type RegionId =
  | "metropolitana"
  | "serra"
  | "litoral"
  | "vales"
  | "central"
  | "missoes"
  | "norte"
  | "fronteira"
  | "sul"

export interface Region {
  id: RegionId
  name: string
  shortName: string
  municipalitiesCount: number
  chambersCount: number
  councilorsCount: number
  participations: number
  reachedCount: number
  dataQuality: number
  eventsCount: number
  activity30d: number
}

export interface Municipality {
  /** Código IBGE */
  id: string
  name: string
  regionId: RegionId
  regionName: string
  microregion: string
  chamberId: string | null
  seats: number
  councilorsCount: number
  participations: number
  eventsAttended: number
  activity30d: number
  dataQuality: number
  reached: boolean
  lastActivityAt: string | null
}

export type TerritoryMetric = "participacao" | "cadastros" | "eventos" | "atividade"

export interface TerritoryOverview {
  municipalitiesTotal: number
  municipalitiesReached: number
  chambersRegistered: number
  councilorsRegistered: number
  participations: number
}
