"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

/** Drawer lateral grande para formulários de criação/edição. */
export function DrawerForm({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  onSubmit,
  submitLabel = "Salvar",
  loading,
  size = "lg",
  footerNote,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  submitLabel?: string
  loading?: boolean
  size?: "md" | "lg" | "xl"
  footerNote?: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <SheetContent size={size}>
        <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col" noValidate>
          <SheetHeader>
            <div className="flex items-start gap-3.5">
              {icon && <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>}
              <div>
                <SheetTitle>{title}</SheetTitle>
                {description && <SheetDescription className="mt-0.5">{description}</SheetDescription>}
              </div>
            </div>
          </SheetHeader>
          <SheetBody>{children}</SheetBody>
          <SheetFooter className="justify-between">
            <span className="text-xs text-ink-3">{footerNote}</span>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                {submitLabel}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
