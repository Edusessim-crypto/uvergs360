import { EventLanding } from "@/features/public-event/event-landing"

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <EventLanding slug={slug} />
}
