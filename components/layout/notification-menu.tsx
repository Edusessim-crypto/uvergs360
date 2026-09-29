"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Award, Bell, CheckCheck, ClipboardList, CreditCard, Landmark, ListChecks, Send, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { notificationService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatTimeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types"
import * as React from "react"

export const NOTIFICATION_ICON: Record<Notification["kind"], { icon: typeof Bell; className: string }> = {
  inscricao: { icon: ClipboardList, className: "bg-brand-50 text-brand-600" },
  pagamento: { icon: CreditCard, className: "bg-success-50 text-success-700" },
  campanha: { icon: Send, className: "bg-[#f1ebfb] text-[#6b3fc0]" },
  camara: { icon: Landmark, className: "bg-canvas-2 text-ink-2" },
  certificado: { icon: Award, className: "bg-gold-50 text-gold-700" },
  sistema: { icon: Settings2, className: "bg-canvas-2 text-ink-2" },
  tarefa: { icon: ListChecks, className: "bg-warning-50 text-warning-700" },
}

export function NotificationRow({ n, onClick }: { n: Notification; onClick?: () => void }) {
  const meta = NOTIFICATION_ICON[n.kind]
  const Icon = meta.icon
  return (
    <button onClick={onClick} className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-canvas">
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md", meta.className)}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-ink">{n.title}</span>
          {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" aria-label="Não lida" />}
        </span>
        <span className="line-clamp-2 text-[12.5px] leading-snug text-ink-2">{n.description}</span>
        <span className="mt-1 block text-[11.5px] text-ink-3">{formatTimeAgo(n.at)}</span>
      </span>
    </button>
  )
}

export function NotificationMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: qk.notifications, queryFn: () => notificationService.list() })
  const unread = data?.filter((n) => !n.read).length ?? 0

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ""}`}>
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-white tnum">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <div>
            <div className="text-[13.5px] font-semibold text-ink">Notificações</div>
            <div className="text-xs text-ink-3">{unread ? `${unread} não lidas` : "Tudo em dia"}</div>
          </div>
          <Button variant="ghost" size="xs" onClick={() => markAll.mutate()} disabled={!unread} loading={markAll.isPending}>
            <CheckCheck /> Marcar como lidas
          </Button>
        </div>
        <div className="scrollbar-thin max-h-[380px] overflow-y-auto p-1.5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-3 py-2.5">
                  <Skeleton className="size-8" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))
            : data?.slice(0, 6).map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onClick={() => {
                    setOpen(false)
                    notificationService.markRead(n.id).then(() => qc.invalidateQueries({ queryKey: qk.notifications }))
                    if (n.href) router.push(n.href)
                  }}
                />
              ))}
        </div>
        <div className="border-t border-line-soft p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/notificacoes" onClick={() => setOpen(false)}>
              Ver todas
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
