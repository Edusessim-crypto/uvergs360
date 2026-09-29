import type { Metadata } from "next"
import { Event360View } from "@/features/events/event-360-view"

export const metadata: Metadata = { title: "Evento 360" }

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Event360View id={id} />
}
