import type { Metadata } from "next"
import { EventWizard } from "@/features/events/event-wizard"

export const metadata: Metadata = { title: "Novo evento" }

export default function NewEventPage() {
  return <EventWizard />
}
