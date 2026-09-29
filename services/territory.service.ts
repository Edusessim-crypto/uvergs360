import type { Region, RegionId, TerritoryOverview } from "@/types"
import { REGION_META, REGION_ORDER } from "@/data/mock/territory"
import { mockRead } from "./_mock-client"

export interface GeoFeature {
  type: "Feature"
  properties: { id: string }
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] }
}

export interface GeoCollection {
  type: "FeatureCollection"
  features: GeoFeature[]
}

let geoCache: Promise<GeoCollection> | null = null

/**
 * Território RS.
 * Etapa 2 → GET /api/territory/overview, GET /api/territory/regions,
 * GET /api/territory/municipalities (agregações materializadas no PostgreSQL).
 * Malha: hoje um GeoJSON estático do IBGE em /public/geo; futuramente pode vir de
 * PostGIS ou de um bucket com versões simplificadas por nível de zoom.
 */
export const territoryService = {
  getOverview() {
    return mockRead((db): TerritoryOverview => ({
      municipalitiesTotal: db.municipalities.length,
      municipalitiesReached: db.municipalities.filter((m) => m.reached).length,
      chambersRegistered: db.chambers.length,
      councilorsRegistered: db.councilors.length,
      participations: db.municipalities.reduce((a, m) => a + m.participations, 0),
    }))
  },

  getRegions() {
    return mockRead((db): Region[] =>
      REGION_ORDER.map((id: RegionId) => {
        const ms = db.municipalities.filter((m) => m.regionId === id)
        const registered = ms.filter((m) => m.chamberId)
        return {
          id,
          name: REGION_META[id].name,
          shortName: REGION_META[id].shortName,
          municipalitiesCount: ms.length,
          chambersCount: registered.length,
          councilorsCount: db.councilors.filter((c) => c.regionId === id).length,
          participations: ms.reduce((a, m) => a + m.participations, 0),
          reachedCount: ms.filter((m) => m.reached).length,
          dataQuality: Math.round(registered.reduce((a, m) => a + m.dataQuality, 0) / Math.max(1, registered.length)),
          eventsCount: db.events.filter((e) => e.regionId === id && e.format !== "Online").length,
          activity30d: ms.reduce((a, m) => a + m.activity30d, 0),
        }
      }),
    )
  },

  getMunicipalities() {
    return mockRead((db) => db.municipalities)
  },

  getMunicipality(id: string) {
    return mockRead((db) => {
      const municipality = db.municipalities.find((m) => m.id === id) ?? null
      const chamber = db.chambers.find((c) => c.municipalityId === id) ?? null
      const councilors = db.councilors.filter((c) => c.municipalityId === id)
      return { municipality, chamber, councilors }
    }, [80, 180])
  },

  getGeoJSON(): Promise<GeoCollection> {
    geoCache ||= fetch("/geo/rs-municipios.geojson").then((r) => {
      if (!r.ok) throw new Error("Falha ao carregar a malha territorial")
      return r.json()
    })
    return geoCache
  },
}
