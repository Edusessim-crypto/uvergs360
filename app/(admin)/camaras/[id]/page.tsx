import type { Metadata } from "next"
import { ChamberProfileView } from "@/features/chambers/chamber-profile-view"

export const metadata: Metadata = { title: "Perfil da Câmara" }

export default async function ChamberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChamberProfileView id={id} />
}
