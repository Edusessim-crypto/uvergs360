"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./states"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
    headerClassName?: string
    align?: "left" | "right" | "center"
  }
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, any>[] // eslint-disable-line @typescript-eslint/no-explicit-any
  data: T[]
  loading?: boolean
  getRowId?: (row: T) => string
  onRowClick?: (row: T) => void
  enableSelection?: boolean
  bulkActions?: (rows: T[], clear: () => void) => React.ReactNode
  pageSize?: number
  initialSorting?: SortingState
  empty?: React.ReactNode
  entity?: [singular: string, plural: string]
  toolbar?: React.ReactNode
  className?: string
  rowClassName?: (row: T) => string | undefined
  hidePagination?: boolean
}

const INTERACTIVE = "button, a, input, [role=checkbox], [role=menuitem], [data-no-row-click]"

export function DataTable<T>({
  columns,
  data,
  loading,
  getRowId,
  onRowClick,
  enableSelection,
  bulkActions,
  pageSize = 12,
  initialSorting = [],
  empty,
  entity = ["registro", "registros"],
  toolbar,
  className,
  rowClassName,
  hidePagination,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize })

  // Volta para a primeira página quando o conjunto filtrado muda de tamanho
  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [data.length])

  const allColumns = React.useMemo<ColumnDef<T, any>[]>(() => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!enableSelection) return columns
    return [
      {
        id: "__select",
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Selecionar página"
          />
        ),
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Selecionar linha" />,
        meta: { className: "w-10", headerClassName: "w-10" },
      },
      ...columns,
    ]
  }, [columns, enableSelection])

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: enableSelection,
    autoResetPageIndex: false,
  })

  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const clear = () => setRowSelection({})
  const total = data.length
  const { pageIndex, pageSize: size } = table.getState().pagination
  const from = total === 0 ? 0 : pageIndex * size + 1
  const to = Math.min(total, (pageIndex + 1) * size)
  const pageCount = table.getPageCount()

  return (
    <div className={cn("card overflow-hidden", className)}>
      {toolbar && <div className="border-b border-line-soft px-5 py-4">{toolbar}</div>}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className={cn(toolbar && "[&_th]:border-t-0")}>
              {hg.headers.map((header) => {
                const meta = header.column.columnDef.meta
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                const content = header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())
                return (
                  <TableHead key={header.id} className={cn(!toolbar && "border-t-0", meta?.align === "right" && "text-right", meta?.headerClassName)}>
                    {canSort && typeof header.column.columnDef.header === "string" ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn("-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase transition-colors hover:text-ink", sorted && "text-ink", meta?.align === "right" && "flex-row-reverse")}
                      >
                        {content}
                        {sorted === "asc" ? <ArrowUp className="size-3" /> : sorted === "desc" ? <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
                      </button>
                    ) : (
                      content
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: Math.min(size, 8) }).map((_, i) => (
              <TableRow key={i}>
                {allColumns.map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className={cn("h-3.5", c === (enableSelection ? 1 : 0) ? "w-40" : "w-20")} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={allColumns.length} className="h-auto border-b-0 p-0">
                {empty ?? <EmptyState title="Nenhum resultado" description="Ajuste os filtros ou a busca para encontrar o que procura." />}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                onClick={(e) => {
                  if (!onRowClick) return
                  if ((e.target as HTMLElement).closest(INTERACTIVE)) return
                  onRowClick(row.original)
                }}
                className={cn(onRowClick && "cursor-pointer hover:bg-canvas/80", rowClassName?.(row.original))}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta
                  return (
                    <TableCell key={cell.id} className={cn(meta?.align === "right" && "text-right tnum", meta?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!hidePagination && (
        <div className="flex flex-col gap-3 border-t border-line-soft px-5 py-3.5 text-[13px] text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="tnum">
            {loading ? (
              <Skeleton className="h-3.5 w-44" />
            ) : (
              <>
                Mostrando <span className="font-medium text-ink">{formatNumber(from)}–{formatNumber(to)}</span> de{" "}
                <span className="font-medium text-ink">{formatNumber(total)}</span> {total === 1 ? entity[0] : entity[1]}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-ink-3">Linhas</span>
              <Select value={String(size)} onValueChange={(v) => table.setPageSize(Number(v))}>
                <SelectTrigger size="sm" className="w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 12, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Pager pageIndex={pageIndex} pageCount={pageCount} onPage={(p) => table.setPageIndex(p)} />
          </div>
        </div>
      )}

      {bulkActions && selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 animate-fade-up items-center gap-2 rounded-xl bg-navy-900 py-2 pr-2 pl-4 text-white shadow-pop lg:left-[calc(50%+128px)]">
          <span className="mr-2 text-[13px] whitespace-nowrap">
            <span className="font-semibold tnum">{formatNumber(selected.length)}</span> {selected.length === 1 ? "selecionado" : "selecionados"}
          </span>
          <span className="h-5 w-px bg-white/15" />
          <div className="flex items-center gap-1">{bulkActions(selected, clear)}</div>
          <button onClick={clear} className="ml-1 flex size-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white" aria-label="Limpar seleção">
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function Pager({ pageIndex, pageCount, onPage }: { pageIndex: number; pageCount: number; onPage: (p: number) => void }) {
  if (pageCount <= 1) return null
  const pages: (number | "…")[] = []
  const add = (p: number) => pages.push(p)
  const windowSize = 1
  for (let p = 0; p < pageCount; p++) {
    if (p === 0 || p === pageCount - 1 || Math.abs(p - pageIndex) <= windowSize) add(p)
    else if (pages[pages.length - 1] !== "…") pages.push("…")
  }
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-xs" onClick={() => onPage(pageIndex - 1)} disabled={pageIndex === 0} aria-label="Página anterior">
        <ChevronLeft />
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-ink-3">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cn(
              "flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[12.5px] font-medium transition-colors tnum",
              p === pageIndex ? "bg-navy-900 text-white" : "text-ink-2 hover:bg-canvas-2 hover:text-ink",
            )}
            aria-current={p === pageIndex ? "page" : undefined}
          >
            {p + 1}
          </button>
        ),
      )}
      <Button variant="ghost" size="icon-xs" onClick={() => onPage(pageIndex + 1)} disabled={pageIndex >= pageCount - 1} aria-label="Próxima página">
        <ChevronRight />
      </Button>
    </div>
  )
}

/** Ação do menu flutuante de seleção em lote. */
export function BulkAction({ children, onClick, icon: Icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <button onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap text-white/85 transition-colors hover:bg-white/10 hover:text-white">
      {Icon && <Icon className="size-4" />}
      {children}
    </button>
  )
}
