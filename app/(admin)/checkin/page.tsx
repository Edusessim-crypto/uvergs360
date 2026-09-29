import { Suspense } from "react"
import type { Metadata } from "next"
import { CheckinView } from "@/features/checkin/checkin-view"

export const metadata: Metadata = { title: "Check-in" }

export default function Page() {
  return (
    <Suspense>
      <CheckinView />
    </Suspense>
  )
}
