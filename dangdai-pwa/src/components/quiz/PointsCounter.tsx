import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils'

export interface PointsCounterProps {
  points: number
  size?: 'inline' | 'celebration'
}

const ANIMATION_DURATION_MS = 1500

export function PointsCounter({ points, size = 'celebration' }: PointsCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    let rafId: number
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1)
      setDisplayValue(Math.round(points * progress))
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        setIsDone(true)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [points])

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-transform duration-500',
        size === 'celebration' ? 'px-4 py-3' : 'px-2 py-1',
        isDone && 'scale-110',
      )}
      data-testid="points-counter"
    >
      <span
        className={cn(
          'font-bold text-orange-500',
          size === 'celebration' ? 'text-5xl' : 'text-2xl',
        )}
        data-testid="points-counter-value"
      >
        +{displayValue}
      </span>
      <span
        className={cn(
          'text-muted-foreground',
          size === 'celebration' ? 'text-xl' : 'text-base',
        )}
        data-testid="points-counter-label"
      >
        points
      </span>
    </div>
  )
}
