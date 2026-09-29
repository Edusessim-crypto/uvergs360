"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheck, CircleAlert, Info, Loader2, TriangleAlert } from "lucide-react"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      gap={10}
      offset={24}
      icons={{
        success: <CircleCheck className="size-[18px] text-success-500" />,
        error: <CircleAlert className="size-[18px] text-danger-500" />,
        info: <Info className="size-[18px] text-brand-500" />,
        warning: <TriangleAlert className="size-[18px] text-warning-500" />,
        loading: <Loader2 className="size-[18px] animate-spin text-brand-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-line-soft !bg-white !px-4 !py-3.5 !shadow-pop !font-sans !gap-3 !items-start",
          title: "!text-[13.5px] !font-semibold !text-ink",
          description: "!text-[13px] !text-ink-2 !mt-0.5",
          actionButton: "!bg-brand-600 !text-white !rounded-md !font-medium",
          cancelButton: "!bg-canvas !text-ink-2 !rounded-md",
          icon: "!mt-0.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
