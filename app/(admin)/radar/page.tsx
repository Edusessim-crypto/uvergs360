import { Suspense } from "react"
import type { Metadata } from "next"
import { RadarView } from "@/features/radar/radar-view"

export const metadata: Metadata = { title: "Radar UVERGS" }

export default function RadarPage() {
  return (
    <Suspense>
      <RadarView />
    </Suspense>
  )
}
