"use client"

import * as React from "react"
import { AppSidebar } from "./app-sidebar"
import { Topbar } from "./topbar"
import { CommandSearch } from "./command-search"
import { ShellProvider, useShell } from "./shell-context"
import { cn } from "@/lib/utils"

function ShellFrame({ children }: { children: React.ReactNode }) {
  const { focusMode } = useShell()
  return (
    <div className="flex min-h-dvh bg-canvas">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {!focusMode && <Topbar />}
        <main className={cn("mx-auto w-full min-w-0 flex-1", focusMode ? "max-w-none" : "max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8")}>{children}</main>
      </div>
      <CommandSearch />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <ShellFrame>{children}</ShellFrame>
    </ShellProvider>
  )
}
