import { Suspense } from "react"
import type { Metadata } from "next"
import { UsersView } from "@/features/admin/admin-views"

export const metadata: Metadata = { title: "Usuários" }

export default function Page() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  )
}
