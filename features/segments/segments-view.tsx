"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Layers, Plus, Send, Trash2, TrendingDown, TrendingUp, Users } from "lucide-react"
import { toast } from "sonner"
import type { SegmentField, SegmentRule } from "@/types"
import { segmentService } from "@/services"
import { qk } from "@/lib/query-keys"
import { formatNumber, formatRelativeDay } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/page-header"
import { Field } from "@/components/shared/field"
import { AnimatedNumber } from "@/components/shared/animated-number"
import { useDebounce } from "@/hooks/use-debounce"

const FIELDS: { value: SegmentField; label: string; values: string[] }[] = [
  { value: "municipio", label: "Município", values: ["Caxias do Sul", "Porto Alegre", "Gramado", "Canoas", "Pelotas", "Santa Maria", "Passo Fundo", "Lajeado"] },
  { value: "regiao", label: "Região", values: ["Metropolitana", "Serra", "Vales", "Litoral", "Central", "Norte", "Missões", "Fronteira", "Sul"] },
  { value: "participou_evento", label: "Participou de evento", values: ["Sim", "Não"] },
  { value: "cargo", label: "Cargo", values: ["Vereador", "Presidente", "Assessor parlamentar", "Servidor da Câmara"] },
  { value: "interesse", label: "Interesse", values: ["Gestão pública", "Orçamento e finanças", "Saúde", "Educação", "Turismo", "Meio ambiente"] },
  { value: "situacao_cadastral", label: "Situação cadastral", values: ["Completo", "Incompleto"] },
  { value: "portal", label: "Portal Meu UVERGS", values: ["Ativo", "Não ativado"] },
  { value: "primeiro_mandato", label: "Primeiro mandato", values: ["Sim", "Não"] },
]

let rid = 0
const newRule = (field: SegmentField = "municipio"): SegmentRule => ({ id: `r${++rid}`, field, operator: "e", value: FIELDS.find((f) => f.value === field)!.values[0] })

function SegmentBuilder({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient()
  const [name, setName] = React.useState("")
  const [rules, setRules] = React.useState<SegmentRule[]>(() => [
    { id: "a", field: "municipio", operator: "e", value: "Caxias do Sul" },
    { id: "b", field: "participou_evento", operator: "e", value: "Não" },
  ])
  const key = useDebounce(JSON.stringify(rules), 200)
  const estimate = useQuery({ queryKey: qk.segmentEstimate(key), queryFn: () => segmentService.estimate(JSON.parse(key)), placeholderData: (p) => p, enabled: open })
  const save = useMutation({
    mutationFn: () => segmentService.create({ name: name || "Novo segmento", description: rules.map((r) => `${FIELDS.find((f) => f.value === r.field)?.label} ${r.operator === "e" ? "é" : "não é"} ${r.value}`).join(" e "), rules, count: estimate.data ?? 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.segments })
      toast.success("Segmento criado", { description: `${formatNumber(estimate.data ?? 0)} pessoas` })
      onOpenChange(false)
      setName("")
    },
  })
  const update = (id: string, patch: Partial<SegmentRule>) => setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Criar segmento</DialogTitle>
          <DialogDescription>Combine condições. O público é recalculado a cada alteração.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <Field label="Nome do segmento"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Caxias — nunca participaram" /></Field>
          <div className="space-y-2">
            {rules.map((r, i) => {
              const f = FIELDS.find((x) => x.value === r.field)!
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line-soft bg-canvas/50 p-2.5">
                  <span className="w-8 text-center text-[11px] font-semibold text-ink-3 uppercase">{i === 0 ? "Se" : "e"}</span>
                  <Select value={r.field} onValueChange={(v) => update(r.id, { field: v as SegmentField, value: FIELDS.find((x) => x.value === v)!.values[0] })}>
                    <SelectTrigger className="w-[190px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{FIELDS.map((x) => <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={r.operator} onValueChange={(v) => update(r.id, { operator: v as SegmentRule["operator"] })}>
                    <SelectTrigger className="w-[90px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="e">é</SelectItem><SelectItem value="nao_e">não é</SelectItem></SelectContent>
                  </Select>
                  <Select value={r.value} onValueChange={(v) => update(r.id, { value: v })}>
                    <SelectTrigger className="min-w-[160px] flex-1 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{f.values.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon-sm" onClick={() => setRules(rules.filter((x) => x.id !== r.id))} disabled={rules.length === 1} aria-label="Remover condição"><Trash2 /></Button>
                </div>
              )
            })}
            <Button variant="secondary" size="sm" onClick={() => setRules([...rules, newRule("regiao")])}><Plus />Adicionar condição</Button>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-navy-900 px-5 py-4 text-white">
            <span className="flex size-11 items-center justify-center rounded-lg bg-white/10"><Users className="size-5" /></span>
            <div className="flex-1">
              <div className="font-display text-[26px] leading-none font-semibold tnum">{estimate.data === undefined ? "—" : <AnimatedNumber value={estimate.data} duration={400} />} <span className="text-[15px] font-medium text-white/70">pessoas</span></div>
              <div className="mt-1 text-[12.5px] text-white/60">correspondem a essas condições, de {formatNumber(segmentService.baseContacts)} contatos da base.</div>
            </div>
            <span className={cn("size-2 rounded-full", estimate.isFetching ? "animate-pulse bg-gold-500" : "bg-success-500")} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} loading={save.isPending}>Salvar segmento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SegmentsView() {
  const router = useRouter()
  const params = useSearchParams()
  const { data, isLoading } = useQuery({ queryKey: qk.segments, queryFn: () => segmentService.list() })
  const [open, setOpen] = React.useState(params.get("novo") === "1")
  return (
    <div>
      <PageHeader title="Segmentos" description="Públicos dinâmicos para campanhas, jornadas e convites." actions={<Button onClick={() => setOpen(true)}><Plus />Criar segmento</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[190px] rounded-xl" />)}
        {data?.map((s) => (
          <div key={s.id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Layers className="size-4" /></span>
              <span className="text-[11px] font-medium text-ink-3">{s.kind === "dinamico" ? "Dinâmico" : "Estático"}</span>
            </div>
            <div className="mt-3 font-display text-[15px] font-semibold text-ink">{s.name}</div>
            <div className="mt-0.5 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-3">{s.description}</div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="font-display text-[26px] leading-none font-semibold text-ink tnum">{formatNumber(s.count)}</div>
                <div className="mt-1 text-[11.5px] text-ink-3">pessoas · atualizado {formatRelativeDay(s.updatedAt).toLowerCase()}</div>
              </div>
              {s.trend !== 0 && (
                <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", s.trend > 0 ? "text-success-700" : "text-danger-700")}>
                  {s.trend > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {s.trend > 0 ? "+" : ""}{String(s.trend).replace(".", ",")}%
                </span>
              )}
            </div>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => router.push("/campanhas/nova")}><Send />Usar em campanha</Button>
          </div>
        ))}
      </div>
      <SegmentBuilder open={open} onOpenChange={setOpen} />
    </div>
  )
}
