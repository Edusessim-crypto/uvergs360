import type { SearchResult, User, UserRole } from "@/types"
import { CURRENT_USER } from "@/data/mock/admin"
import { normalize } from "@/lib/utils"
import { mockRead, mockWrite, newId } from "./_mock-client"

/**
 * Busca global (⌘K).
 * Etapa 2 → GET /api/search?q= (PostgreSQL full-text / pg_trgm com unaccent).
 */
export const searchService = {
  search(query: string) {
    return mockRead((db): SearchResult[] => {
      const q = normalize(query)
      if (q.length < 2) return []
      const has = (text: string) => normalize(text).includes(q)
      const results: SearchResult[] = []

      const municipalities = db.municipalities.filter((m) => has(m.name)).slice(0, 3)
      municipalities.forEach((m) =>
        results.push({ id: `m-${m.id}`, group: "Municípios", title: m.name, subtitle: `Município — ${m.regionName} · ${m.councilorsCount} vereadores`, href: `/territorio?municipio=${m.id}` }),
      )

      const chambers = db.chambers.filter((c) => has(c.name)).slice(0, 3)
      chambers.forEach((c) => results.push({ id: `c-${c.id}`, group: "Câmaras", title: c.name, subtitle: `${c.municipalityName} — RS · ${c.councilorsCount} vereadores`, href: `/camaras/${c.id}` }))

      const municipalityIds = new Set(municipalities.map((m) => m.id))
      const councilors = db.councilors
        .filter((c) => has(c.name) || municipalityIds.has(c.municipalityId))
        .sort((a, b) => Number(b.isDemoFeatured ?? 0) - Number(a.isDemoFeatured ?? 0))
        .slice(0, 5)
      councilors.forEach((c) => results.push({ id: `v-${c.id}`, group: "Vereadores", title: c.name, subtitle: `${c.role} · ${c.chamberName}`, href: `/vereadores/${c.id}` }))

      const events = db.events.filter((e) => has(e.title) || has(e.city) || municipalities.some((m) => e.city === m.name) || (municipalities.some((m) => m.regionId === e.regionId) && e.format !== "Online")).slice(0, 4)
      events.forEach((e) => results.push({ id: `e-${e.id}`, group: "Eventos", title: e.title, subtitle: `${e.city} · ${new Date(e.startDate).toLocaleDateString("pt-BR")}`, href: `/eventos/${e.id}` }))

      const certificates = db.certificates.filter((c) => has(c.code) || has(c.participantName)).slice(0, 3)
      certificates.forEach((c) => results.push({ id: `ce-${c.id}`, group: "Certificados", title: `${c.code} — ${c.participantName}`, subtitle: c.eventTitle, href: `/certificados?codigo=${c.code}` }))

      return results
    }, [90, 180])
  },
}

/**
 * Notificações.
 * Etapa 2 → GET /api/notifications, PATCH /api/notifications/read, canal em tempo real (SSE/WebSocket).
 */
export const notificationService = {
  list() {
    return mockRead((db) => [...db.notifications].sort((a, b) => b.at.localeCompare(a.at)), [80, 160])
  },
  markAllRead() {
    return mockWrite((db) => {
      db.notifications.forEach((n) => (n.read = true))
      return true
    }, [150, 250])
  },
  markRead(id: string) {
    return mockWrite((db) => {
      const n = db.notifications.find((n) => n.id === id)
      if (n) n.read = true
      return true
    }, [60, 120])
  },
}

/**
 * Sessão, usuários, integrações e auditoria.
 * Etapa 2 → autenticação real (Auth.js / Clerk / Supabase Auth), RBAC por papel,
 * GET /api/users, POST /api/users/invite, GET /api/audit-logs, cofre de credenciais para integrações.
 */
export const sessionService = {
  getCurrentUser() {
    return mockRead(() => CURRENT_USER, [0, 0])
  },
  signIn(email: string) {
    return mockWrite(() => ({ ...CURRENT_USER, email: email || CURRENT_USER.email }), [700, 1000])
  },
}

export const userService = {
  list() {
    return mockRead((db) => db.users)
  },
  invite(input: { name: string; email: string; role: UserRole; area: string }) {
    return mockWrite((db) => {
      const user: User = { id: newId("us"), ...input, status: "convidado", lastAccessAt: null }
      db.users.push(user)
      return user
    })
  },
  updateRole(id: string, role: UserRole) {
    return mockWrite((db) => {
      const u = db.users.find((u) => u.id === id)
      if (u) u.role = role
      return u
    })
  },
}

export const integrationService = {
  list() {
    return mockRead((db) => db.integrations)
  },
}

export const auditService = {
  list() {
    return mockRead((db) => db.audit)
  },
}
