import type { Metadata } from "next"
import { JourneyDetailView } from "@/features/journeys/journeys-view"

export const metadata: Metadata = { title: "Jornada" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JourneyDetailView id={id} />
}
