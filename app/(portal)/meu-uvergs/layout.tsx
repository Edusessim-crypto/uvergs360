import type { Metadata } from "next"
import { PortalShell } from "@/features/portal/participant-portal"

export const metadata: Metadata = { title: "Meu UVERGS" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>
}
