import { Suspense } from "react"
import type { Metadata } from "next"
import { SegmentsView } from "@/features/segments/segments-view"

export const metadata: Metadata = { title: "Segmentos" }

export default function Page() {
  return (
    <Suspense>
      <SegmentsView />
    </Suspense>
  )
}
