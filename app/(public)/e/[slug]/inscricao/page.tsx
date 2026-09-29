import type { Metadata } from "next"
import { PublicRegistration } from "@/features/public-event/public-registration"

export const metadata: Metadata = { title: "Inscrição" }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <PublicRegistration slug={slug} />
}
