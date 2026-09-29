import { Suspense } from "react"
import type { Metadata } from "next"
import { AuditView } from "@/features/admin/admin-views"

export const metadata: Metadata = { title: "Auditoria" }

export default function Page() {
  return (
    <Suspense>
      <AuditView />
    </Suspense>
  )
}
