import { Suspense } from "react"
import type { Metadata } from "next"
import { JourneysView } from "@/features/journeys/journeys-view"

export const metadata: Metadata = { title: "Jornadas" }

export default function Page() {
  return (
    <Suspense>
      <JourneysView />
    </Suspense>
  )
}
