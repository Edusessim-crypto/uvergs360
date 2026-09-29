import { Suspense } from "react"
import type { Metadata } from "next"
import { TerritoryView } from "@/features/territory/territory-view"

export const metadata: Metadata = { title: "Território RS" }

export default function TerritoryPage() {
  return (
    <Suspense>
      <TerritoryView />
    </Suspense>
  )
}
