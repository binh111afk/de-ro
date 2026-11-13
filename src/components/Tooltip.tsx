/**
 * Hệ thống tooltip dùng chung (không dùng thư viện ngoài).
 * - Cách chính: gắn `data-tip="..."` (tuỳ chọn `data-tip-side="top|bottom|left|right"`, `data-tip-kbd="Ctrl+G"`).
 * - `<TooltipLayer />` gắn một lần ở App, lắng nghe sự kiện trên `document` và vẽ qua Portal vào `body`.
 * - `<Tooltip>` dùng khi cần nội dung JSX hoặc bọc nhanh.
 */
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Portal } from '@/components/Portal'

export type TipSide = 'top' | 'bottom' | 'left' | 'right'

const KBD_RE = /^(?:Ctrl|Cmd|Alt|Shift|Meta|Enter|Esc|Escape|Del|Delete|Backspace|Tab|Space|F\d{1,2})(?:[\s+]+(?:[A-Z0-9+\-−/]|Enter|Esc|Tab|Delete|Space|F\d{1,2})+)*$/i

/** Tách phần phím tắt dạng `"Nhãn — Ctrl+G"` hoặc `"Nhãn (Ctrl+Z)"` sang `{ tip, kbd }`. */
export function splitTipKbd(raw: string): { tip: string; kbd?: string } {
  const dash = raw.lastIndexOf(' — ')
  if (dash > 0) {
    const kbd = raw.slice(dash + 3).trim()
    if (kbd) return { tip: raw.slice(0, dash).trim(), kbd }
  }
  const m = raw.match(/^(.*?)\s*\(([^()]+)\)\s*$/)
  if (m && KBD_RE.test(m[2].trim())) {
    return { tip: m[1].trim(), kbd: m[2].trim() }
  }
  return { tip: raw }
}

const SEL = '[data-tip], [data-tip-id]'
const HOVER_DELAY = 400
const WARM_WINDOW = 300
const TOUCH_DELAY = 500
const GAP = 7
const PAD = 8
const ARROW_MARGIN = 10

/** Kho lưu nội dung JSX cho component `<Tooltip>` khi content không phải chuỗi. */
const jsxRegistry = new Map<string, ReactNode>()

interface ActiveTip {
  el: HTMLElement
  text: string
  jsxKey?: string
  side: TipSide
  kbd?: string
  zIndex: number
  viaTouch: boolean
  wasDisabled: boolean
}

interface TipPos {
  left: number
  top: number
  side: TipSide
  arrowPos: number
  dx: number
  dy: number
}

function readSide(el: Element): TipSide {
  const s = el.getAttribute('data-tip-side')
  return s === 'bottom' || s === 'left' || s === 'right' ? s : 'top'
}

function readTipData(el: HTMLElement): { text: string; jsxKey?: string; side: TipSide; kbd?: string } | null {
  const jsxKey = el.getAttribute('data-tip-id') ?? undefined
  const text = el.getAttribute('data-tip') ?? ''
  if (!jsxKey && !text.trim()) return null
  if (jsxKey && !jsxRegistry.has(jsxKey)) return null
  const kbd = el.getAttribute('data-tip-kbd') ?? undefined
  return { text, jsxKey, side: readSide(el), kbd: kbd?.trim() ? kbd : undefined }
}

function isElDisabled(el: HTMLElement): boolean {
  return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
}

/** Không hiện tooltip của phần tử phía sau khi có modal `aria-modal="true"` đang mở. */
function getTipZIndex(el: HTMLElement): number | null {
  const inDialog = Boolean(el.closest('[role="dialog"], [role="alertdialog"]'))
  if (!inDialog && document.querySelector('[aria-modal="true"]')) return null
  return inDialog ? 250 : 150
}

/** Tìm phần tử `[data-tip]:disabled` dưới con trỏ (nút disabled không tự phát pointerover). */
function findDisabledTipAt(container: Element, x: number, y: number): HTMLElement | null {
  const list = container.querySelectorAll<HTMLElement>('[data-tip]:disabled, [data-tip-id]:disabled')
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    const r = item.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return item
  }
  return null
}

