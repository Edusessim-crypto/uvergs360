"use client"

import * as React from "react"
import type { GeoCollection, GeoFeature } from "@/services"
import type { RegionId } from "@/types"
import { cn } from "@/lib/utils"

/**
 * Mapa do Rio Grande do Sul em SVG a partir de GeoJSON (malha municipal IBGE).
 *
 * Preparado para dados geográficos reais: recebe qualquer FeatureCollection com
 * `properties.id` = código IBGE. Na Etapa 2 a malha pode vir de PostGIS/API
 * sem alterar este componente.
 */

const WIDTH = 1000

export interface ProjectedFeature {
  id: string
  d: string
  bbox: [number, number, number, number]
  centroid: [number, number]
}

export interface ProjectedMap {
  width: number
  height: number
  features: ProjectedFeature[]
  byId: Map<string, ProjectedFeature>
}

function eachRing(f: GeoFeature, fn: (ring: number[][]) => void) {
  if (f.geometry.type === "Polygon") (f.geometry.coordinates as number[][][]).forEach(fn)
  else (f.geometry.coordinates as number[][][][]).forEach((poly) => poly.forEach(fn))
}

export function projectGeo(geo: GeoCollection): ProjectedMap {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  geo.features.forEach((f) =>
    eachRing(f, (ring) =>
      ring.forEach(([lon, lat]) => {
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }),
    ),
  )
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const scale = WIDTH / ((maxLon - minLon) * kx)
  const height = Math.round((maxLat - minLat) * scale)
  const project = (lon: number, lat: number): [number, number] => [(lon - minLon) * kx * scale, (maxLat - lat) * scale]

  const features = geo.features.map((f) => {
    let d = ""
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    let cx = 0, cy = 0, n = 0
    eachRing(f, (ring) => {
      ring.forEach(([lon, lat], i) => {
        const [x, y] = project(lon, lat)
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
        cx += x
        cy += y
        n++
      })
      d += "Z"
    })
    return { id: String(f.properties.id), d, bbox: [x0, y0, x1, y1] as [number, number, number, number], centroid: [cx / n, cy / n] as [number, number] }
  })
  return { width: WIDTH, height, features, byId: new Map(features.map((f) => [f.id, f])) }
}

export function useProjectedMap(geo: GeoCollection | undefined) {
  return React.useMemo(() => (geo ? projectGeo(geo) : null), [geo])
}

/** Camada base memoizada — não re-renderiza em hover. */
const BaseLayer = React.memo(function BaseLayer({
  features,
  fills,
  dimmed,
  interactive,
}: {
  features: ProjectedFeature[]
  fills: Record<string, string>
  dimmed: Set<string> | null
  interactive: boolean
}) {
  return (
    <g>
      {features.map((f) => (
        <path
          key={f.id}
          d={f.d}
          data-id={f.id}
          fill={fills[f.id] ?? "#eef1f6"}
          stroke="#ffffff"
          strokeWidth={0.6}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          className={cn("transition-[opacity,fill] duration-300", interactive && "cursor-pointer")}
          opacity={dimmed && dimmed.has(f.id) ? 0.28 : 1}
        />
      ))}
    </g>
  )
})

export interface RSMapProps {
  map: ProjectedMap
  fills: Record<string, string>
  selectedId?: string | null
  focusIds?: string[] | null
  dimOutsideFocus?: boolean
  onSelect?: (id: string) => void
  onHover?: (id: string | null, point: { x: number; y: number } | null) => void
  labels?: { id: string; text: string; x: number; y: number; sub?: string }[]
  className?: string
  interactive?: boolean
  padding?: number
}

