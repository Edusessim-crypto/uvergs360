import type { Metadata } from "next"
import { EventsView } from "@/features/events/events-view"

export const metadata: Metadata = { title: "Eventos" }

export default function EventsPage() {
  return <EventsView />
}
