import { Suspense } from "react"
import type { Metadata } from "next"
import { ReportsView } from "@/features/management/reports-view"

export const metadata: Metadata = { title: "Relatórios" }

export default function Page() {
  return (
    <Suspense>
      <ReportsView />
    </Suspense>
  )
}