export function RSMap({ map, fills, selectedId, focusIds, dimOutsideFocus = true, onSelect, onHover, labels, className, interactive = true, padding = 40 }: RSMapProps) {
  const [hoverId, setHoverId] = React.useState<string | null>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)

  // Zoom para o conjunto em foco (região) ou para o município selecionado
  const transform = React.useMemo(() => {
    const ids = focusIds?.length ? focusIds : null
    if (!ids) return { k: 1, tx: 0, ty: 0 }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    ids.forEach((id) => {
      const f = map.byId.get(id)
      if (!f) return
      x0 = Math.min(x0, f.bbox[0])
      y0 = Math.min(y0, f.bbox[1])
      x1 = Math.max(x1, f.bbox[2])
      y1 = Math.max(y1, f.bbox[3])
    })
    if (!isFinite(x0)) return { k: 1, tx: 0, ty: 0 }
    const bw = x1 - x0 + padding * 2
    const bh = y1 - y0 + padding * 2
    const k = Math.min(6, Math.min(map.width / bw, map.height / bh))
    const tx = map.width / 2 - ((x0 + x1) / 2) * k
    const ty = map.height / 2 - ((y0 + y1) / 2) * k
    return { k, tx, ty }
  }, [focusIds, map, padding])

  const dimmed = React.useMemo(() => {
    if (!dimOutsideFocus || !focusIds?.length) return null
    const focus = new Set(focusIds)
    return new Set(map.features.filter((f) => !focus.has(f.id)).map((f) => f.id))
  }, [focusIds, map, dimOutsideFocus])

  const hovered = hoverId ? map.byId.get(hoverId) : null
  const selected = selectedId ? map.byId.get(selectedId) : null

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const id = (e.target as Element).getAttribute?.("data-id")
    if (id !== hoverId) setHoverId(id)
    if (onHover) {
      const rect = svgRef.current!.getBoundingClientRect()
      onHover(id, id ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${map.width} ${map.height}`}
      className={cn("h-auto w-full select-none", className)}
      onMouseMove={interactive ? handleMove : undefined}
      onMouseLeave={() => {
        setHoverId(null)
        onHover?.(null, null)
      }}
      onClick={(e) => {
        const id = (e.target as Element).getAttribute?.("data-id")
        if (id && onSelect) onSelect(id)
      }}
      role="img"
      aria-label="Mapa do Rio Grande do Sul por município"
    >
      <g
        style={{
          transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.k})`,
          transformOrigin: "0 0",
          transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <BaseLayer features={map.features} fills={fills} dimmed={dimmed} interactive={interactive} />
        {hovered && hovered.id !== selectedId && (
          <path d={hovered.d} fill="none" stroke="#041a4f" strokeWidth={1.4} vectorEffect="non-scaling-stroke" pointerEvents="none" />
        )}
        {selected && (
          <>
            <path d={selected.d} fill="#f4b400" fillOpacity={0.9} stroke="#041a4f" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" />
            <circle cx={selected.centroid[0]} cy={selected.centroid[1]} r={6 / transform.k} fill="#041a4f" stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" />
          </>
        )}
        {labels?.map((l) => (
          <g key={l.id} pointerEvents="none" style={{ transition: "opacity 300ms" }}>
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              className="font-display"
              style={{ fontSize: 15 / transform.k, fontWeight: 700, letterSpacing: "0.02em", paintOrder: "stroke" }}
              fill="#041a4f"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={4 / transform.k}
            >
              {l.text}
            </text>
            {l.sub && (
              <text
                x={l.x}
                y={l.y + 16 / transform.k}
                textAnchor="middle"
                style={{ fontSize: 12 / transform.k, fontWeight: 600, paintOrder: "stroke" }}
                fill="#5b6882"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={3 / transform.k}
              >
                {l.sub}
              </text>
            )}
          </g>
        ))}
      </g>
    </svg>
  )
}

/** Escala sequencial por quantis (7 classes) — mesma rampa em todo o sistema. */
export function buildQuantileScale(values: number[], ramp: readonly string[]) {
  const positive = values.filter((v) => v > 0).sort((a, b) => a - b)
  const classes = ramp.length
  const breaks = Array.from({ length: classes - 1 }, (_, i) => positive[Math.floor(((i + 1) / classes) * positive.length)] ?? 0)
  const color = (v: number) => {
    if (!v || v <= 0) return "#eef1f6"
    let idx = 0
    while (idx < breaks.length && v > breaks[idx]) idx++
    return ramp[idx]
  }
  return { color, breaks, min: positive[0] ?? 0, max: positive[positive.length - 1] ?? 0 }
}

export function regionLabelPositions(map: ProjectedMap, regionOf: Record<string, RegionId>, names: Record<RegionId, string>) {
  const acc = new Map<RegionId, { x: number; y: number; n: number }>()
  map.features.forEach((f) => {
    const r = regionOf[f.id]
    if (!r) return
    const a = acc.get(r) ?? { x: 0, y: 0, n: 0 }
    a.x += f.centroid[0]
    a.y += f.centroid[1]
    a.n++
    acc.set(r, a)
  })
  return [...acc.entries()].map(([id, a]) => ({ id, text: names[id], x: a.x / a.n, y: a.y / a.n }))
}
