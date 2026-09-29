import { Suspense } from "react"
import type { Metadata } from "next"
import { SettingsView } from "@/features/admin/admin-views"

export const metadata: Metadata = { title: "Configurações" }

export default function Page() {
  return (
    <Suspense>
      <SettingsView />
    </Suspense>
  )
}
