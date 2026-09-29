"use client"

import * as React from "react"
import { formatNumber } from "@/lib/format"

/** Contagem suave até o valor (microinteração de entrada, ~600ms). */
export function AnimatedNumber({ value, format = formatNumber, duration = 650 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [display, setDisplay] = React.useState(0)
  const fromRef = React.useRef(0)

  React.useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setDisplay(value)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (value - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{format(Math.round(display))}</>
}
