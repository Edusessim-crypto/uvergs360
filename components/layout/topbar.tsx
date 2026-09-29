"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Keyboard,
  Landmark,
  LogOut,
  Menu,
  Presentation,
  Search,
  Settings,
  Smartphone,
  User,
  Globe,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Logo } from "@/components/brand/logo"
import { useCurrentUser } from "@/hooks/use-current-user"
import { DEMO_TOUR, findNav, segmentLabel } from "@/lib/navigation"
import { cn, initials } from "@/lib/utils"
import { NotificationMenu } from "./notification-menu"
import { SidebarNav } from "./app-sidebar"
import { useShell } from "./shell-context"

function Breadcrumbs() {
  const pathname = usePathname()
  const { crumbLabel } = useShell()
  const nav = findNav(pathname)
  const segments = pathname.split("/").filter(Boolean)

  const crumbs: { label: string; href?: string }[] = []
  if (nav) {
    crumbs.push({ label: nav.group.label })
    crumbs.push({ label: nav.item.label, href: nav.item.href })
    const rest = segments.slice(nav.item.href.split("/").filter(Boolean).length)
    if (rest.length) crumbs.push({ label: crumbLabel ?? segmentLabel(rest[0]) ?? "Detalhes" })
  } else if (segments[0] === "notificacoes") {
    crumbs.push({ label: "Conta" }, { label: "Notificações" })
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] md:flex">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-ink-4" />}
            {c.href && !last ? (
              <Link href={c.href} className="truncate text-ink-2 transition-colors hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className={cn("truncate", last ? "font-medium text-ink" : "text-ink-3")}>{c.label}</span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

function HelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Ajuda">
          <CircleHelp className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Roteiro da apresentação</DropdownMenuLabel>
        <DropdownMenuGroup>
          {DEMO_TOUR.map((step, i) => (
            <DropdownMenuItem key={step.href} asChild className="items-start py-2">
              <Link href={step.href}>
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-600 tnum">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{step.title}</span>
                  <span className="block text-xs text-ink-3">{step.line}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Portais</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/meu-uvergs" target="_blank">
            <Smartphone /> Meu UVERGS (participante)
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/portal-camara" target="_blank">
            <Landmark /> Portal da Câmara
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/e/seminario-de-gestao-publica" target="_blank">
            <Globe /> Página pública do evento
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <BookOpen /> Central de ajuda
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Keyboard /> Atalhos de teclado <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  const router = useRouter()
  const user = useCurrentUser()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-lg py-1 pr-1.5 pl-1 text-left transition-colors outline-none hover:bg-canvas focus-visible:ring-[3px] focus-visible:ring-brand-500/25 data-[state=open]:bg-canvas">
          <Avatar className="size-8">
            <AvatarFallback className="bg-navy-800 text-[12px] text-white">{user.name ? initials(user.name) : ""}</AvatarFallback>
          </Avatar>
          <span className="hidden leading-tight xl:block">
            <span className="block text-[13px] font-semibold text-ink">{user.name}</span>
            <span className="block text-[11.5px] text-ink-3">{user.role}</span>
          </span>
          <ChevronDown className="hidden size-3.5 text-ink-3 xl:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-navy-800 text-white">{user.name ? initials(user.name) : ""}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-ink">{user.name}</div>
            <div className="truncate text-xs text-ink-3">{user.email}</div>
          </div>
        </div>
        <div className="mx-2.5 mb-2 flex items-center justify-between rounded-md bg-canvas px-2.5 py-2 text-xs">
          <span className="font-medium text-ink">{user.organization}</span>
          <span className="text-ink-3">{user.role}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/configuracoes?aba=perfil")}>
          <User /> Meu perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/configuracoes")}>
          <Settings /> Configurações
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/")}>
          <Presentation /> Iniciar apresentação
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => router.push("/login")}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Topbar() {
  const { setSearchOpen, mobileOpen, setMobileOpen } = useShell()
  const [isMac, setIsMac] = React.useState(true)
  React.useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent)), [])

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line-soft bg-white/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 lg:px-8">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
        <Menu className="size-5" />
      </Button>
      <Link href="/" className="md:hidden">
        <Logo compact />
      </Link>
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setSearchOpen(true)}
          className="group hidden h-9 w-[300px] items-center gap-2.5 rounded-md border border-line bg-canvas/70 px-3 text-left text-[13px] text-ink-3 transition-colors hover:border-[#c9d3e6] hover:bg-white md:flex xl:w-[340px]"
        >
          <Search className="size-4" />
          <span className="flex-1 truncate">Buscar vereadores, Câmaras, eventos…</span>
          <kbd className="rounded border border-line bg-white px-1.5 py-px font-sans text-[11px] font-medium text-ink-3 shadow-[0_1px_0_rgb(14_27_54/0.06)]">{isMac ? "⌘" : "Ctrl"} K</kbd>
        </button>
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setSearchOpen(true)} aria-label="Buscar">
          <Search className="size-[18px]" />
        </Button>
        <HelpMenu />
        <NotificationMenu />
        <div className="mx-1.5 hidden h-6 w-px bg-line-soft sm:block" />
        <UserMenu />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" size="sm" className="w-[280px] border-none bg-navy-900 p-0 text-white" showCloseButton={false}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-16 items-center px-5">
            <Logo variant="light" caption="Plataforma institucional" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col pt-2">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
