import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { X } from 'lucide-react'
import { Portal } from '@/components/Portal'
import { Button } from '@/components/ui'
import { apiFetch } from '@/lib/apiFetch'
import { getAccountCreatedAt, getSession, type Session } from '@/lib/auth'
import { aiPointsLeft, type AiQuota } from '@/lib/llm'
import { loadPricing, WELCOME_POINTS } from '@/lib/pricing'
import { isNewAccount, shouldShowWelcomeGift, welcomeGiftCount, WELCOME_GIFT_COUNT_MS } from '@/lib/welcomeGift'

function hasSeenGift(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return true
  }
}

function markGiftSeen(key: string): boolean {
  try {
    localStorage.setItem(key, '1')
    return true
  } catch {
    return false
  }
}

function withGiftLock(key: string, signal: AbortSignal, show: () => void) {
  if (navigator.locks) return navigator.locks.request(key, { signal }, show)

  // Giao dịch readwrite tuần tự hóa các tab nếu trình duyệt chưa có Web Locks.
  const request = indexedDB.open('de-ro:welcome-gift', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('lock')
  request.onsuccess = () => {
    const db = request.result
    try {
      if (signal.aborted) return
      const transaction = db.transaction('lock', 'readwrite')
      transaction.objectStore('lock').get(key).onsuccess = show
    } catch {
      // Khi không thể phối hợp với các tab khác, bỏ qua lần mở này.
    } finally {
      db.close()
    }
  }
}

export function useWelcomeGift(user: Session['user'] | undefined, ready: boolean) {
  const userId = user?.id
  const createdAt = user?.created_at
  const [gift, setGift] = useState<{ userId: string; points: number } | null>(null)
  if (gift && gift.userId !== userId) setGift(null)

  useEffect(() => {
    if (!ready || !userId) return
    const key = `de-ro:welcome-gift:${userId}`
    const controller = new AbortController()
    const { signal } = controller
    let timer: number

    const check = async () => {
      if (hasSeenGift(key)) return
      const date = createdAt ?? await getAccountCreatedAt(userId)
      if (signal.aborted || !isNewAccount(date, Date.now()) || getSession()?.user.id !== userId) return

      const response = await apiFetch('/api/quota', { signal })
      if (!response.ok) return
      const { quota, unlimited } = await response.json() as { quota: AiQuota | null; unlimited?: boolean }
      const points = quota ? aiPointsLeft(quota) : 0
      await loadPricing()
      const welcome = WELCOME_POINTS

      const show = () => {
        if (signal.aborted || getSession()?.user.id !== userId) return
        const seen = hasSeenGift(key)
        if (!shouldShowWelcomeGift({ userId, createdAt: date, now: Date.now(), points, welcome, unlimited: !!unlimited, seen })) return
        if (markGiftSeen(key)) flushSync(() => setGift({ userId, points: welcome }))
      }

      await withGiftLock(key, signal, show)
    }

    const schedule = () => {
      timer = window.setTimeout(() => void check().catch(() => {}), 800)
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })

    return () => {
      controller.abort()
      window.clearTimeout(timer)
      window.removeEventListener('load', schedule)
    }
  }, [userId, createdAt, ready])

  return { gift: gift?.userId === userId ? gift : null, closeGift: () => setGift(null) }
}

// Điểm xuất phát và độ lệch của các hạt, theo hệ tọa độ của hình hộp.
const particles = [
  [82, 88, -58, -38], [88, 81, -48, -62], [93, 77, -33, -54], [103, 73, -24, -67],
  [113, 81, -5, -56], [123, 75, 8, -69], [134, 76, 22, -57], [142, 81, 38, -64],
  [150, 88, 55, -41], [86, 97, -52, -5], [100, 89, -38, -26], [111, 90, -12, -37],
  [124, 89, 13, -41], [139, 91, 37, -31], [149, 97, 53, -12],
]

function GiftArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 232 162" className="mx-auto block h-[162px] w-full max-w-[232px]">
      <defs>
        <radialGradient id="welcome-gift-light">
          <stop stopColor="var(--color-honey)" stopOpacity=".36" />
          <stop offset="1" stopColor="var(--color-honey)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="welcome-gift-glow" cx="116" cy="84" rx="109" ry="74" fill="url(#welcome-gift-light)" />
      <ellipse cx="116" cy="143" rx="57" ry="7" fill="var(--color-clay)" opacity=".1" />
      <g className="welcome-gift-particles">
        {particles.map(([x, y, dx, dy], index) => (
          <g key={index} transform={`translate(${x} ${y})`}>
            <path
              className="welcome-gift-particle"
              d={index % 3 === 0 ? 'M0 -5 Q1 -1 5 0 Q1 1 0 5 Q-1 1 -5 0 Q-1 -1 0 -5Z' : 'M-2 -2H2V2H-2Z'}
              style={{ '--welcome-gift-x': `${dx}px`, '--welcome-gift-y': `${dy}px`, '--welcome-gift-delay': `${190 + (index % 5) * 24}ms` } as CSSProperties}
            />
          </g>
        ))}
      </g>
      <rect x="70" y="83" width="92" height="55" rx="8" fill="var(--color-clay)" />
      <rect x="70" y="83" width="92" height="13" rx="5" fill="var(--color-clay-deep)" />
      <path d="M105 94h22v44h-22z" fill="var(--color-clay-soft)" />
      <path d="M105 94h22v6h-22z" fill="var(--color-clay-line)" />
      <g className="welcome-gift-lid">
        <path d="M116 76c-17 0-28-3-28-10 0-11 17-10 28 10Zm0 0c17 0 28-3 28-10 0-11-17-10-28 10Z" fill="none" stroke="var(--color-clay)" strokeWidth="5" strokeLinejoin="round" />
        <rect x="65" y="75" width="102" height="19" rx="6" fill="var(--color-clay-2)" />
        <path d="M105 75h22v19h-22z" fill="var(--color-clay-soft)" />
      </g>
    </svg>
  )
}

export function WelcomeGiftPopup({ points, onClose }: { points: number; onClose: () => void }) {
  const titleId = useId()
  const pointsId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [displayPoints, setDisplayPoints] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? points : 0)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previous = document.activeElement
    dialog.showModal()
    buttonRef.current?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    let start: number | undefined
    const tick = (now: number) => {
      start ??= now
      const elapsed = now - start
      setDisplayPoints(motion.matches ? points : welcomeGiftCount(points, elapsed))
      if (!motion.matches && elapsed < WELCOME_GIFT_COUNT_MS) frame = requestAnimationFrame(tick)
    }
    let frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [points])

  return (
    <Portal>
      <dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={pointsId}
        onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
        onCancel={(event) => { event.preventDefault(); onClose() }}
        className="welcome-gift-dialog fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-transparent p-4 text-ink open:grid"
      >
        <div className="welcome-gift-card relative m-auto w-full max-w-[368px] rounded-[10px] border border-line bg-surface px-6 pb-7 pt-4 text-center shadow-xl sm:px-8">
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Đóng" className="absolute right-2 top-2 z-10 motion-reduce:transition-none motion-reduce:active:scale-100">
            <X size={18} aria-hidden="true" />
          </Button>
          <GiftArt />
          <h2 id={titleId} className="font-display text-[22px] font-semibold leading-tight tracking-tight">Quà chào mừng</h2>
          <p id={pointsId} className="sr-only">{points} điểm AI</p>
          <div aria-hidden="true" className="mt-2 text-ink-2">
            <span className="block break-words text-[clamp(2.5rem,12vw,3.5rem)] font-bold leading-none tracking-tight text-clay tabular-nums">{displayPoints}</span>
            <span className="mt-1 block text-sm font-medium">điểm AI</span>
          </div>
          <Button ref={buttonRef} type="button" variant="clay" size="lg" onClick={onClose} className="mt-6 w-full motion-reduce:transition-none motion-reduce:active:scale-100">Bắt đầu dùng</Button>
        </div>
      </dialog>
    </Portal>
  )
}
