import Link from "next/link"
import { Hammer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/states"

export default async function ModulePlaceholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const name = slug[0].replace(/-/g, " ")
  return (
    <div className="card">
      <EmptyState
        icon={Hammer}
        title={`Módulo “${name.charAt(0).toUpperCase() + name.slice(1)}” em finalização`}
        description="Esta área faz parte da Etapa 1 e está sendo concluída. Os dados e serviços já estão prontos na plataforma."
        action={
          <Button asChild>
            <Link href="/">Voltar à Visão Geral</Link>
          </Button>
        }
      />
    </div>
  )
}
