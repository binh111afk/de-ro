import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Eraser, MousePointer2, Pause, PenLine, Play, RotateCcw, ScrollText, Sparkle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'

/* Công cụ khi trình chiếu: bút vẽ, bút laser, tẩy nét, đồng hồ, màn người trình bày (cửa sổ riêng). */

export type PresentTool = 'none' | 'pen' | 'laser' | 'eraser'
/** toạ độ chuẩn hoá 0–1 theo khung slide → đổi cỡ màn hình nét vẫn đúng chỗ */
export type InkStroke = { color: string; points: [number, number][] }

export const INK_COLORS = ['#e11d48', '#f59e0b', '#16a34a', '#2563eb', '#111827', '#ffffff']

/** Trạng thái công cụ chiếu: nét vẽ nhớ theo từng slide trong lượt chiếu (thoát là mất, giống PowerPoint khi "Bỏ"). */
export function usePresentTools(presenting: boolean) {
  const [tool, setTool] = useState<PresentTool>('none')
  const [color, setColor] = useState(INK_COLORS[0])
  const [ink, setInk] = useState<Record<string, InkStroke[]>>({})
  const [startedAt, setStartedAt] = useState(0)
  const [pausedMs, setPausedMs] = useState<number | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    if (!presenting) return
    setTool('none')
    setInk({})
    setStartedAt(Date.now())
    setPausedMs(null)
    const t = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(t)
  }, [presenting])

  const elapsed = pausedMs ?? (startedAt ? Date.now() - startedAt : 0)
  const timer = {
    elapsed,
    paused: pausedMs !== null,
    toggle: () => {
      if (pausedMs === null) setPausedMs(Date.now() - startedAt)
      else {
        setStartedAt(Date.now() - pausedMs)
        setPausedMs(null)
      }
    },
    reset: () => {
      setStartedAt(Date.now())
      setPausedMs((p) => (p === null ? null : 0))
    },
  }
  return {
    tool,
    setTool,
    color,
    setColor,
    ink,
    addStroke: (slideId: string, s: InkStroke) => setInk((m) => ({ ...m, [slideId]: [...(m[slideId] ?? []), s] })),
    removeStroke: (slideId: string, i: number) => setInk((m) => ({ ...m, [slideId]: (m[slideId] ?? []).filter((_, k) => k !== i) })),
    clearSlide: (slideId: string) => setInk((m) => ({ ...m, [slideId]: [] })),
    timer,
  }
}

export function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

