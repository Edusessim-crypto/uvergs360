"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Handshake, ListChecks, Mail, MessageCircle } from "lucide-react"
import type { Councilor, TimelineKind } from "@/types"
import { councilorService } from "@/services"
import { qk } from "@/lib/query-keys"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field } from "@/components/shared/field"
import { cn } from "@/lib/utils"

function useInvalidate(id: string) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: qk.councilor(id) })
    qc.invalidateQueries({ queryKey: qk.councilors })
  }
}

function DialogShell({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  onSubmit,
  submitLabel,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent size="md">
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">{children}</DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const messageSchema = z.object({
  channel: z.enum(["E-mail", "WhatsApp"]),
  subject: z.string().min(3, "Informe o assunto"),
  body: z.string().min(10, "Escreva ao menos 10 caracteres"),
})

export function SendMessageDialog({ councilor, open, onOpenChange }: { councilor: Councilor; open: boolean; onOpenChange: (v: boolean) => void }) {
  const invalidate = useInvalidate(councilor.id)
  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { channel: councilor.preferredChannel === "WhatsApp" ? "WhatsApp" : "E-mail", subject: "", body: "" },
  })
  const m = useMutation({
    mutationFn: (v: z.infer<typeof messageSchema>) => councilorService.sendMessage([councilor.id], v.channel, v.subject),
    onSuccess: (_, v) => {
      invalidate()
      toast.success("Mensagem enviada com sucesso", { description: `${v.channel} para ${councilor.name}` })
      onOpenChange(false)
      form.reset()
    },
  })
  const channel = form.watch("channel")
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<Mail className="size-5" />}
      title="Enviar mensagem"
      description={`Para ${councilor.name} · canal preferido: ${councilor.preferredChannel}`}
      onSubmit={form.handleSubmit((v) => m.mutate(v))}
      submitLabel="Enviar agora"
      loading={m.isPending}
    >
      <div className="grid grid-cols-2 gap-2">
        {(["E-mail", "WhatsApp"] as const).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => form.setValue("channel", c)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors",
              channel === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line hover:bg-canvas",
            )}
          >
            {c === "E-mail" ? <Mail className="size-4" /> : <MessageCircle className="size-4" />}
            {c}
            <span className="ml-auto truncate text-xs font-normal text-ink-3">{c === "E-mail" ? councilor.email : councilor.phone}</span>
          </button>
        ))}
      </div>
      <Field label="Assunto" error={form.formState.errors.subject?.message} required>
        <Input {...form.register("subject")} placeholder="Ex.: Convite para o Seminário de Gestão Pública" aria-invalid={!!form.formState.errors.subject} />
      </Field>
      <Field label="Mensagem" error={form.formState.errors.body?.message} required>
        <Textarea {...form.register("body")} rows={5} placeholder={`Olá, ${councilor.name.split(" ")[0]}…`} aria-invalid={!!form.formState.errors.body} />
      </Field>
    </DialogShell>
  )
}

const interactionSchema = z.object({
  kind: z.enum(["interacao", "email", "whatsapp", "tarefa"]),
  title: z.string().min(3, "Descreva a interação"),
  description: z.string().optional(),
  date: z.string().min(1, "Informe a data"),
})

export function RegisterInteractionDialog({ councilor, open, onOpenChange }: { councilor: Councilor; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient()
  const today = new Date()
  const local = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const form = useForm<z.infer<typeof interactionSchema>>({
    resolver: zodResolver(interactionSchema),
    defaultValues: { kind: "interacao", title: "", description: "", date: local },
  })
  const m = useMutation({
    mutationFn: (v: z.infer<typeof interactionSchema>) => {
      const at = v.date === local ? new Date() : new Date(`${v.date}T12:00:00`)
      return councilorService.registerInteraction(councilor.id, { kind: v.kind as TimelineKind, title: v.title, description: v.description, at: at.toISOString() })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.councilorTimeline(councilor.id) })
      qc.invalidateQueries({ queryKey: qk.councilor(councilor.id) })
      toast.success("Interação registrada", { description: "Adicionada à linha do tempo do relacionamento." })
      onOpenChange(false)
      form.reset()
    },
  })
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<Handshake className="size-5" />}
      title="Registrar interação"
      description="Ligações, reuniões e visitas entram na linha do tempo 360º."
      onSubmit={form.handleSubmit((v) => m.mutate(v))}
      submitLabel="Registrar"
      loading={m.isPending}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo">
          <Select value={form.watch("kind")} onValueChange={(v) => form.setValue("kind", v as never)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interacao">Reunião / visita</SelectItem>
              <SelectItem value="tarefa">Ligação telefônica</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Data" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register("date")} />
        </Field>
      </div>
      <Field label="Resumo" error={form.formState.errors.title?.message} required>
        <Input {...form.register("title")} placeholder="Ex.: Reunião sobre o Encontro Regional Serra" aria-invalid={!!form.formState.errors.title} />
      </Field>
      <Field label="Observações">
        <Textarea {...form.register("description")} rows={3} placeholder="Detalhes, encaminhamentos e próximos passos" />
      </Field>
    </DialogShell>
  )
}

const taskSchema = z.object({
  title: z.string().min(3, "Descreva a tarefa"),
  assignee: z.string().min(1),
  due: z.string().min(1, "Informe o prazo"),
  priority: z.enum(["alta", "media", "baixa"]),
})

export function CreateTaskDialog({ councilor, open, onOpenChange }: { councilor: Councilor; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient()
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", assignee: "Ricardo Martins", due: "", priority: "media" },
  })
  const m = useMutation({
    mutationFn: (v: z.infer<typeof taskSchema>) =>
      councilorService.createTask(councilor.id, { title: v.title, assignee: v.assignee, dueAt: new Date(`${v.due}T18:00:00`).toISOString(), priority: v.priority }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.councilorTasks(councilor.id) })
      toast.success("Tarefa criada", { description: `Vinculada a ${councilor.name}` })
      onOpenChange(false)
      form.reset()
    },
  })
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<ListChecks className="size-5" />}
      title="Criar tarefa"
      description={`Acompanhamento vinculado a ${councilor.name}`}
      onSubmit={form.handleSubmit((v) => m.mutate(v))}
      submitLabel="Criar tarefa"
      loading={m.isPending}
    >
      <Field label="Tarefa" error={form.formState.errors.title?.message} required>
        <Input {...form.register("title")} placeholder="Ex.: Enviar programação do Seminário" aria-invalid={!!form.formState.errors.title} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Responsável" className="col-span-3 sm:col-span-1">
          <Select value={form.watch("assignee")} onValueChange={(v) => form.setValue("assignee", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Ricardo Martins", "Juliana Rocha", "Felipe Andrade", "Camila Teixeira"].map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prazo" error={form.formState.errors.due?.message} className="col-span-3 sm:col-span-1" required>
          <Input type="date" {...form.register("due")} aria-invalid={!!form.formState.errors.due} />
        </Field>
        <Field label="Prioridade" className="col-span-3 sm:col-span-1">
          <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as never)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </DialogShell>
  )
}
