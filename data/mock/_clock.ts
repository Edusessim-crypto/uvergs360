/**
 * Relógio dos dados de demonstração.
 *
 * Todas as datas mockadas são relativas ao dia atual, para que a demonstração
 * permaneça coerente em qualquer data de apresentação (ex.: "Hoje 09:42",
 * "Próximos eventos"). Em produção as datas virão do banco.
 */
export const DEMO_DATA = true as const

export function now() {
  return new Date()
}

/** Data ISO deslocada em dias a partir de hoje, no horário informado. */
export function dayAt(daysOffset: number, hours = 9, minutes = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

/**
 * Horário de hoje. Se o horário ainda não chegou (apresentação de manhã cedo),
 * usa "agora menos N minutos" para não exibir eventos no futuro.
 */
export function todayAt(hours: number, minutes: number, fallbackMinutesAgo: number) {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  if (d.getTime() > Date.now()) return minutesAgo(fallbackMinutesAgo)
  return d.toISOString()
}

export function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

export function daysAgo(days: number, hours = 10, minutes = 0) {
  return dayAt(-days, hours, minutes)
}

export function currentYear() {
  return new Date().getFullYear()
}