const pathOf = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 1600).toFixed(1)} ${(y * 900).toFixed(1)}`).join(' ')

/** Lớp phủ đúng bằng khung slide 16:9: vẽ nét, tẩy, chấm laser. tool = none thì không bắt chuột. */
export function InkLayer({
  tool,
  color,
  strokes,
  onAdd,
  onRemove,
}: {
  tool: PresentTool
  color: string
  strokes: InkStroke[]
  onAdd: (s: InkStroke) => void
  onRemove: (i: number) => void
}) {
  const ref = useRef<SVGSVGElement>(null)
  const [draft, setDraft] = useState<InkStroke | null>(null)
  const [laser, setLaser] = useState<[number, number] | null>(null)
  const active = tool !== 'none'

  const at = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect()
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 1600 900"
      className="absolute inset-0 z-[5] h-full w-full"
      style={{
        pointerEvents: active ? 'auto' : 'none',
        cursor: tool === 'pen' ? 'crosshair' : tool === 'laser' ? 'none' : tool === 'eraser' ? 'cell' : undefined,
        touchAction: active ? 'none' : undefined,
      }}
      onClick={(e) => active && e.stopPropagation()}
      onPointerDown={(e) => {
        if (!active) return
        e.stopPropagation()
        if (tool === 'pen') {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDraft({ color, points: [at(e)] })
        }
      }}
      onPointerMove={(e) => {
        if (tool === 'laser') setLaser(at(e))
        else if (tool === 'pen' && draft) setDraft({ ...draft, points: [...draft.points, at(e)] })
      }}
      onPointerUp={(e) => {
        if (!active) return
        e.stopPropagation()
        if (draft && draft.points.length) onAdd(draft.points.length === 1 ? { ...draft, points: [draft.points[0], draft.points[0]] } : draft)
        setDraft(null)
      }}
      onPointerLeave={() => setLaser(null)}
    >
      {[...strokes, ...(draft ? [draft] : [])].map((s, i) => (
        <path
          key={i}
          d={pathOf(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ cursor: tool === 'eraser' ? 'pointer' : undefined, pointerEvents: tool === 'eraser' ? 'stroke' : 'none' }}
          onPointerDown={(e) => {
            if (tool !== 'eraser' || i >= strokes.length) return
            e.stopPropagation()
            onRemove(i)
          }}
          onPointerEnter={(e) => {
            // giữ chuột trái mà quét qua cũng tẩy
            if (tool === 'eraser' && e.buttons === 1 && i < strokes.length) onRemove(i)
          }}
        />
      ))}
      {tool === 'laser' && laser && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={laser[0] * 1600} cy={laser[1] * 900} r={22} fill="rgba(239,68,68,0.25)" />
          <circle cx={laser[0] * 1600} cy={laser[1] * 900} r={9} fill="#ef4444" />
        </g>
      )}
    </svg>
  )
}

const toolBtn = 'rounded-md p-1.5 transition-colors hover:bg-white/10'

/** Nhóm nút giữa thanh điều khiển trình chiếu. */
export function PresentToolbar({
  tools,
  slideId,
  onOpenPresenter,
  presenterOpen,
}: {
  tools: ReturnType<typeof usePresentTools>
  slideId: string
  onOpenPresenter: () => void
  presenterOpen: boolean
}) {
  const { tool, setTool, color, setColor, timer } = tools
  const pick = (t: PresentTool) => setTool(tool === t ? 'none' : t)
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Con trỏ" data-tip="Con trỏ" aria-pressed={tool === 'none'} onClick={() => setTool('none')} className={cn(toolBtn, tool === 'none' && 'bg-white/15')}>
        <MousePointer2 className="size-5" />
      </button>
      <button type="button" aria-label="Bút vẽ" data-tip="Bút vẽ" data-tip-kbd="P" aria-pressed={tool === 'pen'} onClick={() => pick('pen')} className={cn(toolBtn, tool === 'pen' && 'bg-white/15')}>
        <PenLine className="size-5" />
      </button>
      {tool === 'pen' && (
        <div className="flex items-center gap-1 px-1">
          {INK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Màu ${c}`}
              onClick={() => setColor(c)}
              className={cn('size-5 rounded-full border border-white/40', color === c && 'ring-2 ring-white ring-offset-1 ring-offset-transparent')}
              style={{ background: c }}
            />
          ))}
        </div>
      )}
      <button type="button" aria-label="Bút laser" data-tip="Bút laser" data-tip-kbd="L" aria-pressed={tool === 'laser'} onClick={() => pick('laser')} className={cn(toolBtn, tool === 'laser' && 'bg-white/15')}>
        <Sparkle className="size-5" />
      </button>
      <button type="button" aria-label="Tẩy nét" data-tip="Tẩy nét" data-tip-kbd="E" aria-pressed={tool === 'eraser'} onClick={() => pick('eraser')} className={cn(toolBtn, tool === 'eraser' && 'bg-white/15')}>
        <Eraser className="size-5" />
      </button>
      <button type="button" aria-label="Xoá hết nét trên slide" data-tip="Xoá hết nét trên slide" onClick={() => tools.clearSlide(slideId)} className={toolBtn}>
        <Trash2 className="size-5" />
      </button>
      <span className="mx-2 h-6 w-px bg-white/20" />
      <span className="tnum min-w-[3.5rem] text-center text-[15px] font-semibold text-white">{formatElapsed(timer.elapsed)}</span>
      <button type="button" aria-label={timer.paused ? 'Chạy đồng hồ' : 'Dừng đồng hồ'} data-tip={timer.paused ? 'Chạy đồng hồ' : 'Dừng đồng hồ'} onClick={timer.toggle} className={toolBtn}>
        {timer.paused ? <Play className="size-5" /> : <Pause className="size-5" />}
      </button>
      <button type="button" aria-label="Đặt lại đồng hồ" data-tip="Đặt lại đồng hồ" onClick={timer.reset} className={toolBtn}>
        <RotateCcw className="size-5" />
      </button>
      <span className="mx-2 h-6 w-px bg-white/20" />
      <button type="button" aria-label="Màn người trình bày" data-tip="Màn người trình bày (cửa sổ riêng, có ghi chú)" aria-pressed={presenterOpen} onClick={onOpenPresenter} className={cn(toolBtn, presenterOpen && 'bg-white/15')}>
        <ScrollText className="size-5" />
      </button>
    </div>
  )
}

