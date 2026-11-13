import { useEffect, useState } from 'react'

export interface SlideViewport {
  /** < 640px */
  isPhone: boolean
  /** 640px – 1023px */
  isTablet: boolean
  /** < 1024px */
  isCompact: boolean
  /** <= 500px chiều cao (điện thoại xoay ngang) */
  isShort: boolean
}

function readViewport(): SlideViewport {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return { isPhone: false, isTablet: false, isCompact: false, isShort: false }
  }
  const isPhone = window.matchMedia('(max-width: 639px)').matches
  const isCompact = window.matchMedia('(max-width: 1023px)').matches
  const isShort = window.matchMedia('(max-height: 500px)').matches
  return {
    isPhone,
    isTablet: !isPhone && isCompact,
    isCompact,
    isShort,
  }
}

/** Theo dõi breakpoint qua matchMedia, không đọc innerWidth mỗi lần render. */
export function useSlideViewport(): SlideViewport {
  const [vp, setVp] = useState<SlideViewport>(readViewport)

  useEffect(() => {
    const queries = [
      window.matchMedia('(max-width: 639px)'),
      window.matchMedia('(max-width: 1023px)'),
      window.matchMedia('(max-height: 500px)'),
    ]
    const update = () => setVp(readViewport())
    update()
    for (const q of queries) q.addEventListener('change', update)
    return () => {
      for (const q of queries) q.removeEventListener('change', update)
    }
  }, [])

  return vp
}
