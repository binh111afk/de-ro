import { useLayoutEffect, useState, type RefObject } from 'react'
import { cn } from '@/lib/cn'

/**
 * Nền "thẻ" trượt dưới tab đang chọn của một tablist (tab có thể xuống dòng nên đo cả x, y, rộng, cao).
 * Đặt làm con đầu tiên của tablist có `relative`; các nút tab cần `relative` để nằm trên nền.
 */
export function TabThumb({ parent, active, className }: { parent: RefObject<HTMLElement | null>; active: string; className?: string }) {
  const [r, setR] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = parent.current
    if (!el) return
    const measure = () => {
      const b = el.querySelector<HTMLElement>('[aria-selected="true"]')
      if (b) setR({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [parent, active])
  if (!r) return null
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute left-0 top-0 transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none', className)}
      style={{ width: r.w, height: r.h, transform: `translate(${r.x}px, ${r.y}px)` }}
    />
  )
}