function computePosition(target: DOMRect, tip: DOMRect, preferred: TipSide): TipPos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = tip.width
  const h = tip.height

  // Lật phía nếu không đủ chỗ
  let side = preferred
  if (side === 'top' && target.top - h - GAP < PAD && vh - target.bottom > target.top) side = 'bottom'
  else if (side === 'bottom' && target.bottom + h + GAP > vh - PAD && target.top > vh - target.bottom) side = 'top'
  else if (side === 'left' && target.left - w - GAP < PAD && vw - target.right > target.left) side = 'right'
  else if (side === 'right' && target.right + w + GAP > vw - PAD && target.left > vw - target.right) side = 'left'

  let left = 0
  let top = 0
  if (side === 'top' || side === 'bottom') {
    left = target.left + target.width / 2 - w / 2
    top = side === 'top' ? target.top - h - GAP : target.bottom + GAP
  } else {
    top = target.top + target.height / 2 - h / 2
    left = side === 'left' ? target.left - w - GAP : target.right + GAP
  }

  // Dịch để luôn cách mép màn hình >= 8px
  left = Math.max(PAD, Math.min(left, vw - w - PAD))
  top = Math.max(PAD, Math.min(top, vh - h - PAD))

  // Mũi tên luôn chỉ đúng tâm phần tử, giữ trong phạm vi hộp tooltip
  let arrowPos = 0
  if (side === 'top' || side === 'bottom') {
    const cx = target.left + target.width / 2 - left
    arrowPos = Math.max(ARROW_MARGIN, Math.min(cx, w - ARROW_MARGIN))
  } else {
    const cy = target.top + target.height / 2 - top
    arrowPos = Math.max(ARROW_MARGIN, Math.min(cy, h - ARROW_MARGIN))
  }

  // Hướng trượt 3px về phía phần tử
  const dx = side === 'left' ? 3 : side === 'right' ? -3 : 0
  const dy = side === 'top' ? 3 : side === 'bottom' ? -3 : 0

  return { left, top, side, arrowPos, dx, dy }
}

