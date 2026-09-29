"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { territoryService } from "@/services"
import { qk } from "@/lib/query-keys"
import type { Municipality, RegionId, TerritoryMetric } from "@/types"
import { SEQUENTIAL } from "@/components/charts/chart-kit"
import { buildQuantileScale, useProjectedMap } from "./rs-map"

export function useTerritoryData() {
  const geo = useQuery({ queryKey: qk.geo, queryFn: () => territoryService.getGeoJSON(), staleTime: Infinity })
  const municipalities = useQuery({ queryKey: qk.municipalities, queryFn: () => territoryService.getMunicipalities() })
  const regions = useQuery({ queryKey: qk.regions, queryFn: () => territoryService.getRegions() })
  const map = useProjectedMap(geo.data)

  const regionOf = React.useMemo(() => {
    const r: Record<string, RegionId> = {}
    municipalities.data?.forEach((m) => (r[m.id] = m.regionId))
    return r
  }, [municipalities.data])

  const byId = React.useMemo(() => new Map((municipalities.data ?? []).map((m) => [m.id, m])), [municipalities.data])

  return {
    map,
    municipalities: municipalities.data,
    regions: regions.data,
    regionOf,
    byId,
    loading: geo.isLoading || municipalities.isLoading || regions.isLoading,
    error: geo.error || municipalities.error,
  }
}

export const METRIC_META: Record<TerritoryMetric, { label: string; unit: string; legend: string; value: (m: Municipality) => number; format: (v: number) => string }> = {
  participacao: { label: "Participação", unit: "participações", legend: "Participações no ano", value: (m) => m.participations, format: (v) => v.toLocaleString("pt-BR") },
  cadastros: { label: "Cadastros", unit: "% de qualidade", legend: "Qualidade cadastral da Câmara", value: (m) => m.dataQuality, format: (v) => `${v}%` },
  eventos: { label: "Eventos", unit: "eventos", legend: "Eventos com participação do município", value: (m) => m.eventsAttended, format: (v) => v.toLocaleString("pt-BR") },
  atividade: { label: "Atividade", unit: "interações (30 dias)", legend: "Interações nos últimos 30 dias", value: (m) => m.activity30d, format: (v) => v.toLocaleString("pt-BR") },
}

export function useChoropleth(municipalities: Municipality[] | undefined, metric: TerritoryMetric) {
  return React.useMemo(() => {
    if (!municipalities) return { fills: {}, scale: null }
    const meta = METRIC_META[metric]
    const values = municipalities.map(meta.value)
    const scale = buildQuantileScale(values, SEQUENTIAL.slice(1))
    const fills: Record<string, string> = {}
    municipalities.forEach((m) => (fills[m.id] = scale.color(meta.value(m))))
    return { fills, scale }
  }, [municipalities, metric])
}
