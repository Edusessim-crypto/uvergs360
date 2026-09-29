"use client"

import { Download, FileSpreadsheet, FileText, Sheet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { reportService } from "@/services"

export function runExport(reportId: string, format: "pdf" | "xlsx" | "csv", label: string) {
  const promise = reportService.export(reportId, format)
  toast.promise(promise, {
    loading: `Gerando ${label}…`,
    success: (r) => ({ message: "Arquivo pronto para download", description: r.fileName }),
    error: "Não foi possível gerar o arquivo",
  })
  return promise
}

export function ExportMenu({ reportId, label = "Exportar", size = "default", variant = "secondary" }: { reportId: string; label?: string; size?: "sm" | "default"; variant?: "secondary" | "ghost" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Download /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Formato</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => runExport(reportId, "pdf", "relatório em PDF")}>
          <FileText /> Relatório (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => runExport(reportId, "xlsx", "planilha")}>
          <FileSpreadsheet /> Planilha (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => runExport(reportId, "csv", "arquivo CSV")}>
          <Sheet /> Dados (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
