"use client"

import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"

/**
 * QR Code visual. Na Etapa 1 codifica apenas o código de demonstração;
 * na Etapa 2 conterá um token assinado validado pela API de check-in/validação.
 */
export function QrCode({ value, size = 160, className, dark = "#041a4f" }: { value: string; size?: number; className?: string; dark?: string }) {
  return (
    <div className={cn("inline-flex rounded-lg bg-white p-3", className)}>
      <QRCodeSVG value={value} size={size} fgColor={dark} bgColor="#ffffff" level="M" marginSize={0} />
    </div>
  )
}
