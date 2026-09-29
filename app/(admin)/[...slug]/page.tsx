import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/states"

export default function NotFoundInShell() {
  return (
    <div className="card">
      <EmptyState
        icon={Compass}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido. Use o menu lateral ou a busca (⌘K) para navegar."
        action={
          <Button asChild>
            <Link href="/">Voltar à Visão Geral</Link>
          </Button>
        }
      />
    </div>
  )
}
