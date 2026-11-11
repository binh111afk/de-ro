/**
 * Popup thông báo ở trang chủ: mỗi thông báo là một trang (ảnh trên, chữ dưới).
 * Đóng rồi thì thôi trong lượt vào app này (sessionStorage), lần vào app sau lại hiện.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { Portal } from '@/components/Portal'
import type { Announcement } from '@/lib/adminApi'
import { cn } from '@/lib/cn'

const SEEN_KEY = 'announcements-seen'
const MAX_SHOWN = 5

function seenThisVisit() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/** `onPreviewClose` = admin đang xem thử: luôn hiện, không ghi nhớ, nút Dùng thử không chuyển trang. */
export function AnnouncementPopup({ items, onPreviewClose }: { items: Announcement[]; onPreviewClose?: () => void }) {
  const preview = !!onPreviewClose
  const navigate = useNavigate()
  const [closed, setClosed] = useState(() => !preview && seenThisVisit())
  const [page, setPage] = useState(0)
  const touchX = useRef<number | null>(null)

  const shown = useMemo(() => items.filter((a) => a.on && (!a.until || Date.parse(a.until) > Date.now())).slice(0, MAX_SHOWN), [items])
  const count = shown.length
  const open = !closed && count > 0

  const close = () => {
    if (preview) return onPreviewClose()
    setClosed(true)
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* bỏ qua */
    }
  }
  const go = (delta: number) => setPage((p) => Math.min(count - 1, Math.max(0, p + delta)))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null
  const a = shown[Math.min(page, count - 1)]
  const heading = a.title || 'Thông báo'

  return (
    <Portal>
      <div role="presentation" onClick={close} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={heading}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          }}
          className="relative flex max-h-[90dvh] w-full max-w-[480px] flex-col md:max-w-[720px] overflow-hidden rounded-[10px] border border-line bg-surface shadow-xl"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Đóng thông báo"
            className="absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-surface/90 text-ink-2 shadow-soft transition-colors hover:text-ink"
          >
            <X className="size-4" />
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {a.image ? <img key={a.id} src={a.image} alt="" className="max-h-[45dvh] w-full bg-sunken object-contain md:max-h-[60dvh]" /> : null}
            {a.title || a.text ? (
              <div className={cn('px-5 pb-1 pt-4 sm:px-6', !a.image && 'pr-12 pt-5')}>
                {a.title ? <h2 className="text-[18px] font-bold tracking-tight text-ink md:text-[22px]">{a.title}</h2> : null}
                {a.text ? <p className={cn('whitespace-pre-line text-[14px] leading-relaxed text-ink-2 md:text-[15.5px]', a.title && 'mt-1.5')}>{a.text}</p> : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
            {count > 1 ? (
              <div className="flex items-center">
                <button type="button" onClick={() => go(-1)} disabled={page === 0} aria-label="Thông báo trước" className="rounded p-1.5 text-ink-3 hover:text-ink disabled:opacity-30">
                  <ChevronLeft className="size-4" />
                </button>
                {shown.map((x, i) => (
                  <button key={x.id} type="button" onClick={() => setPage(i)} aria-label={`Thông báo ${i + 1} trên ${count}`} aria-current={i === page} className="p-1">
                    <span className={cn('block size-2 rounded-full transition-colors', i === page ? 'bg-clay' : 'bg-line-2')} />
                  </button>
                ))}
                <button type="button" onClick={() => go(1)} disabled={page === count - 1} aria-label="Thông báo sau" className="rounded p-1.5 text-ink-3 hover:text-ink disabled:opacity-30">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button variant="soft" size="sm" onClick={close}>
                Đóng
              </Button>
              {a.tryPath ? (
                <Button
                  variant="clay"
                  size="sm"
                  onClick={() => {
                    close()
                    if (!preview) navigate(a.tryPath)
                  }}
                >
                  Dùng thử
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
