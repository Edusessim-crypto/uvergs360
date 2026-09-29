/**
 * Gerador pseudoaleatório determinístico (mulberry32).
 * Usado apenas pelos dados de demonstração para que cada carregamento
 * produza exatamente os mesmos registros.
 */
export function createRandom(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min
    },
    float(min: number, max: number) {
      return next() * (max - min) + min
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)]
    },
    chance(probability: number) {
      return next() < probability
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    },
    sample<T>(items: readonly T[], count: number): T[] {
      return this.shuffle(items).slice(0, count)
    },
    weighted<T>(items: readonly { value: T; weight: number }[]): T {
      const total = items.reduce((acc, i) => acc + i.weight, 0)
      let r = next() * total
      for (const item of items) {
        r -= item.weight
        if (r <= 0) return item.value
      }
      return items[items.length - 1].value
    },
  }
}

export type Random = ReturnType<typeof createRandom>

export function hashString(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
