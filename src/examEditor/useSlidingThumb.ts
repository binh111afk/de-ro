/**
 * Đo vị trí + độ rộng của phần tử active trong container — dùng cho "thẻ trượt"
 * của segmented control.
 *
 * Đo bằng offsetLeft/offsetWidth nên không lệch khi chữ active đổi độ đậm, và
 * ResizeObserver bắt lại trường hợp font tải xong mới định hình lại chữ.
 */
import { useLayoutEffect, useState, type RefObject } from 'react'

export interface ThumbRect {
  x: number
  w: number
}

export function useSlidingThumb<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  /** selector của phần tử đang active, ví dụ '.filter-pill.active' */
  activeSelector: string,
  /** đổi giá trị này để đo lại (thường là state của segmented control) */
  activeKey: string,
): ThumbRect | null {
  const [rect, setRect] = useState<ThumbRect | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const active = el.querySelector<HTMLElement>(activeSelector)
      if (active) setRect({ x: active.offsetLeft, w: active.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, activeSelector, activeKey])

  return rect
}
