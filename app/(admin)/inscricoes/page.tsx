import { Suspense } from "react"
import type { Metadata } from "next"
import { RegistrationsView } from "@/features/registrations/registrations-view"

export const metadata: Metadata = { title: "Inscrições" }

export default function Page() {
  return (
    <Suspense>
      <RegistrationsView />
    </Suspense>
  )
}
