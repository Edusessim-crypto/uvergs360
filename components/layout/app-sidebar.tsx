"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Logo, LogoMark } from "@/components/brand/logo"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NAV_GROUPS, isActive, type NavItem } from "@/lib/navigation"
import { qk } from "@/lib/query-keys"
import { radarService } from "@/services"
import { cn } from "@/lib/utils"
import { useShell } from "./shell-context"

function useBadges() {
  const { data } = useQuery({ queryKey: qk.radarSignals, queryFn: () => radarService.getSignals() })
  const radar = data?.find((s) => s.id === "inscricao_abandonada")?.count
  return { radar, inscricoes: undefined as number | undefined }
}

function NavLink({ item, collapsed, onNavigate, badge }: { item: NavItem; collapsed: boolean; onNavigate?: () => void; badge?: number }) {
  const pathname = usePathname()
  const active = isActive(pathname, item.href)
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/nav relative flex h-9 items-center gap-3 rounded-md text-[13.5px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
        collapsed ? "mx-auto w-10 justify-center" : "px-3",
        active ? "bg-white/[0.09] text-white" : "text-white/62 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      {active && <span className="absolute top-1/2 -left-3 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-500" aria-hidden />}
      <Icon className={cn("size-[17px] shrink-0 transition-colors", active ? "text-white" : "text-white/50 group-hover/nav:text-white/80")} strokeWidth={1.9} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && badge ? (
        <span className="ml-auto rounded-full bg-gold-500/15 px-1.5 py-px text-[10.5px] font-semibold text-gold-500 tnum">{badge}</span>
      ) : null}
      {collapsed && badge ? <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-gold-500" aria-hidden /> : null}
    </Link>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

export function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const badges = useBadges()
  return (
    <nav className={cn("scrollbar-dark flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")} aria-label="Navegação principal">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label} className={cn(gi > 0 && (collapsed ? "mt-3 border-t border-white/[0.06] pt-3" : "mt-6"))}>
          {!collapsed && <div className="mb-1.5 px-3 text-[10.5px] font-semibold tracking-[0.12em] text-white/35 uppercase">{group.label}</div>}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} badge={item.badgeKey ? badges[item.badgeKey] : undefined} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AppSidebar() {
  const { collapsed, toggleCollapsed, focusMode } = useShell()

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col bg-navy-900 transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
        collapsed ? "w-[76px]" : "w-[256px]",
        focusMode && "lg:hidden",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(47,107,255,0.14),transparent_70%)]" aria-hidden />
      <div className={cn("relative flex h-16 shrink-0 items-center", collapsed ? "justify-center px-2" : "px-5")}>
        <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60">
          {collapsed ? <LogoMark tone="white" /> : <Logo variant="light" caption="Plataforma institucional" />}
        </Link>
      </div>
      <div className="relative mt-3 flex min-h-0 flex-1 flex-col">
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className={cn("relative border-t border-white/[0.06] p-3", collapsed && "flex justify-center")}>
        <button
          onClick={toggleCollapsed}
          className={cn(
            "flex h-9 items-center gap-3 rounded-md text-[13px] font-medium text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white",
            collapsed ? "w-10 justify-center" : "w-full px-3",
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="size-[17px]" /> : <PanelLeftClose className="size-[17px]" />}
          {!collapsed && "Recolher menu"}
        </button>
      </div>
    </aside>
  )
}
