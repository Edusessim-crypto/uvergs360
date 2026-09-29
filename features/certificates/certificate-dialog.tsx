"use client"

import { Copy, Download, Printer } from "lucide-react"
import { toast } from "sonner"
import type { Certificate } from "@/types"
import { certificateService } from "@/services"
import { formatLongDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { LogoMark } from "@/components/brand/logo"
import { QrCode } from "@/components/shared/qr-code"

export function copyValidation(code: string) {
  const url = `https://uvergs360.org.br/validar/${code}`
  try {
    navigator.clipboard?.writeText(url)
  } catch {
    /* clipboard indisponível */
  }
  toast.success("Link de validação copiado", { description: url })
}

export function downloadCertificate(c: Pick<Certificate, "id" | "participantName">) {
  toast.promise(certificateService.download([c.id]), {
    loading: "Gerando PDF do certificado…",
    success: { message: "Certificado pronto", description: `certificado-${c.participantName.split(" ")[0].toLowerCase()}.pdf` },
  })
}

/** Certificado institucional — pré-visualização em tela. */
export function CertificateArtwork({ c }: { c: Certificate }) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white shadow-card ring-1 ring-line-soft">
      <div className="absolute inset-3 rounded-md border border-gold-500/50" aria-hidden />
      <div className="absolute inset-[18px] rounded border border-navy-900/10" aria-hidden />
      <div className="absolute top-0 left-0 h-full w-2 bg-navy-900" aria-hidden />
      <div className="absolute top-0 left-2 h-full w-[3px] bg-gold-500" aria-hidden />
      <svg className="absolute -right-24 -bottom-24 size-80 text-navy-900/[0.035]" viewBox="0 0 200 200" aria-hidden>
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="10" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="currentColor" strokeWidth="10" />
      </svg>

      <div className="relative px-8 py-9 sm:px-14 sm:py-11">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold tracking-[0.04em] text-navy-900">UVERGS</div>
              <div className="text-[10.5px] text-ink-3">União dos Vereadores do Rio Grande do Sul</div>
            </div>
          </div>
          <div className="text-right text-[10.5px] font-semibold tracking-[0.14em] text-gold-700 uppercase">Certificado</div>
        </div>

        <div className="mt-9 text-center">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-ink-3 uppercase">Certificamos que</div>
          <div className="mt-3 font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] text-navy-900 sm:text-[34px]">{c.participantName}</div>
          <div className="mx-auto mt-3 h-px w-40 bg-gold-500" />
          <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-ink-2">
            participou do evento <span className="font-semibold text-ink">{c.eventTitle}</span>, promovido pela UVERGS em {c.city === "Online" ? "formato online" : `${c.city}/RS`}, em{" "}
            {formatLongDate(c.eventDate)}, com carga horária de <span className="font-semibold text-ink">{c.workload} horas</span>.
          </p>
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="grid flex-1 grid-cols-2 gap-6">
            {["Presidência UVERGS", "Diretoria de Formação"].map((s) => (
              <div key={s}>
                <svg viewBox="0 0 120 30" className="h-7 w-28 text-navy-800/70" aria-hidden>
                  <path d="M4 22c10-14 18-16 22-6s10 8 16-4 14-8 18 2 10 6 18-2 12-10 20-2 8 6 18 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <div className="mt-1 border-t border-line pt-1.5 text-[10.5px] font-medium text-ink-3">{s}</div>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <QrCode value={`https://uvergs360.org.br/validar/${c.code}`} size={72} className="p-0" />
            <div className="mt-1.5 font-mono text-[10px] text-ink-3">{c.code}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CertificateDialog({ certificate, onOpenChange }: { certificate: Certificate | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!certificate} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="bg-canvas">
        <DialogTitle className="sr-only">Certificado</DialogTitle>
        {certificate && (
          <>
            <div className="scrollbar-thin overflow-y-auto p-5 sm:p-8">
              <CertificateArtwork c={certificate} />
            </div>
            <DialogFooter className="bg-white sm:justify-between">
              <span className="text-xs text-ink-3">Validação pública por QR Code ou código {certificate.code}</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => copyValidation(certificate.code)}><Copy />Copiar validação</Button>
                <Button variant="secondary" onClick={() => toast.info("Enviado para impressão")}><Printer />Imprimir</Button>
                <Button onClick={() => downloadCertificate(certificate)}><Download />Baixar PDF</Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
