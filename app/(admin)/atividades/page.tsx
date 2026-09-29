import { Suspense } from "react"
import type { Metadata } from "next"
import { ActivitiesView } from "@/features/management/activities-view"

export const metadata: Metadata = { title: "Atividades" }

export default function Page() {
  return (
    <Suspense>
      <ActivitiesView />
    </Suspense>
  )
}
