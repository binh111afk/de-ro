import { useEffect, useState } from 'react'
import { loadPricing, WELCOME_POINTS } from '@/lib/pricing'

/** Điểm chào mừng hiện hành (admin đặt ở AI & Server); trong lúc tải dùng mặc định. */
export function useWelcomePoints(): number {
  const [points, setPoints] = useState(WELCOME_POINTS)
  useEffect(() => {
    let alive = true
    void loadPricing().then(() => alive && setPoints(WELCOME_POINTS))
    return () => {
      alive = false
    }
  }, [])
  return points
}
