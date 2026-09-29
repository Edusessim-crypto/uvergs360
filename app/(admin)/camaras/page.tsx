import { Suspense } from "react"
import type { Metadata } from "next"
import { ChambersView } from "@/features/chambers/chambers-view"

export const metadata: Metadata = { title: "Câmaras" }

export default function ChambersPage() {
  return (
    <Suspense>
      <ChambersView />
    </Suspense>
  )
}