/** Gắn một lần ở gốc ứng dụng để hiển thị mọi tooltip `[data-tip]`. */
export function TooltipLayer() {
  const tipId = useId()
  const [active, setActive] = useState<ActiveTip | null>(null)
  const [pos, setPos] = useState<TipPos | null>(null)
  /** tooltip vừa ẩn: giữ lại ~120ms để mờ dần, không biến mất cái rụp */
  const [closing, setClosing] = useState<ActiveTip | null>(null)
  const closeTimer = useRef<number | null>(null)
  /** đang hiện mà chuyển sang nút khác: trượt vị trí sang chỗ mới thay vì nhảy */
  const glide = useRef(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const activeRef = useRef<ActiveTip | null>(null)
  activeRef.current = active

  const hoverTimer = useRef<number | null>(null)
  const touchTimer = useRef<number | null>(null)
  const pendingEl = useRef<HTMLElement | null>(null)
  const lastHideAt = useRef(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const prevDescribedBy = useRef<{ el: HTMLElement; value: string | null } | null>(null)

  const clearTimers = useCallback(() => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    if (touchTimer.current !== null) {
      window.clearTimeout(touchTimer.current)
      touchTimer.current = null
    }
    pendingEl.current = null
    touchStart.current = null
  }, [])

  const restoreDescribedBy = useCallback(() => {
    const prev = prevDescribedBy.current
    if (!prev) return
    prevDescribedBy.current = null
    if (!prev.el.isConnected) return
    if (prev.value === null) prev.el.removeAttribute('aria-describedby')
    else prev.el.setAttribute('aria-describedby', prev.value)
  }, [])

  const hide = useCallback(() => {
    clearTimers()
    const cur = activeRef.current
    if (cur) {
      lastHideAt.current = Date.now()
      restoreDescribedBy()
      setClosing(cur)
      setActive(null)
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null
        setClosing(null)
        setPos(null)
      }, 120)
    }
  }, [clearTimers, restoreDescribedBy])

  const showNow = useCallback(
    (el: HTMLElement, viaTouch: boolean) => {
      clearTimers()
      const data = readTipData(el)
      if (!data) return
      const zIndex = getTipZIndex(el)
      if (zIndex === null) return

      // Gắn aria-describedby trỏ tới tooltip hiện tại
      restoreDescribedBy()
      const orig = el.getAttribute('aria-describedby')
      prevDescribedBy.current = { el, value: orig }
      const tokens = orig ? orig.split(/\s+/).filter(Boolean) : []
      if (!tokens.includes(tipId)) tokens.push(tipId)
      el.setAttribute('aria-describedby', tokens.join(' '))

      // đang hiện (hoặc đang mờ đi) thì trượt sang chỗ mới; mở từ đầu thì đặt thẳng
      glide.current = Boolean(activeRef.current) || closeTimer.current !== null
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
      setClosing(null)
      setActive({
        el,
        text: data.text,
        jsxKey: data.jsxKey,
        side: data.side,
        kbd: data.kbd,
        zIndex,
        viaTouch,
        wasDisabled: isElDisabled(el),
      })
    },
    [clearTimers, restoreDescribedBy, tipId],
  )

  const scheduleHover = useCallback(
    (el: HTMLElement) => {
      if (activeRef.current?.el === el || pendingEl.current === el) return
      if (!readTipData(el) || getTipZIndex(el) === null) return
      clearTimers()
      pendingEl.current = el
      const warm = Boolean(activeRef.current) || Date.now() - lastHideAt.current < WARM_WINDOW
      if (warm) {
        showNow(el, false)
      } else {
        hoverTimer.current = window.setTimeout(() => {
          hoverTimer.current = null
          if (pendingEl.current === el && el.isConnected) showNow(el, false)
        }, HOVER_DELAY)
      }
    },
    [clearTimers, showNow],
  )

  // Lắng nghe sự kiện toàn cục trên document / window
  useEffect(() => {
    const onPointerOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>(SEL) : null
      if (!target) return
      scheduleHover(target)
    }

    const onPointerOut = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const current = activeRef.current?.el ?? pendingEl.current
      if (!current) return
      const rel = e.relatedTarget
      if (rel instanceof Node && current.contains(rel)) return
      const outEl = e.target instanceof Element ? e.target.closest<HTMLElement>(SEL) : null
      if (outEl === current || !rel) hide()
    }

    // Dò nút disabled có gắn data-tip (nút disabled không tự nhận pointerover)
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (touchStart.current && touchTimer.current !== null) {
          const dx = e.clientX - touchStart.current.x
          const dy = e.clientY - touchStart.current.y
          if (dx * dx + dy * dy > 64) clearTimers()
        }
        return
      }
      const t = e.target instanceof Element ? e.target : null
      if (!t || t.closest(SEL)) return
      const dis = findDisabledTipAt(t, e.clientX, e.clientY)
      if (dis) {
        scheduleHover(dis)
      } else if (activeRef.current?.wasDisabled || (pendingEl.current && isElDisabled(pendingEl.current))) {
        hide()
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (activeRef.current) hide()
        const t = e.target instanceof Element ? e.target : null
        if (!t) return
        const target = t.closest<HTMLElement>(SEL) ?? findDisabledTipAt(t, e.clientX, e.clientY)
        if (!target || !readTipData(target) || getTipZIndex(target) === null) return
        clearTimers()
        touchStart.current = { x: e.clientX, y: e.clientY }
        touchTimer.current = window.setTimeout(() => {
          touchTimer.current = null
          if (target.isConnected) showNow(target, true)
        }, TOUCH_DELAY)
      } else {
        hide()
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (touchTimer.current !== null) clearTimers()
        if (activeRef.current?.viaTouch) hide()
      }
    }

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>(SEL) : null
      if (!target) return
      let visible = false
      try {
        visible = target.matches(':focus-visible')
      } catch {
        visible = false
      }
      if (visible) showNow(target, false)
    }

    const onFocusOut = () => {
      if (activeRef.current || pendingEl.current) hide()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (activeRef.current || pendingEl.current)) hide()
    }

    const onInterrupt = () => {
      if (activeRef.current || pendingEl.current) hide()
    }

    document.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerout', onPointerOut)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onInterrupt, true)
    window.addEventListener('resize', onInterrupt)
    window.addEventListener('blur', onInterrupt)

    return () => {
      clearTimers()
      restoreDescribedBy()
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerout', onPointerOut)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onInterrupt, true)
      window.removeEventListener('resize', onInterrupt)
      window.removeEventListener('blur', onInterrupt)
    }
  }, [clearTimers, hide, restoreDescribedBy, scheduleHover, showNow])

  // Theo dõi khi phần tử bị gỡ khỏi DOM, bị disabled, hoặc đổi nội dung data-tip lúc đang hiện
  useEffect(() => {
    if (!active) return
    const { el, wasDisabled } = active

    const attrObs = new MutationObserver(() => {
      if (!el.isConnected) return hide()
      if (!wasDisabled && isElDisabled(el)) return hide()
      const next = readTipData(el)
      if (!next) return hide()
      setActive((prev) =>
        prev && prev.el === el
          ? { ...prev, text: next.text, jsxKey: next.jsxKey, side: next.side, kbd: next.kbd }
          : prev,
      )
    })
    attrObs.observe(el, {
      attributes: true,
      attributeFilter: ['data-tip', 'data-tip-id', 'data-tip-side', 'data-tip-kbd', 'disabled', 'aria-disabled'],
    })

    const domObs = new MutationObserver(() => {
      if (!el.isConnected) hide()
    })
    domObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      attrObs.disconnect()
      domObs.disconnect()
    }
  }, [active, hide])

  // Đo lại vị trí khi mở hoặc khi nội dung/kích thước tooltip thay đổi
  const updatePos = useCallback(() => {
    const cur = activeRef.current
    const box = boxRef.current
    if (!cur || !box || !cur.el.isConnected) return
    const next = computePosition(cur.el.getBoundingClientRect(), box.getBoundingClientRect(), cur.side)
    setPos(next)
  }, [])

  useLayoutEffect(() => {
    if (!active) return
    updatePos()
  }, [active, updatePos])

  useEffect(() => {
    const box = boxRef.current
    if (!active || !box || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => updatePos())
    ro.observe(box)
    return () => ro.disconnect()
  }, [active, updatePos])

  const tip = active ?? closing
  if (!tip) return null

  const jsxContent = tip.jsxKey ? jsxRegistry.get(tip.jsxKey) : null
  const currentSide = pos?.side ?? tip.side
  const out = !active

  return (
    <Portal>
      <div
        ref={boxRef}
        id={tipId}
        role="tooltip"
        style={{
          position: 'fixed',
          left: pos ? pos.left : -9999,
          top: pos ? pos.top : -9999,
          zIndex: tip.zIndex,
          visibility: pos ? 'visible' : 'hidden',
          ['--tip-dx' as string]: `${pos?.dx ?? 0}px`,
          ['--tip-dy' as string]: `${pos?.dy ?? 0}px`,
          // ẩn: mờ dần + lùi nhẹ về phía nút; chuyển nút khi đang hiện: trượt vị trí
          opacity: out ? 0 : undefined,
          transform: out ? `translate3d(${pos?.dx ?? 0}px, ${pos?.dy ?? 0}px, 0) scale(0.97)` : undefined,
          transition: [
            'opacity 120ms ease-out',
            'transform 120ms ease-out',
            glide.current ? 'left 140ms cubic-bezier(0.2, 0.8, 0.2, 1), top 140ms cubic-bezier(0.2, 0.8, 0.2, 1)' : '',
          ].filter(Boolean).join(', '),
        }}
        className="anim-tip pointer-events-none max-w-[260px] rounded-md bg-ink/95 px-2.5 py-1 text-[12px] font-medium leading-snug text-surface shadow-lift"
      >
        <div className="flex items-center gap-1.5">
          <span className="break-words">{jsxContent ?? tip.text}</span>
          {tip.kbd ? (
            <kbd className="shrink-0 rounded-[4px] bg-surface/15 px-1 py-0.5 font-mono text-[10.5px] font-medium leading-none text-surface/90">
              {tip.kbd}
            </kbd>
          ) : null}
        </div>
        {pos ? <TipArrow side={currentSide} arrowPos={pos.arrowPos} /> : null}
      </div>
    </Portal>
  )
}

