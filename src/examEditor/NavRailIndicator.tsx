/**
 * Thanh chỉ báo trượt (sliding indicator) cho thanh icon dọc (NavPanel & SlideSidePanel):
 * Vẽ nền cam nhạt (bg-clay-soft) căn giữa thanh, rộng 54px, bo góc rounded-xl (không có vạch ở mép).
 * Khi đổi tab, chỉ báo trượt mượt bằng transform: translateY(...) theo vị trí tab mới.
 * Khi đóng panel, chỉ báo mờ dần tại chỗ (opacity: 0) mà không trượt đi đâu.
 * Khi mở lại, chỉ báo xuất hiện ngay tại tab được chọn mà không trượt từ vị trí cũ.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface NavRailIndicatorProps {
  /** ref tới thẻ <nav> chứa các nút tab */
  containerRef: React.RefObject<HTMLElement | null>
  /** id của tab đang mở, hoặc null khi panel đóng */
  activeId: string | null
}

type IndicatorMode = 'instant' | 'slide' | 'fade' | 'jump-fade'

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function NavRailIndicator({ containerRef, activeId }: NavRailIndicatorProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [state, setState] = useState<{
    top: number
    height: number
    left: number
    width: number
    opacity: number
    mode: IndicatorMode
  }>({
    top: 0,
    height: 0,
    left: 5,
    width: 54,
    opacity: 0,
    mode: 'instant',
  })

  const prevActiveRef = useRef<string | null>(activeId)
  const isMountedRef = useRef(false)

  useLayoutEffect(() => {
    const nav = containerRef.current
    if (!nav) return

    // Khi panel đang đóng: chỉ báo mờ đi tại chỗ, không trượt đi đâu
    if (!activeId) {
      setState((prev) => ({
        ...prev,
        opacity: 0,
        mode: isMountedRef.current ? 'fade' : 'instant',
      }))
      prevActiveRef.current = null
    } else {
      const btn = nav.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`)
      if (btn) {
        const top = btn.offsetTop
        const height = btn.offsetHeight
        const left = btn.offsetLeft || 5
        const width = btn.offsetWidth || 54
        const wasClosed = prevActiveRef.current === null

        if (!isMountedRef.current) {
          // Lần vẽ đầu tiên: chỉ báo đứng sẵn ở tab đang chọn, không có hoạt cảnh
          isMountedRef.current = true
          prevActiveRef.current = activeId
          setState({
            top,
            height,
            left,
            width,
            opacity: 1,
            mode: 'instant',
          })
        } else if (wasClosed) {
          // Mở lại khi đang đóng: hiện ngay tại tab được chọn, không trượt từ vị trí cũ
          prevActiveRef.current = activeId
          setState({
            top,
            height,
            left,
            width,
            opacity: 1,
            mode: 'jump-fade',
          })
        } else {
          // Đổi từ tab này sang tab khác khi panel đang mở: trượt mượt
          prevActiveRef.current = activeId
          setState({
            top,
            height,
            left,
            width,
            opacity: 1,
            mode: 'slide',
          })
        }
      }
    }

    // ResizeObserver: cập nhật lại toạ độ khi layout/font thay đổi cỡ
    const onResize = () => {
      if (!activeId) return
      const btn = nav.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`)
      if (!btn) return
      const top = btn.offsetTop
      const height = btn.offsetHeight
      const left = btn.offsetLeft || 5
      const width = btn.offsetWidth || 54
      setState((prev) => {
        if (prev.top === top && prev.height === height && prev.left === left && prev.width === width) return prev
        return { ...prev, top, height, left, width, mode: 'instant' }
      })
    }

    const ro = new ResizeObserver(onResize)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [containerRef, activeId])

  let transition = 'none'
  if (!reducedMotion) {
    if (state.mode === 'slide') {
      transition = 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), height 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    } else if (state.mode === 'fade' || state.mode === 'jump-fade') {
      transition = 'opacity 200ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    }
  }

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute z-0 rounded-xl bg-clay-soft"
      style={{
        transform: `translateY(${state.top}px)`,
        left: state.left,
        width: state.width,
        height: state.height > 0 ? state.height : undefined,
        opacity: state.opacity,
        transition,
      }}
    />
  )
}