/**
 * Màn người trình bày: cửa sổ trình duyệt riêng (kéo sang màn hình laptop khi chiếu lên máy chiếu).
 * Vẽ bằng portal nên dùng style nội tuyến — cửa sổ mới không có CSS của trang.
 */
export function PresenterWindow({
  open,
  onClose,
  index,
  total,
  title,
  nextTitle,
  notes,
  elapsed,
  onPrev,
  onNext,
}: {
  open: boolean
  onClose: () => void
  index: number
  total: number
  title: string
  nextTitle: string | null
  notes: string
  elapsed: number
  onPrev: () => void
  onNext: () => void
}) {
  const [win, setWin] = useState<Window | null>(null)
  /** trình duyệt chặn cửa sổ bật lên → hiện ghi chú nổi ngay trên màn chiếu */
  const [inline, setInline] = useState(false)
  const nav = useRef({ onPrev, onNext })
  nav.current = { onPrev, onNext }

  useEffect(() => {
    if (!open) return
    const w = window.open('', 'slide-presenter', 'width=560,height=680')
    if (!w) {
      setInline(true)
      return () => setInline(false)
    }
    w.document.title = 'Màn người trình bày'
    w.document.body.style.margin = '0'
    w.document.body.style.height = '100vh'
    w.document.body.style.background = '#1f2430'
    w.document.body.innerHTML = ''
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) nav.current.onNext()
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) nav.current.onPrev()
    }
    w.addEventListener('keydown', onKey)
    const closed = window.setInterval(() => w.closed && onClose(), 500)
    setWin(w)
    return () => {
      window.clearInterval(closed)
      w.removeEventListener('keydown', onKey)
      if (!w.closed) w.close()
      setWin(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open || (!win && !inline)) return null
  const btn: React.CSSProperties = { flex: 1, padding: '12px 0', fontSize: 16, fontWeight: 600, borderRadius: 8, border: 'none', background: '#3b4252', color: '#fff', cursor: 'pointer' }
  const body = (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 15, opacity: 0.7 }}>Slide {index + 1} / {total}</span>
        <span style={{ fontSize: 32, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{formatElapsed(elapsed)}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{title || '(không có tiêu đề)'}</div>
      <div style={{ flex: 1, overflow: 'auto', background: '#2a3040', borderRadius: 10, padding: 16, fontSize: 18, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {notes.trim() || <span style={{ opacity: 0.5 }}>Slide này chưa có ghi chú.</span>}
      </div>
      <div style={{ fontSize: 14, opacity: 0.7 }}>Tiếp theo: {nextTitle ?? 'hết bài'}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" style={btn} onClick={onPrev}>← Trước</button>
        <button type="button" style={{ ...btn, background: '#b45309' }} onClick={onNext}>Sau →</button>
      </div>
    </div>
  )
  if (!win)
    return (
      <div
        className="absolute left-4 top-4 z-30 h-[60vh] w-[380px] overflow-hidden rounded-xl shadow-2xl"
        style={{ background: '#1f2430' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div style={{ height: '60vh' }}>{body}</div>
      </div>
    )
  return createPortal(body, win.document.body)
}