function TipArrow({ side, arrowPos }: { side: TipSide; arrowPos: number }) {
  const base = 'pointer-events-none absolute h-2 w-2 rotate-45 bg-ink/95'
  if (side === 'top') {
    return <span aria-hidden className={base} style={{ left: arrowPos - 4, bottom: -4 }} />
  }
  if (side === 'bottom') {
    return <span aria-hidden className={base} style={{ left: arrowPos - 4, top: -4 }} />
  }
  if (side === 'left') {
    return <span aria-hidden className={base} style={{ top: arrowPos - 4, right: -4 }} />
  }
  return <span aria-hidden className={base} style={{ top: arrowPos - 4, left: -4 }} />
}

/** Component bọc tiện lợi cho trường hợp cần nội dung JSX phức tạp. */
export function Tooltip({
  content,
  side = 'top',
  kbd,
  children,
}: {
  content: ReactNode
  side?: TipSide
  kbd?: string
  children: ReactElement<Record<string, unknown>>
}) {
  const id = useId()
  const isText = typeof content === 'string' || typeof content === 'number'

  useEffect(() => {
    if (isText || !content) return
    jsxRegistry.set(id, content)
    return () => {
      jsxRegistry.delete(id)
    }
  }, [content, id, isText])

  if (content === null || content === undefined || content === false || content === '') {
    return children
  }

  const tipProps: Record<string, string | undefined> = {
    'data-tip-side': side === 'top' ? undefined : side,
    'data-tip-kbd': kbd,
  }
  if (isText) tipProps['data-tip'] = String(content)
  else tipProps['data-tip-id'] = id

  if (isValidElement(children)) {
    return cloneElement(children, tipProps)
  }

  return (
    <span className="inline-flex" {...tipProps}>
      {children}
    </span>
  )
}
