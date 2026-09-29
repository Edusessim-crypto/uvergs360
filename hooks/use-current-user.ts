"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { sessionService } from "@/services"

const EMPTY = { id: "", name: "", role: "", organization: "", email: "" }

/**
 * Usuário autenticado. Etapa 2 → sessão real (Auth.js/Clerk) com RBAC.
 * Só expõe os dados após a montagem para o HTML do servidor e o do cliente coincidirem.
 */
export function useCurrentUser() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const { data } = useQuery({ queryKey: ["session"], queryFn: () => sessionService.getCurrentUser(), staleTime: Infinity })
  return mounted && data ? data : EMPTY
}
