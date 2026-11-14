import { useEffect, useRef, useState, type CSSProperties } from 'react'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Quan sát phần tử vào khung nhìn một lần (không gọi getBoundingClientRect đồng bộ lúc mount
 * để tránh forced reflow; IntersectionObserver tự báo ngay trạng thái ban đầu).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (shown) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const r = e.boundingClientRect
          // Tránh coi các khối bên trong `content-visibility: auto` (height=0 khi chưa layout) là đang nằm trên cùng màn hình
          if (e.isIntersecting || (window.scrollY > 0 && r.height > 0 && r.top < window.innerHeight * 0.88)) {
            setShown(true)
            io.disconnect()
            break
          }
        }
      },
      // chỉ bật khi khối đã lên tới ~12% trên mép dưới màn hình — bật sớm hơn thì hiệu ứng chạy xong lúc còn khuất
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      if (rect.height > 0 && rect.top < window.innerHeight * 0.88) {
        setShown(true)
        io.disconnect()
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [shown])

  const revealProps = {
    ref,
    'data-reveal': shown ? 'true' : 'false',
    style: delayMs ? ({ '--reveal-delay': `${delayMs}ms` } as CSSProperties) : undefined,
  }
  return { ref, shown, revealProps }
}

/** Đếm số trực tiếp lên text node (không gọi setState React theo khung hình để giữ 0 re-render). */
export function useCountUpRef(target: number, active: boolean, durationMs = 600) {
  const ref = useRef<HTMLElement>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !active || doneRef.current) return
    doneRef.current = true
    if (prefersReducedMotion()) {
      el.textContent = target.toLocaleString('vi-VN')
      return
    }
    const startVal = Math.max(0, Math.round(target * 0.86))
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      el.textContent = Math.round(startVal + (target - startVal) * eased).toLocaleString('vi-VN')
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, durationMs, target])

  return ref
}
