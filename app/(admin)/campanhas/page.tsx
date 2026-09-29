import { Suspense } from "react"
import type { Metadata } from "next"
import { CampaignsView } from "@/features/campaigns/campaigns-view"

export const metadata: Metadata = { title: "Campanhas" }

export default function Page() {
  return (
    <Suspense>
      <CampaignsView />
    </Suspense>
  )
}
