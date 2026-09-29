"use client"

import { useQuery } from "@tanstack/react-query"
import { sessionService } from "@/services"

/** Usuário autenticado. Etapa 2 → sessão real (Auth.js/Clerk) com RBAC. */
export function useCurrentUser() {
  const { data } = useQuery({ queryKey: ["session"], queryFn: () => sessionService.getCurrentUser(), staleTime: Infinity })
  return data ?? { id: "", name: "", role: "", organization: "", email: "" }
}
