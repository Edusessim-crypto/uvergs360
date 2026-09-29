import { Suspense } from "react"
import type { Metadata } from "next"
import { IntegrationsView } from "@/features/admin/admin-views"

export const metadata: Metadata = { title: "Integrações" }

export default function Page() {
  return (
    <Suspense>
      <IntegrationsView />
    </Suspense>
  )
}
