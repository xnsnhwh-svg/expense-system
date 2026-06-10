import { useState, useEffect, useRef } from 'react'

export default function CountUpStat({ value, prefix = '', suffix = '', duration = 800, className = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started && value === 0) return
    if (!started) return
    const start = performance.now()
    const from = 0
    const to = typeof value === 'number' ? value : parseFloat(value) || 0

    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, value, duration])

  const formatted = typeof value === 'number' && !Number.isInteger(value)
    ? display.toFixed(2)
    : Math.round(display).toLocaleString()

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}