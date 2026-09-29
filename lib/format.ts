const nf = new Intl.NumberFormat("pt-BR")
const cf = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const MONTHS_SHORT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
const MONTHS_LONG = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]
const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]

export function toDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value)
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return nf.format(value)
}

export function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`
  if (value >= 10_000) return `${(value / 1000).toFixed(1).replace(".", ",")} mil`
  return nf.format(value)
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits).replace(".", ",")}%`
}

export function formatDecimal(value: number, digits = 1) {
  return value.toFixed(digits).replace(".", ",")
}

export function formatCurrency(value: number) {
  return cf.format(value)
}

export function pad(n: number) {
  return n.toString().padStart(2, "0")
}

export function formatTime(value: string | Date) {
  const d = toDate(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDate(value: string | Date) {
  const d = toDate(value)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function formatDateTime(value: string | Date) {
  return `${formatDate(value)} ${formatTime(value)}`
}

export function formatDayMonth(value: string | Date) {
  const d = toDate(value)
  return { day: pad(d.getDate()), month: MONTHS_SHORT[d.getMonth()] }
}

export function formatShortDate(value: string | Date) {
  const d = toDate(value)
  return `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`
}

export function formatLongDate(value: string | Date) {
  const d = toDate(value)
  return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`
}

export function formatWeekdayLong(value: string | Date) {
  const d = toDate(value)
  const w = WEEKDAYS[d.getDay()]
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`
}

export function monthShort(index: number) {
  const m = MONTHS_SHORT[index]
  return m.charAt(0) + m.slice(1).toLowerCase()
}

export function formatDateRange(start: string | Date, end?: string | Date | null) {
  const s = toDate(start)
  if (!end) return `${s.getDate()} de ${MONTHS_LONG[s.getMonth()]}`
  const e = toDate(end)
  if (s.toDateString() === e.toDateString()) return `${s.getDate()} de ${MONTHS_LONG[s.getMonth()]}`
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} de ${MONTHS_LONG[s.getMonth()]}`
  return `${s.getDate()} de ${MONTHS_LONG[s.getMonth()]} – ${e.getDate()} de ${MONTHS_LONG[e.getMonth()]}`
}

function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000)
}

/** "Hoje", "Ontem", "há 5 dias", "12 SET" */
export function formatRelativeDay(value: string | Date, now = new Date()) {
  const d = toDate(value)
  const diff = daysBetween(d, now)
  if (diff === 0) return "Hoje"
  if (diff === 1) return "Ontem"
  if (diff > 1 && diff < 7) return `há ${diff} dias`
  if (diff >= 7 && diff < 30) return `há ${Math.floor(diff / 7)} sem.`
  if (diff < 0 && diff > -2) return "Amanhã"
  return formatShortDate(d)
}

/** "Hoje 09:42", "Ontem 17:14", "12 SET" */
export function formatTimelineStamp(value: string | Date, now = new Date()) {
  const d = toDate(value)
  const diff = daysBetween(d, now)
  if (diff === 0) return `Hoje ${formatTime(d)}`
  if (diff === 1) return `Ontem ${formatTime(d)}`
  return formatShortDate(d)
}

/** "há 4 min", "há 1 h", "ontem", "há 3 dias" */
export function formatTimeAgo(value: string | Date, now = new Date()) {
  const d = toDate(value)
  const mins = Math.round((now.getTime() - d.getTime()) / 60_000)
  if (mins < 1) return "agora"
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24 && daysBetween(d, now) === 0) return `há ${hours} h`
  const days = daysBetween(d, now)
  if (days === 1) return "ontem"
  if (days < 30) return `há ${days} dias`
  if (days < 365) return `há ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? "mês" : "meses"}`
  return formatDate(d)
}

export function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "").padEnd(11, "0").slice(0, 11)
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function maskCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "")
  return `${d.slice(0, 3)}.•••.•••-${d.slice(9, 11)}`
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`
}
