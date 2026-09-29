"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleCheck, Maximize2, Minimize2, QrCode, ScanLine, Search, UserRound, X } from "lucide-react"
import { toast } from "sonner"
import type { Registration } from "@/types"
import { checkinService, ServiceError } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PersonAvatar } from "@/components/shared/person-avatar"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { useShell } from "@/components/layout/shell-context"
import { useDebounce } from "@/hooks/use-debounce"

type Phase = "idle" | "scanning" | "found" | "confirming" | "done"

export function CheckinView() {
  const params = useSearchParams()
  const qc = useQueryClient()
  const { focusMode, setFocusMode } = useShell()
  const events = useQuery({ queryKey: qk.checkinEvents, queryFn: () => checkinService.listEvents() })
  const [eventId, setEventId] = React.useState<string | null>(params.get("evento"))
  const activeId = eventId ?? events.data?.[0]?.id ?? null
  const session = useQuery({ queryKey: qk.checkinSession(activeId ?? ""), queryFn: () => checkinService.getSession(activeId!), enabled: !!activeId })
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [found, setFound] = React.useState<Registration | null>(null)
  const [q, setQ] = React.useState("")
  const dq = useDebounce(q, 150)
  const search = useQuery({ queryKey: ["checkin-search", activeId, dq], queryFn: () => checkinService.search(activeId!, dq), enabled: !!activeId && dq.length >= 2 })

  React.useEffect(() => () => setFocusMode(false), [setFocusMode])

  const scan = async () => {
    if (!activeId) return
    setPhase("scanning")
    try {
      const r = await checkinService.scan(activeId)
      setFound(r.registration)
      setPhase("found")
    } catch (e) {
      toast.error(e instanceof ServiceError ? e.message : "Falha na leitura")
      setPhase("idle")
    }
  }

  const confirm = useMutation({
    mutationFn: (id: string) => checkinService.confirm(id),
    onMutate: () => setPhase("confirming"),
    onSuccess: (entry) => {
      setPhase("done")
      qc.invalidateQueries({ queryKey: qk.checkinSession(activeId!) })
      qc.invalidateQueries({ queryKey: ["events"] })
      toast.success("Presença registrada", { description: `${entry.name} · ${formatTime(entry.at)}` })
      setTimeout(() => { setPhase("idle"); setFound(null) }, 2600)
    },
    onError: (e) => {
      toast.error(e instanceof ServiceError ? e.message : "Erro ao registrar")
      setPhase("found")
    },
  })

  const s = session.data
  const pending = s ? Math.max(0, s.registered - s.present) : 0
  const pct = s && s.registered ? Math.round((s.present / s.registered) * 100) : 0

  return (
    <div className={cn("grid min-h-[calc(100dvh-8rem)] gap-0 overflow-hidden rounded-xl bg-navy-950 text-white shadow-raised lg:grid-cols-[1fr_380px]", focusMode && "min-h-dvh rounded-none")}>
      {/* Área de leitura */}
      <section className="relative flex flex-col">
        <div className="absolute inset-0 bg-grid-navy" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ScanLine className="size-5" /></span>
            <div>
              <div className="text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">Modo check-in</div>
              <Select value={activeId ?? undefined} onValueChange={(v) => { setEventId(v); setPhase("idle"); setFound(null) }}>
                <SelectTrigger size="sm" className="h-7 border-0 bg-transparent px-0 text-[15px] font-semibold text-white shadow-none hover:border-0 [&_svg]:text-white/60">
                  <SelectValue placeholder="Selecione o evento" />
                </SelectTrigger>
                <SelectContent>{events.data?.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="dark" size="sm" onClick={() => setFocusMode(!focusMode)}>
            {focusMode ? <Minimize2 /> : <Maximize2 />}{focusMode ? "Sair da tela cheia" : "Tela cheia"}
          </Button>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
          {phase === "found" || phase === "confirming" ? (
            <div className="w-full max-w-md animate-fade-up rounded-2xl bg-white p-7 text-ink shadow-pop">
              <div className="text-[11px] font-semibold tracking-[0.14em] text-success-700 uppercase">Participante encontrado</div>
              <div className="mt-5 flex items-center gap-4">
                <PersonAvatar name={found!.participantName} size="xl" />
                <div className="min-w-0">
                  <div className="font-display text-2xl leading-tight font-semibold">{found!.participantName}</div>
                  <div className="text-[14px] text-ink-2">{found!.chamberName.replace("Câmara Municipal de", "Câmara de")}</div>
                  <div className="mt-1 font-mono text-xs text-ink-3">{found!.code} · {found!.role}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-[12.5px]">
                <div className="rounded-lg bg-canvas px-3 py-2"><div className="text-ink-3">Inscrição</div><div className="font-semibold text-success-700">Confirmada</div></div>
                <div className="rounded-lg bg-canvas px-3 py-2"><div className="text-ink-3">Pagamento</div><div className="font-semibold text-ink capitalize">{found!.paymentStatus}</div></div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="secondary" className="flex-1" size="lg" onClick={() => { setPhase("idle"); setFound(null) }} disabled={phase === "confirming"}><X />Cancelar</Button>
                <Button className="flex-[2]" size="lg" onClick={() => confirm.mutate(found!.id)} loading={phase === "confirming"}>Confirmar entrada</Button>
              </div>
            </div>
          ) : phase === "done" ? (
            <div className="flex animate-fade-up flex-col items-center text-center">
              <span className="relative flex size-28 items-center justify-center">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-success-500/30" />
                <span className="relative flex size-28 items-center justify-center rounded-full bg-success-500 shadow-[0_12px_40px_-8px_rgb(31_175_90/0.7)]"><CircleCheck className="size-14" strokeWidth={2} /></span>
              </span>
              <div className="mt-7 font-display text-[32px] font-semibold tracking-[-0.02em]">Presença registrada</div>
              <div className="mt-1 text-[15px] text-white/65">{found?.participantName} · {formatTime(new Date())}</div>
            </div>
          ) : (
            <button onClick={scan} disabled={phase === "scanning" || !activeId} className="group/scan flex flex-col items-center outline-none">
              <div className="relative size-[260px] sm:size-[300px]">
                {["top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
                  <span key={c} className={cn("absolute size-14 border-gold-500 transition-all duration-300", c, phase === "scanning" && "border-success-500")} />
                ))}
                <div className="absolute inset-5 flex items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10 transition-colors group-hover/scan:bg-white/[0.07]">
                  <QrCode className={cn("size-24 text-white/25 transition-all", phase === "scanning" && "scale-95 text-white/40")} strokeWidth={1.2} />
                </div>
                {phase === "scanning" && <span className="absolute inset-x-6 top-6 h-0.5 animate-scan rounded-full bg-success-500 shadow-[0_0_16px_4px_rgb(31_175_90/0.6)] [--scan-distance:240px] sm:[--scan-distance:280px]" />}
              </div>
              <div className="mt-8 font-display text-[26px] font-semibold tracking-[0.04em]">{phase === "scanning" ? "LENDO QR CODE…" : "SCANEAR QR CODE"}</div>
              <div className="mt-1.5 text-[14px] text-white/55">{phase === "scanning" ? "Mantenha a credencial em frente à câmera" : "Toque para iniciar a leitura da credencial digital"}</div>
            </button>
          )}
        </div>

        <div className="relative border-t border-white/10 px-6 py-4">
          <div className="relative mx-auto max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca manual por nome ou código de inscrição" className="h-10 w-full rounded-lg bg-white/[0.07] pr-3 pl-9 text-[13.5px] text-white ring-1 ring-white/10 outline-none placeholder:text-white/40 focus:ring-white/30" />
            {search.data && search.data.length > 0 && q.length >= 2 && (
              <ul className="absolute bottom-12 z-10 w-full overflow-hidden rounded-lg bg-white text-ink shadow-pop">
                {search.data.map((r) => (
                  <li key={r.id}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-canvas"
                      onClick={() => {
                        setQ("")
                        if (r.checkedInAt) return toast.info("Presença já registrada", { description: `${r.participantName} às ${formatTime(r.checkedInAt)}` })
                        setFound(r)
                        setPhase("found")
                      }}
                    >
                      <UserRound className="size-4 text-ink-3" />
                      <span className="flex-1 truncate text-[13.5px] font-medium">{r.participantName}</span>
                      <span className="text-xs text-ink-3">{r.checkedInAt ? "Presente" : "Aguardando"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Painel lateral */}
      <aside className="flex flex-col border-t border-white/10 bg-navy-900 lg:border-t-0 lg:border-l">
        <div className="grid grid-cols-3 border-b border-white/10">
          {[
            ["Inscritos", s?.registered],
            ["Presentes", s?.present],
            ["Aguardando", s ? pending : undefined],
          ].map(([l, v], i) => (
            <div key={String(l)} className={cn("px-5 py-5", i > 0 && "border-l border-white/10")}>
              <div className="text-[11.5px] text-white/50">{l}</div>
              <div className={cn("mt-1 font-display text-[28px] leading-none font-semibold tnum", i === 1 && "text-[#5fe39a]")}>{v === undefined ? "—" : <AnimatedNumber value={Number(v)} />}</div>
            </div>
          ))}
        </div>
        <div className="border-b border-white/10 px-5 py-4">
          <div className="mb-2 flex justify-between text-xs text-white/60"><span>Ocupação do credenciamento</span><span className="font-semibold text-white">{pct}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-success-500 transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="flex-1 px-5 py-4">
          <div className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">Últimas entradas</div>
          <ul className="space-y-1">
            {s?.recent.map((r, i) => (
              <li key={r.id} className={cn("flex items-center gap-3 rounded-lg px-2 py-2", i === 0 && phase === "done" && "animate-fade-up bg-white/[0.06]")}>
                <span className="w-11 font-mono text-[12.5px] text-white/50 tnum">{formatTime(r.at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{r.name}</span>
                  <span className="block truncate text-[11.5px] text-white/45">{r.chamberName.replace("Câmara Municipal de", "Câmara de")}</span>
                </span>
                <CircleCheck className="size-4 text-[#5fe39a]" />
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
