import { Suspense } from "react"
import type { Metadata } from "next"
import { GoalsView } from "@/features/management/goals-view"

export const metadata: Metadata = { title: "Metas & Impacto" }

export default function Page() {
  return (
    <Suspense>
      <GoalsView />
    </Suspense>
  )
}
