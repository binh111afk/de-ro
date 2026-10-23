/**
 * Neo popover theo trigger bằng `position: fixed` — thoát khỏi mọi overflow
 * clipping (ribbon body có `overflow-x: scroll` sẽ cắt popover `position: absolute`).
 * Cách GenOffice làm với dropdown: tọa độ lấy từ `getBoundingClientRect` của
 * trigger, cập nhật lại khi cuộn/resize.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface PopoverPos {
  top: number
  left: number
  width: number
  placement: 'below' | 'above'
}

export function useAnchoredPopover(open: boolean, minWidth = 220) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const [pos, setPos] = useState<PopoverPos | null>(null)

  const sync = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuWidth = Math.max(rect.width, minWidth)
    const menuHeight = 300
    const gap = 6
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8))
    const below = rect.bottom + gap
    const above = rect.top - menuHeight - gap
    const placement = below + menuHeight <= window.innerHeight || above < 8 ? 'below' : 'above'
    const top = placement === 'below' ? below : Math.max(8, rect.top - gap)
    setPos({ top, left, width: menuWidth, placement })
  }

  useLayoutEffect(() => {
    if (open) sync()
  }, [open, minWidth])

  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [open])

  return { triggerRef, pos }
}

/** Gán vào style của popover — luôn `position: fixed`. */
export function popoverStyle(pos: PopoverPos | null): React.CSSProperties | undefined {
  if (!pos) return undefined
  return {
    position: 'fixed',
    top: pos.placement === 'above' ? undefined : pos.top,
    bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
    left: pos.left,
    // `minWidth` chứ không phải `width`: menu co theo nội dung thật, tránh
    // ép lưới (bảng/ký hiệu) bị tràn ra ngoài khung.
    minWidth: pos.width,
  }
}
