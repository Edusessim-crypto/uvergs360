import { Suspense } from "react"
import type { Metadata } from "next"
import { NotificationsView } from "@/features/admin/admin-views"

export const metadata: Metadata = { title: "Notificações" }

export default function Page() {
  return (
    <Suspense>
      <NotificationsView />
    </Suspense>
  )
}
