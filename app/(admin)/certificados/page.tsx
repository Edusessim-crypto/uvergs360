import { Suspense } from "react"
import type { Metadata } from "next"
import { CertificatesView } from "@/features/certificates/certificates-view"

export const metadata: Metadata = { title: "Certificados" }

export default function Page() {
  return (
    <Suspense>
      <CertificatesView />
    </Suspense>
  )
}
