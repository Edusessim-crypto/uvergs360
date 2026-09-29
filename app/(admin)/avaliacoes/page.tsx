import { Suspense } from "react"
import type { Metadata } from "next"
import { EvaluationsView } from "@/features/evaluations/evaluations-view"

export const metadata: Metadata = { title: "Avaliações" }

export default function Page() {
  return (
    <Suspense>
      <EvaluationsView />
    </Suspense>
  )
}
