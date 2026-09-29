"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { UserPlus, UserPen } from "lucide-react"
import type { Councilor, CouncilorRole } from "@/types"
import { chamberService, councilorService } from "@/services"
import { qk } from "@/lib/query-keys"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DrawerForm } from "@/components/shared/drawer-form"
import { Field, FormSection } from "@/components/shared/field"
import { FilterSelect } from "@/components/shared/filter-bar"

const ROLES: CouncilorRole[] = ["Vereador", "Vereadora", "Presidente", "Vice-presidente", "1º Secretário", "2º Secretário"]

const schema = z.object({
  name: z.string().min(5, "Informe o nome completo"),
  cpf: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos"),
  email: z.email("E-mail inválido"),
  phone: z.string().min(10, "Telefone incompleto"),
  chamberId: z.string().min(1, "Selecione a Câmara"),
  role: z.enum(ROLES as [CouncilorRole, ...CouncilorRole[]]),
  mandate: z.string().min(4),
})
type FormValues = z.infer<typeof schema>

function maskCpfInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function CouncilorFormDrawer({
  open,
  onOpenChange,
  councilor,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  councilor?: Councilor
  onSaved?: (c: Councilor) => void
}) {
  const qc = useQueryClient()
  const chambers = useQuery({ queryKey: qk.chambers, queryFn: () => chamberService.list(), enabled: open })
  const editing = Boolean(councilor)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", cpf: "", email: "", phone: "", chamberId: "", role: "Vereador", mandate: "2025–2028" },
  })

  React.useEffect(() => {
    if (!open) return
    form.reset(
      councilor
        ? { name: councilor.name, cpf: maskCpfInput(councilor.cpf), email: councilor.email, phone: councilor.phone, chamberId: councilor.chamberId, role: councilor.role, mandate: councilor.mandate }
        : { name: "", cpf: "", email: "", phone: "", chamberId: "", role: "Vereador", mandate: "2025–2028" },
    )
  }, [open, councilor, form])

  const m = useMutation({
    mutationFn: async (v: FormValues) => {
      const chamber = chambers.data?.find((c) => c.id === v.chamberId)
      if (councilor) {
        return councilorService.update(councilor.id, {
          name: v.name, cpf: v.cpf.replace(/\D/g, ""), email: v.email, phone: v.phone, role: v.role, mandate: v.mandate,
          ...(chamber && chamber.id !== councilor.chamberId ? { chamberId: chamber.id, chamberName: chamber.name, municipalityId: chamber.municipalityId, municipalityName: chamber.municipalityName } : {}),
        })
      }
      return councilorService.create({ ...v, municipalityId: chamber?.municipalityId ?? "" })
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: qk.councilors })
      qc.invalidateQueries({ queryKey: qk.councilor(c.id) })
      qc.invalidateQueries({ queryKey: qk.councilorTimeline(c.id) })
      toast.success(editing ? "Cadastro atualizado com sucesso." : "Vereador cadastrado com sucesso.", { description: `${c.name} · ${c.chamberName}` })
      onOpenChange(false)
      onSaved?.(c)
    },
  })

  const errors = form.formState.errors
  const chamberOptions = React.useMemo(
    () => (chambers.data ?? []).map((c) => ({ value: c.id, label: c.municipalityName, hint: c.regionName })).sort((a, b) => a.label.localeCompare(b.label)),
    [chambers.data],
  )
  const chamberId = form.watch("chamberId")

  return (
    <DrawerForm
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Editar vereador" : "Novo vereador"}
      description={editing ? "Atualize os dados cadastrais e institucionais." : "Cadastre um vereador na base de relacionamento da UVERGS."}
      icon={editing ? <UserPen className="size-5" /> : <UserPlus className="size-5" />}
      onSubmit={form.handleSubmit((v) => m.mutate(v))}
      submitLabel={editing ? "Salvar alterações" : "Salvar vereador"}
      loading={m.isPending}
      footerNote="Campos com * são obrigatórios"
    >
      <div className="space-y-8">
        <FormSection title="Dados pessoais" description="Identificação e contato">
          <Field label="Nome completo" error={errors.name?.message} required>
            <Input {...form.register("name")} placeholder="Ex.: Ana Paula Bortolini" aria-invalid={!!errors.name} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CPF" error={errors.cpf?.message} required>
              <Input
                value={form.watch("cpf")}
                onChange={(e) => form.setValue("cpf", maskCpfInput(e.target.value), { shouldValidate: form.formState.isSubmitted })}
                placeholder="000.000.000-00"
                inputMode="numeric"
                aria-invalid={!!errors.cpf}
              />
            </Field>
            <Field label="Telefone" error={errors.phone?.message} required>
              <Input
                value={form.watch("phone")}
                onChange={(e) => form.setValue("phone", maskPhone(e.target.value), { shouldValidate: form.formState.isSubmitted })}
                placeholder="(51) 99999-0000"
                inputMode="tel"
                aria-invalid={!!errors.phone}
              />
            </Field>
          </div>
          <Field label="E-mail" error={errors.email?.message} required>
            <Input type="email" {...form.register("email")} placeholder="nome@camara.rs.leg.br" aria-invalid={!!errors.email} />
          </Field>
        </FormSection>

        <FormSection title="Vínculo institucional" description="Câmara, cargo e mandato">
          <Field label="Município / Câmara" error={errors.chamberId?.message} hint="A Câmara Municipal é vinculada automaticamente ao município." required>
            <FilterSelect
              label={chamberId ? "Câmara de" : "Selecionar município"}
              value={chamberId || "all"}
              onChange={(v) => form.setValue("chamberId", v === "all" ? "" : v, { shouldValidate: form.formState.isSubmitted })}
              options={chamberOptions}
              searchable
              allLabel="Nenhum"
              className="h-9 w-full justify-start"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cargo">
              <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as CouncilorRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mandato">
              <Select value={form.watch("mandate")} onValueChange={(v) => form.setValue("mandate", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025–2028">2025–2028</SelectItem>
                  <SelectItem value="2021–2024">2021–2024</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FormSection>
      </div>
    </DrawerForm>
  )
}
