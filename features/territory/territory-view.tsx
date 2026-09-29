"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ChevronRight, Landmark, Maximize2, Minus, Plus, Users } from "lucide-react"
import type { RegionId, TerritoryMetric } from "@/types"
import { territoryService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatNumber, formatRelativeDay } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { SegmentedControl } from "@/components/shared/segmented-control"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { StatusBadge } from "@/components/shared/status-badge"
import { Meter } from "@/components/shared/meter"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { BarList } from "@/components/charts/chart-kit"
import { RSMap, regionLabelPositions } from "./rs-map"
import { MapLegend } from "./map-legend"
import { METRIC_META, useChoropleth, useTerritoryData } from "./use-territory"

export function TerritoryView() {
  const params = useSearchParams()
  const { map, municipalities, regions, regionOf, byId, loading } = useTerritoryData()
  const overview = useQuery({ queryKey: qk.territoryOverview, queryFn: () => territoryService.getOverview() })
  const [metric, setMetric] = React.useState<TerritoryMetric>("participacao")
  const [region, setRegion] = React.useState<RegionId | null>((params.get("regiao") as RegionId) ?? null)
  const [selected, setSelected] = React.useState<string | null>(params.get("municipio"))
  const [hover, setHover] = React.useState<{ id: string; x: number; y: number } | null>(null)
  const [zoomBoost, setZoomBoost] = React.useState(0)

  React.useEffect(() => {
    if (selected && municipalities && !region) {
      const m = municipalities.find((x) => x.id === selected)
      if (m) setRegion(m.regionId)
    }
  }, [selected, municipalities, region])

  const { fills, scale } = useChoropleth(municipalities, metric)
  const meta = METRIC_META[metric]
  const regionMeta = regions?.find((r) => r.id === region)
  const selectedM = selected ? byId.get(selected) : null
  const detail = useQuery({ queryKey: qk.municipality(selected ?? ""), queryFn: () => territoryService.getMunicipality(selected!), enabled: !!selected })

  const focusIds = React.useMemo(() => {
    if (selected && zoomBoost > 0) return [selected]
    if (!region || !municipalities) return null
    return municipalities.filter((m) => m.regionId === region).map((m) => m.id)
  }, [region, municipalities, selected, zoomBoost])

  const labels = React.useMemo(() => {
    if (!map || !regions || region) return []
    const names = Object.fromEntries(regions.map((r) => [r.id, r.shortName])) as Record<RegionId, string>
    return regionLabelPositions(map, regionOf, names)
  }, [map, regions, regionOf, region])

  const topInRegion = React.useMemo(
    () => (municipalities ?? []).filter((m) => !region || m.regionId === region).sort((a, b) => meta.value(b) - meta.value(a)).slice(0, 8),
    [municipalities, region, meta],
  )

  const hovered = hover ? byId.get(hover.id) : null
  const reset = () => { setRegion(null); setSelected(null); setZoomBoost(0) }

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-2"
        title="Território RS"
        description="Visualize a presença institucional da UVERGS no Estado."
        actions={
          <SegmentedControl
            value={metric}
            onChange={setMetric}
            options={(Object.keys(METRIC_META) as TerritoryMetric[]).map((k) => ({ value: k, label: METRIC_META[k].label }))}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Municípios alcançados", value: overview.data?.municipalitiesReached, total: overview.data?.municipalitiesTotal },
          { label: "Câmaras cadastradas", value: overview.data?.chambersRegistered },
          { label: "Vereadores cadastrados", value: overview.data?.councilorsRegistered },
          { label: "Participações", value: overview.data?.participations },
        ].map((k) => (
          <div key={k.label} className="card px-5 py-4">
            <div className="text-[12.5px] font-medium text-ink-3">{k.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1">
              {k.value === undefined ? <Skeleton className="h-8 w-20" /> : <span className="kpi-value text-[28px] leading-none"><AnimatedNumber value={k.value} /></span>}
              {k.total && <span className="font-display text-base text-ink-3">/ {k.total}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* Mapa */}
        <section className="card relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5">
            <nav className="flex items-center gap-1.5 text-[13px]" aria-label="Nível territorial">
              <button onClick={reset} className={cn("font-medium", region ? "text-brand-600 hover:underline" : "text-ink")}>Rio Grande do Sul</button>
              {regionMeta && (
                <>
                  <ChevronRight className="size-3.5 text-ink-4" />
                  <button onClick={() => { setSelected(null); setZoomBoost(0) }} className={cn("font-medium", selected ? "text-brand-600 hover:underline" : "text-ink")}>{regionMeta.shortName}</button>
                </>
              )}
              {selectedM && (
                <>
                  <ChevronRight className="size-3.5 text-ink-4" />
                  <span className="font-semibold text-ink">{selectedM.name}</span>
                </>
              )}
            </nav>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="icon-xs" onClick={() => setZoomBoost(1)} disabled={!selected} aria-label="Aproximar"><Plus /></Button>
              <Button variant="secondary" size="icon-xs" onClick={() => (zoomBoost ? setZoomBoost(0) : selected ? setSelected(null) : setRegion(null))} aria-label="Afastar"><Minus /></Button>
              <Button variant="secondary" size="icon-xs" onClick={reset} aria-label="Ver todo o Estado"><Maximize2 /></Button>
            </div>
          </div>
          <div className="relative bg-[linear-gradient(180deg,#f8fafd,#eff3f9)] p-4 sm:p-6">
            {loading || !map ? (
              <Skeleton className="aspect-[1.05] w-full" />
            ) : (
              <RSMap
                map={map}
                fills={fills}
                selectedId={selected}
                focusIds={focusIds}
                labels={labels}
                padding={selected && zoomBoost ? 90 : 30}
                onHover={(id, p) => setHover(id && p ? { id, ...p } : null)}
                onSelect={(id) => {
                  const m = byId.get(id)
                  if (!m) return
                  if (!region || region !== m.regionId) setRegion(m.regionId)
                  setSelected(id)
                }}
                className="mx-auto max-h-[680px]"
              />
            )}
            {hovered && hover && (
              <div className="pointer-events-none absolute z-10 min-w-44 rounded-lg border border-line-soft bg-white px-3 py-2.5 text-[12.5px] shadow-pop" style={{ left: hover.x + 28, top: hover.y + 16 }}>
                <div className="font-semibold text-ink">{hovered.name}</div>
                <div className="text-ink-3">{hovered.regionName} · {hovered.councilorsCount || "—"} vereadores</div>
                <div className="mt-1 flex items-center justify-between gap-3 border-t border-line-soft pt-1">
                  <span className="text-ink-2">{meta.label}</span>
                  <span className="font-semibold text-ink tnum">{meta.format(meta.value(hovered))}</span>
                </div>
              </div>
            )}
            {scale && <MapLegend title={meta.legend} min={meta.format(scale.min)} max={meta.format(scale.max)} className="absolute bottom-5 left-5" />}
          </div>
        </section>

        {/* Painel contextual */}
        <aside key={selected ?? region ?? "rs"} className="card animate-fade-up overflow-hidden">
          {selectedM ? (
            <MunicipalityPanel
              municipality={selectedM}
              detail={detail.data}
              loading={detail.isLoading}
              onBack={() => { setSelected(null); setZoomBoost(0) }}
            />
          ) : (
            <div className="p-5 sm:p-6">
              <div className="eyebrow">{region ? "Região" : "Estado"}</div>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink">{regionMeta ? regionMeta.name : "Rio Grande do Sul"}</h2>
              <p className="mt-1 text-[13px] text-ink-3">
                {regionMeta
                  ? `${regionMeta.municipalitiesCount} municípios · ${regionMeta.chambersCount} Câmaras cadastradas`
                  : "497 municípios em 9 regiões de atuação"}
              </p>

              {regionMeta && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Alcançados", `${regionMeta.reachedCount}/${regionMeta.municipalitiesCount}`],
                    ["Vereadores", formatNumber(regionMeta.councilorsCount)],
                    ["Participações", formatNumber(regionMeta.participations)],
                    ["Qualidade cadastral", `${regionMeta.dataQuality}%`],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg bg-canvas px-3.5 py-3">
                      <div className="text-[11.5px] text-ink-3">{l}</div>
                      <div className="mt-0.5 font-display text-[19px] font-semibold text-ink tnum">{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {!region && regions && (
                <div className="mt-6">
                  <div className="mb-3 text-[12.5px] font-semibold text-ink-2">Regiões — {meta.label.toLowerCase()}</div>
                  <BarList
                    items={regions
                      .map((r) => ({
                        key: r.id,
                        label: r.shortName,
                        value: metric === "participacao" ? r.participations : metric === "cadastros" ? r.dataQuality : metric === "eventos" ? r.eventsCount : r.activity30d,
                      }))
                      .sort((a, b) => b.value - a.value)}
                    valueFormatter={(v) => (metric === "cadastros" ? `${v}%` : formatNumber(v))}
                    onSelect={(k) => setRegion(k as RegionId)}
                  />
                </div>
              )}

              <div className="mt-6">
                <div className="mb-2 text-[12.5px] font-semibold text-ink-2">Destaques em {meta.label.toLowerCase()}</div>
                <ul className="divide-y divide-line-soft">
                  {topInRegion.map((m, i) => (
                    <li key={m.id}>
                      <button onClick={() => { setRegion(m.regionId); setSelected(m.id) }} className="flex w-full items-center gap-3 py-2.5 text-left hover:text-brand-700">
                        <span className="w-5 text-xs font-semibold text-ink-3 tnum">{i + 1}</span>
                        <span className="flex-1 truncate text-[13.5px] font-medium text-ink">{m.name}</span>
                        <span className="text-[13px] font-semibold text-ink tnum">{meta.format(meta.value(m))}</span>
                        <ChevronRight className="size-3.5 text-ink-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function MunicipalityPanel({
  municipality: m,
  detail,
  loading,
  onBack,
}: {
  municipality: NonNullable<ReturnType<typeof useTerritoryData>["municipalities"]>[number]
  detail?: Awaited<ReturnType<typeof territoryService.getMunicipality>>
  loading: boolean
  onBack: () => void
}) {
  const chamber = detail?.chamber
  return (
    <div>
      <div className="border-b border-line-soft p-5 sm:p-6">
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          <ArrowLeft className="size-3.5" /> Voltar para {m.regionName}
        </button>
        <div className="eyebrow">Município · {m.regionName}</div>
        <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{m.name}</h2>
        <p className="mt-1 text-[13px] text-ink-3">
          {m.reached ? `Última atividade ${m.lastActivityAt ? formatRelativeDay(m.lastActivityAt).toLowerCase() : "—"}` : "Município ainda não alcançado"}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Participações", formatNumber(m.participations)],
            ["Eventos", formatNumber(m.eventsAttended)],
            ["Ativ. 30 dias", formatNumber(m.activity30d)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-canvas px-3 py-2.5">
              <div className="text-[11px] text-ink-3">{l}</div>
              <div className="font-display text-[18px] font-semibold text-ink tnum">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-line-soft p-5 sm:p-6">
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : chamber ? (
          <Link href={`/camaras/${chamber.id}`} className="group/ch block rounded-lg border border-line-soft p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-navy-900 text-white"><Landmark className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink group-hover/ch:text-brand-700">{chamber.name}</div>
                <div className="text-xs text-ink-3">Presidente {chamber.president}</div>
              </div>
              <StatusBadge domain="chamber" value={chamber.status} size="sm" />
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs"><span className="text-ink-3">Qualidade cadastral</span><span className="font-semibold text-ink">{chamber.dataQuality}%</span></div>
              <Meter value={chamber.dataQuality} size="sm" tone={chamber.dataQuality >= 80 ? "success" : "warning"} />
            </div>
          </Link>
        ) : (
          <div className="rounded-lg border border-dashed border-line p-4 text-[13px] text-ink-2">
            Câmara ainda não cadastrada na base da UVERGS.
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-2"><Users className="size-4" />Vereadores</span>
          <span className="text-xs text-ink-3">{detail?.councilors.length ?? 0}</span>
        </div>
        <ul className="scrollbar-thin max-h-[300px] space-y-1 overflow-y-auto">
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          {detail?.councilors.map((c) => (
            <li key={c.id}>
              <Link href={`/vereadores/${c.id}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-canvas">
                <PersonAvatar name={c.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{c.name}</span>
                  <span className="block text-[11.5px] text-ink-3">{c.role} · {c.eventsCount} eventos</span>
                </span>
                {c.situation && <span className="size-2 rounded-full bg-warning-500" title="Oportunidade no Radar" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
