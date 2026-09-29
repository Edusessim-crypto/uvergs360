import { Suspense } from "react"
import type { Metadata } from "next"
import { CouncilorsView } from "@/features/councilors/councilors-view"

export const metadata: Metadata = { title: "Vereadores" }

export default function CouncilorsPage() {
  return (
    <Suspense>
      <CouncilorsView />
    </Suspense>
  )
}
