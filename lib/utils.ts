import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter((p) => !["de", "da", "do", "dos", "das", "e"].includes(p.toLowerCase()))
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function slugify(text: string) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((acc, item) => acc + pick(item), 0)
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K) {
  return items.reduce(
    (acc, item) => {
      const k = key(item)
      ;(acc[k] ||= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}
