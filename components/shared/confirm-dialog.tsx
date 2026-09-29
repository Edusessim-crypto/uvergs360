"use client"

import * as React from "react"
import { TriangleAlert, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/** Confirmação com estado de carregamento — usada antes de ações que futuramente dependem do backend. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  icon: Icon = tone === "danger" ? TriangleAlert : Send,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: "default" | "danger"
  icon?: React.ComponentType<{ className?: string }>
  onConfirm: () => Promise<unknown> | void
}) {
  const [loading, setLoading] = React.useState(false)
  const handle = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent size="sm" showCloseButton={false}>
        <DialogHeader className="pr-6">
          <span className={cn("mb-2 flex size-10 items-center justify-center rounded-lg", tone === "danger" ? "bg-danger-50 text-danger-500" : "bg-brand-50 text-brand-600")}>
            <Icon className="size-5" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children && <DialogBody className="pb-5">{children}</DialogBody>}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "destructive" : "default"} onClick={handle} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
