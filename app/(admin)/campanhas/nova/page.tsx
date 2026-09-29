import { Suspense } from "react"
import type { Metadata } from "next"
import { CampaignWizard } from "@/features/campaigns/campaign-wizard"

export const metadata: Metadata = { title: "Nova campanha" }

export default function Page() {
  return (
    <Suspense>
      <CampaignWizard />
    </Suspense>
  )
}
