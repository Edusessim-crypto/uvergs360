"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel } from "@/components/shared/panel"
import { BarList } from "@/components/charts/chart-kit"
import { formatNumber } from "@/lib/format"
import { RSMap, regionLabelPositions } from "@/features/territory/rs-map"
import { MapLegend } from "@/features/territory/map-legend"
import { useChoropleth, useTerritoryData } from "@/features/territory/use-territory"
import type { RegionId } from "@/types"

export function TerritorySnapshot() {
  const router = useRouter()
  const { map, municipalities, regions, regionOf, byId, loading } = useTerritoryData()
  const { fills, scale } = useChoropleth(municipalities, "participacao")
  const [hover, setHover] = React.useState<{ id: string; x: number; y: number } | null>(null)
  const [activeRegion, setActiveRegion] = React.useState<RegionId | null>(null)

  const labels = React.useMemo(() => {
    if (!map || !regions) return []
    const names = Object.fromEntries(regions.map((r) => [r.id, r.shortName])) as Record<RegionId, string>
    return regionLabelPositions(map, regionOf, names)
  }, [map, regions, regionOf])

  const focusIds = React.useMemo(
    () => (activeRegion && municipalities ? municipalities.filter((m) => m.regionId === activeRegion).map((m) => m.id) : null),
    [activeRegion, municipalities],
  )

  const reached = municipalities?.filter((m) => m.reached).length ?? 0
  const hovered = hover ? byId.get(hover.id) : null

  return (
    <Panel
      title="Presença territorial"
      description={`Participações por município · ${reached} de ${municipalities?.length ?? 497} municípios alcançados`}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/territorio">
            Abrir Território RS <ArrowRight />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative min-h-[280px] rounded-lg bg-[linear-gradient(180deg,#f7f9fd,#f1f4fa)] p-3">
          {loading || !map ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <>
              <RSMap
                map={map}
                fills={fills}
                focusIds={focusIds}
                dimOutsideFocus
                labels={activeRegion ? [] : labels}
                onHover={(id, p) => setHover(id && p ? { id, ...p } : null)}
                onSelect={(id) => router.push(`/territorio?municipio=${id}`)}
                padding={60}
              />
              {hovered && hover && (
                <div
                  className="pointer-events-none absolute z-10 rounded-lg border border-line-soft bg-white px-3 py-2 text-[12.5px] shadow-pop"
                  style={{ left: Math.min(hover.x + 16, 9999), top: hover.y + 8 }}
                >
                  <div className="font-semibold text-ink">{hovered.name}</div>
                  <div className="text-ink-3">
                    {hovered.regionName} · <span className="font-semibold text-ink tnum">{formatNumber(hovered.participations)}</span> participações
                  </div>
                </div>
              )}
              {scale && <MapLegend title="Participações" min={formatNumber(scale.min)} max={formatNumber(scale.max)} className="absolute bottom-3 left-3 hidden sm:block" />}
            </>
          )}
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink-2">Participações por região</span>
            {activeRegion && (
              <button onClick={() => setActiveRegion(null)} className="text-xs font-medium text-brand-600 hover:underline">
                Ver todo o Estado
              </button>
            )}
          </div>
          {regions ? (
            <BarList
              items={[...regions].sort((a, b) => b.participations - a.participations).map((r) => ({ key: r.id, label: r.shortName, value: r.participations, hint: `${r.reachedCount}/${r.municipalitiesCount}` }))}
              onSelect={(k) => setActiveRegion((cur) => (cur === k ? null : (k as RegionId)))}
              activeKey={activeRegion}
            />
          ) : (
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
