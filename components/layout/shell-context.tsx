"use client"

import * as React from "react"

interface ShellState {
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  toggleCollapsed: () => void
  mobileOpen: boolean
  setMobileOpen: (value: boolean) => void
  searchOpen: boolean
  setSearchOpen: (value: boolean) => void
  focusMode: boolean
  setFocusMode: (value: boolean) => void
  crumbLabel: string | null
  setCrumbLabel: (label: string | null) => void
}

const ShellContext = React.createContext<ShellState | null>(null)
const STORAGE_KEY = "uvergs360.sidebar.collapsed"

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [focusMode, setFocusMode] = React.useState(false)
  const [crumbLabel, setCrumbLabel] = React.useState<string | null>(null)

  React.useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsedState(true)
    } catch {
      /* preferências locais indisponíveis */
    }
  }, [])

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value = React.useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed: () => setCollapsed(!collapsed),
      mobileOpen,
      setMobileOpen,
      searchOpen,
      setSearchOpen,
      focusMode,
      setFocusMode,
      crumbLabel,
      setCrumbLabel,
    }),
    [collapsed, setCollapsed, mobileOpen, searchOpen, focusMode, crumbLabel],
  )

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShell() {
  const ctx = React.useContext(ShellContext)
  if (!ctx) throw new Error("useShell deve ser usado dentro de ShellProvider")
  return ctx
}

/** Define o rótulo do último item do breadcrumb (ex.: nome do vereador). */
export function useBreadcrumbLabel(label: string | null | undefined) {
  const { setCrumbLabel } = useShell()
  React.useEffect(() => {
    setCrumbLabel(label ?? null)
    return () => setCrumbLabel(null)
  }, [label, setCrumbLabel])
}
