import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(target: number, duration = 450) {
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    if (reduce) return
    const startVal = from.current
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      const v = startVal + (target - startVal) * eased
      from.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduce])

  return reduce ? target : value
}