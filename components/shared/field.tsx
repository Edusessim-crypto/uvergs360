import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/** Campo de formulário: rótulo, controle, dica e erro. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: React.ReactNode
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-danger-500">*</span>}
      </Label>
      {children}
      {error ? <p className="text-[12.5px] text-danger-700">{error}</p> : hint ? <p className="text-[12.5px] text-ink-3">{hint}</p> : null}
    </div>
  )
}

export function FormSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      <legend className="mb-4">
        <span className="block font-display text-[14.5px] font-semibold text-ink">{title}</span>
        {description && <span className="mt-0.5 block text-[13px] text-ink-3">{description}</span>}
      </legend>
      {children}
    </fieldset>
  )
}
