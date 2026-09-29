"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Award, CalendarDays, Download, Eye, Landmark, Map, Send, Users } from "lucide-react"
import type { ReportDefinition } from "@/types"
import { reportService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatNumber } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/page-header"
import { runExport } from "@/components/shared/export-menu"
import { BarList } from "@/components/charts/chart-kit"

const ICONS: Record<string, typeof Users> = { eventos: CalendarDays, participacoes: Users, territorio: Map, certificados: Award, campanhas: Send, camaras: Landmark }

export function ReportsView() {
  const { data, isLoading } = useQuery({ queryKey: qk.reports, queryFn: () => reportService.list() })
  const [open, setOpen] = React.useState<ReportDefinition | null>(null)
  return (
    <div>
      <PageHeader title="Relatórios" description="Relatórios institucionais prontos para diretoria, conselho e prestação de contas." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[230px] rounded-xl" />)}
        {data?.map((r) => {
          const Icon = ICONS[r.id] ?? Users
          return (
            <div key={r.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="size-5" /></span>
                <span className="text-[11px] font-medium text-ink-3">{r.category}</span>
              </div>
              <div className="mt-4 font-display text-[16px] font-semibold text-ink">{r.title}</div>
              <p className="mt-1 text-[13px] text-ink-2">{r.description}</p>
              <dl className="mt-4 grid flex-1 grid-cols-3 gap-2">
                {r.highlights.map((h) => (
                  <div key={h.label} className="rounded-lg bg-canvas px-2.5 py-2"><dt className="truncate text-[10.5px] text-ink-3">{h.label}</dt><dd className="font-display text-[15px] font-semibold text-ink tnum">{h.value}</dd></div>
                ))}
              </dl>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setOpen(r)}><Eye />Visualizar</Button>
                <Button size="sm" className="flex-1" onClick={() => runExport(r.id, "pdf", `relatório de ${r.title.toLowerCase()}`)}><Download />Exportar</Button>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent size="xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>Relatório de {open.title}</DialogTitle>
                <DialogDescription>{open.description} Dados consolidados até hoje.</DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {open.highlights.map((h) => (
                    <div key={h.label} className="rounded-lg bg-canvas px-4 py-3"><div className="text-xs text-ink-3">{h.label}</div><div className="font-display text-xl font-semibold text-ink tnum">{h.value}</div></div>
                  ))}
                </div>
                <BarList items={open.series.slice(0, 8)} />
                <div className="overflow-hidden rounded-lg border border-line-soft">
                  <Table>
                    <TableHeader><TableRow>{open.columns.map((c) => <TableHead key={c} className="border-t-0">{c}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>
                      {open.rows.slice(0, 10).map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="h-11 font-medium">{row.label}</TableCell>
                          {row.values.map((v, i) => <TableCell key={i} className="h-11 text-ink-2 tnum">{typeof v === "number" ? formatNumber(v) : v}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="secondary" onClick={() => runExport(open.id, "xlsx", "planilha")}>Excel</Button>
                <Button onClick={() => runExport(open.id, "pdf", "relatório em PDF")}><Download />Exportar PDF</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
