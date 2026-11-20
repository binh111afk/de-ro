import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/apiFetch'
import { cn } from '@/lib/cn'
import { lastAiQuota, TOKENS_PER_POINT, type AiQuota } from '@/lib/llm'
import { usePricingAccess } from '@/lib/usePricingAccess'

interface State {
  /** token còn lại */
  left: number
  /** mốc 100%: tổng token đã được cộng (tặng, nạp) cộng hạn mức tháng, không thấp hơn số còn lại */
  ref: number
  unlimited: boolean
}

const LOW_POINTS = 20
const R = 8.5
const C = 2 * Math.PI * R

const fromQuota = (q: AiQuota & { base?: number }, granted: number): State => {
  const left = Math.max(0, q.limit - q.used)
  return { left, ref: Math.max(left, (q.base ?? 0) + granted), unlimited: false }
}

/** Vòng điểm AI còn lại ở khung chat; bấm mở thanh nổi nhỏ. Ẩn khi chưa biết hạn mức (khách, máy dev). */
export function AiQuotaRing({ className }: { className?: string }) {
  const [state, setState] = useState<State | null>(() => (lastAiQuota ? fromQuota(lastAiQuota, 0) : null))
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const canPay = usePricingAccess() === true

  useEffect(() => {
    let alive = true
    const load = () =>
      apiFetch('/api/quota')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { quota: (AiQuota & { base?: number }) | null; granted?: number; unlimited?: boolean }) => {
          if (!alive) return
          if (d.unlimited) setState({ left: 0, ref: 1, unlimited: true })
          else if (d.quota) setState(fromQuota(d.quota, Number(d.granted) || 0))
        })
        .catch(() => {})
    void load()
    const onQuota = (e: Event) => {
      const q = (e as CustomEvent<AiQuota>).detail
      setState((s) => {
        const next = fromQuota(q, 0)
        return { ...next, ref: Math.max(next.left, s && !s.unlimited ? s.ref : 0) }
      })
    }
    window.addEventListener('ai-quota', onQuota)
    window.addEventListener('focus', load)
    return () => {
      alive = false
      window.removeEventListener('ai-quota', onQuota)
      window.removeEventListener('focus', load)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!state) return null
  const points = Math.floor(state.left / TOKENS_PER_POINT)
  const fraction = state.unlimited ? 1 : Math.min(1, state.left / Math.max(state.ref, 1))
  const low = !state.unlimited && points < LOW_POINTS
  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label="Điểm AI"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-tip={open ? undefined : 'Điểm AI'}
        onClick={() => setOpen((o) => !o)}
        className="flex size-6 items-center justify-center rounded-full hover:bg-sunken"
      >
        <svg viewBox="0 0 22 22" className="size-4 -rotate-90" aria-hidden="true">
          <circle cx="11" cy="11" r={R} fill="none" strokeWidth="2.5" className="stroke-line-2" />
          <circle
            cx="11"
            cy="11"
            r={R}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - fraction)}
            className={cn('transition-[stroke-dashoffset] duration-500', low ? 'stroke-clay-deep' : 'stroke-clay')}
          />
        </svg>
      </button>
      {open ? (
        <div role="dialog" aria-label="Điểm AI" className="anim-pop absolute right-0 bottom-[calc(100%+8px)] z-30 w-52 rounded-[10px] bg-surface p-3.5 shadow-float">
          <p className="text-[12px] text-ink-3">Điểm AI còn lại</p>
          {state.unlimited ? (
            <p className="mt-1 text-[20px] font-semibold leading-none text-ink">Không giới hạn</p>
          ) : (
            <p className={cn('tnum mt-1 text-[26px] font-semibold leading-none', low ? 'text-clay-deep' : 'text-ink')}>
              {points.toLocaleString('vi-VN')}
            </p>
          )}
          {canPay && !state.unlimited ? (
            <Link to="/bang-gia" className="mt-3 inline-block text-[13px] font-semibold text-clay hover:underline">
              Nạp điểm
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
