import type { Metadata } from "next"
import { ChamberPortalShell } from "@/features/portal/chamber-portal"

export const metadata: Metadata = { title: "Portal da Câmara" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ChamberPortalShell>{children}</ChamberPortalShell>
}
