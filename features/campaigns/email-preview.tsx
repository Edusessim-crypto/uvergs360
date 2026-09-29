"use client"

import * as React from "react"
import { CheckCheck, Monitor, Smartphone } from "lucide-react"
import type { CampaignChannel } from "@/types"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/brand/logo"
import { SegmentedControl } from "@/components/shared/segmented-control"

/** Pré-visualização de mensagem (e-mail em desktop/mobile ou balão de WhatsApp/SMS). */
export function EmailPreview({ channel, subject, preheader, body, cta }: { channel: CampaignChannel; subject: string; preheader: string; body: string; cta: string }) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop")

  if (channel !== "email") {
    return (
      <div className="rounded-xl bg-[#e9e2d6] p-5">
        <div className="mx-auto max-w-sm">
          <div className="mb-3 text-center text-[11px] text-[#6d6252]">Hoje</div>
          <div className="relative rounded-lg rounded-tl-none bg-white p-3 text-[13.5px] leading-relaxed text-[#1f2c33] shadow-sm">
            <div className="mb-1 text-[12px] font-semibold text-[#0f7a63]">UVERGS</div>
            <p className="whitespace-pre-line">{body || "Sua mensagem aparecerá aqui."}</p>
            {cta && <div className="mt-2 border-t border-black/5 pt-2 text-center text-[13px] font-medium text-[#027eb5]">{cta}</div>}
            <div className="mt-1 flex items-center justify-end gap-1 text-[10.5px] text-[#667781]">09:30 <CheckCheck className="size-3.5 text-[#53bdeb]" /></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-ink-2">Pré-visualização</span>
        <SegmentedControl
          size="sm"
          value={device}
          onChange={setDevice}
          options={[
            { value: "desktop", label: <><Monitor className="size-3.5" />Desktop</> },
            { value: "mobile", label: <><Smartphone className="size-3.5" />Mobile</> },
          ]}
        />
      </div>
      <div className="flex justify-center rounded-xl bg-canvas-2 p-5">
        <div className={cn("w-full overflow-hidden rounded-lg bg-white shadow-raised transition-[max-width] duration-300", device === "mobile" ? "max-w-[340px]" : "max-w-[600px]")}>
          <div className="border-b border-line-soft bg-canvas/60 px-4 py-2.5">
            <div className="truncate text-[13px] font-semibold text-ink">{subject || "Assunto do e-mail"}</div>
            <div className="truncate text-[11.5px] text-ink-3">UVERGS &lt;comunicacao@uvergs.org.br&gt; · {preheader}</div>
          </div>
          <div className="bg-navy-900 px-6 py-5">
            <div className="flex items-center gap-2.5"><LogoMark className="size-8" /><span className="font-display text-[15px] font-bold tracking-[0.04em] text-white">UVERGS</span></div>
          </div>
          <div className={cn("px-6 py-6", device === "mobile" && "px-5")}>
            <h3 className="font-display text-[19px] leading-snug font-semibold text-ink">{subject || "Assunto do e-mail"}</h3>
            <p className="mt-3 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-2">{body || "O conteúdo da sua mensagem aparecerá aqui."}</p>
            {cta && <span className="mt-5 inline-flex h-10 items-center rounded-md bg-brand-600 px-5 text-[13.5px] font-semibold text-white">{cta}</span>}
          </div>
          <div className="border-t border-line-soft px-6 py-4 text-[11px] leading-relaxed text-ink-3">
            União dos Vereadores do Rio Grande do Sul · Você recebe esta mensagem por ser vereador(a) cadastrado(a). Descadastrar.
          </div>
        </div>
      </div>
    </div>
  )
}
