import { useEffect, useState } from 'react'

/**
 * Giữ component trong DOM đủ lâu để chạy hiệu ứng đóng trước khi gỡ.
 * Tự huỷ hẹn giờ nếu mở lại nhanh giữa chừng (không bị kẹt nửa chừng)
 * và đóng tức thì khi người dùng bật `prefers-reduced-motion: reduce`.
 */
export function useAnimatedPresence(open: boolean, exitMs = 180) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    if (!mounted) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay = reduced ? 0 : exitMs
    const id = window.setTimeout(() => setMounted(false), delay)
    return () => window.clearTimeout(id)
  }, [open, mounted, exitMs])

  return {
    mounted: open || mounted,
    closing: !open && mounted,
  }
}
