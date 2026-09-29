import type { Metadata } from "next"
import { ProfileView } from "@/features/councilors/profile-view"

export const metadata: Metadata = { title: "Perfil 360º" }

export default async function CouncilorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProfileView id={id} />
}
