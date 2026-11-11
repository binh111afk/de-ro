import { useEffect, useState } from 'react'

/** Thanh tiến độ, chạy từ 0 lên giá trị thật sau khi trang hiện ra. */
export function ProgressBar({ pct, label, className = 'mt-5' }: { pct: number; label: string; className?: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])
  return (
    <div className={`${className} h-2.5 overflow-hidden rounded-full bg-sunken`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className={`h-full rounded-full transition-[width] duration-[1200ms] ease-out ${pct >= 90 ? 'bg-clay-deep' : 'bg-clay'}`} style={{ width: `${width}%` }} />
    </div>
  )
}
