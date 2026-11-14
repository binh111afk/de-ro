import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Nền "thẻ" trượt dưới tab đang chọn của một tablist (tab có thể xuống dòng nên đo cả x, y, rộng, cao).
 * Đặt làm con đầu tiên của tablist có `relative`; các nút tab cần `relative` để nằm trên nền.
 * Tự lấy tablist là phần tử cha của chính nó: ref của cha chưa được gắn khi effect của con chạy lần đầu.
 */
export function TabThumb({ active, className }: { active: string; className?: string }) {
  const self = useRef<HTMLSpanElement>(null)
  const [r, setR] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = self.current?.parentElement
    if (!el) return
    const measure = () => {
      const b = el.querySelector<HTMLElement>('[aria-selected="true"]')
      if (b) setR({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight })
    }
    measure()
    // font tải xong thì chữ đổi bề rộng mà khung tablist có thể không đổi cỡ → đo lại
    void document.fonts?.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    el.querySelectorAll('[role="tab"]').forEach((b) => ro.observe(b))
    return () => ro.disconnect()
  }, [active])
  return (
    <span
      ref={self}
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-0 top-0',
        // lần đầu chỉ hiện ở chỗ, không trượt từ góc vào
        r && 'transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        !r && 'invisible',
        className,
      )}
      style={r ? { width: r.w, height: r.h, transform: `translate(${r.x}px, ${r.y}px)` } : undefined}
    />
  )
}
