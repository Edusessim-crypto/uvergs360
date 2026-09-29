import {
  Activity,
  Award,
  CalendarDays,
  ChartColumnBig,
  ClipboardList,
  House,
  Landmark,
  Layers,
  Map,
  Plug,
  Radar,
  ScanLine,
  Send,
  Settings,
  ShieldCheck,
  Star,
  Target,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: "radar" | "inscricoes"
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Início", href: "/", icon: House },
      { label: "Radar UVERGS", href: "/radar", icon: Radar, badgeKey: "radar" },
      { label: "Território RS", href: "/territorio", icon: Map },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      { label: "Vereadores", href: "/vereadores", icon: Users },
      { label: "Câmaras", href: "/camaras", icon: Landmark },
      { label: "Segmentos", href: "/segmentos", icon: Layers },
      { label: "Atividades", href: "/atividades", icon: Activity },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { label: "Campanhas", href: "/campanhas", icon: Send },
      { label: "Jornadas", href: "/jornadas", icon: Workflow },
    ],
  },
  {
    label: "Eventos",
    items: [
      { label: "Eventos", href: "/eventos", icon: CalendarDays },
      { label: "Inscrições", href: "/inscricoes", icon: ClipboardList },
      { label: "Check-in", href: "/checkin", icon: ScanLine },
      { label: "Certificados", href: "/certificados", icon: Award },
      { label: "Avaliações", href: "/avaliacoes", icon: Star },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Metas & Impacto", href: "/metas", icon: Target },
      { label: "Relatórios", href: "/relatorios", icon: ChartColumnBig },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Usuários", href: "/usuarios", icon: UserCog },
      { label: "Integrações", href: "/integracoes", icon: Plug },
      { label: "Auditoria", href: "/auditoria", icon: ShieldCheck },
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
]

const EXTRA_SEGMENTS: Record<string, string> = {
  nova: "Nova campanha",
  novo: "Novo evento",
  notificacoes: "Notificações",
}

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export function findNav(pathname: string) {
  for (const group of NAV_GROUPS) {
    const item = [...group.items].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(pathname, i.href))
    if (item) return { group, item }
  }
  return null
}

export function segmentLabel(segment: string) {
  return EXTRA_SEGMENTS[segment]
}

/** Roteiro recomendado de apresentação (telas hero). */
export const DEMO_TOUR = [
  { href: "/", title: "Dashboard", line: "Esta é a visão geral da UVERGS." },
  { href: "/radar", title: "Radar UVERGS", line: "O sistema identifica onde precisamos agir." },
  { href: "/vereadores/vr-carlos-eduardo-martins", title: "Perfil 360º", line: "Conhecemos todo o histórico de relacionamento." },
  { href: "/territorio", title: "Território RS", line: "Entendemos nossa presença em todo o Estado." },
  { href: "/eventos/ev-seminario-gestao-publica", title: "Evento 360", line: "Conseguimos medir todo o ciclo de um evento." },
]
