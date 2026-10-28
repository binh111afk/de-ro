/**
 * Layout trình soạn đề — port từ GenOffice (apps/docs):
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ ribbon-tabs: Trang chủ | Chèn | Bố cục | …               │  ribbon
 *   ├──────────────────────────────────────────────────────────┤
 *   │ tab strip kiểu Chrome — nhiều đề đang mở               │
 *   ├──────────┬───────────────────────────────┬───────────────┤
 *   │  AI      │  ruler                        │  Mục lục      │
 *   │  dock    ├───────────────────────────────┤  Khối mẫu     │
 *   │  ( trái) │  sân giấy A4 xám              │  Tìm kiếm     │
 *   └──────────┴───────────────────────────────┴───────────────┘
 *
 * Số đo bám đúng bản gốc: AI dock 360px (rail thu gọn 34px), nav pane 288px,
 * ribbon cao 80px, ruler cao 20px, status bar cao 24px.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { IconChevronLeft, IconChevronRight, IconSidebarLeft, IconSidebarRight } from './icons'
import { useSlidingThumb } from './useSlidingThumb'

/* ------------------------------------------------------------------ *
 * Thanh ribbon tab
 * ------------------------------------------------------------------ */

export interface RibbonTabDef {
  id: string
  label: string
}

export function RibbonTabs({
  tabs,
  active,
  onChange,
  leading,
  children,
}: {
  tabs: RibbonTabDef[]
  active: string
  onChange: (id: string) => void
  /** nội dung đứng trước hàng tab (Quick Access: Lưu/Hoàn tác/Làm lại) */
  leading?: ReactNode
  children?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  // gạch chân trượt từ tab cũ sang tab mới (đo như thẻ trượt của segmented control)
  const thumb = useSlidingThumb(ref, '.ribbon-tab.active', active)
  return (
    <div className="ribbon-tabs" role="tablist" ref={ref}>
      {leading}
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          className={cn('ribbon-tab', active === t.id && 'active')}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
      {thumb ? (
        <span
          aria-hidden
          className="ribbon-tab__indicator"
          style={{ transform: `translateX(${thumb.x + 13}px)`, width: thumb.w - 26 }}
        />
      ) : null}
      {children}
    </div>
  )
}

export function RibbonBody({ children, activeKey }: { children: ReactNode; activeKey?: string }) {
  return (
    <div className="ribbon-body">
      {activeKey ? (
        <div key={activeKey} className="ribbon-tab-page">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

/** Một nhóm nút trong ribbon. Bản gốc không hiện nhãn nhóm dưới ribbon. */
export function RibbonGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="ribbon-group" aria-label={label}>
      <div className="ribbon-group-items">{children}</div>
      <div className="ribbon-group-label">{label}</div>
    </div>
  )
}

/** Nút lớn: icon SVG trên, nhãn bên dưới — đúng kiểu Word. */
export function RibbonButton({
  icon,
  label,
  title,
  onClick,
  disabled,
  active,
}: {
  icon?: ReactNode
  label?: string
  title?: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn('rb-big', active && 'active')}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={title ?? label}
    >
      <span className="rb-big-icon">{icon}</span>
      {label ? <span className="rb-big-label">{label}</span> : null}
    </button>
  )
}

/** Nút icon nhỏ 28×30 (căn chỉnh, in, v.v.). */
export function RibbonIconButton({
  icon,
  label,
  title,
  onClick,
  disabled,
  active,
}: {
  icon: ReactNode
  label?: string
  title?: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn('rb-icon', active && 'active')}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={title ?? label}
    >
      {icon}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Thước kẻ (ruler) — vạch cm, số ở mốc lớn
 * ------------------------------------------------------------------ */

export function Ruler({
  width,
  margin,
  indentLeft = 0,
  indentFirstLine = 0,
  onIndentChange,
  onMarginChange,
}: {
  width: number
  margin: number
  /** thụt lề trái của đoạn hiện tại (px) */
  indentLeft?: number
  /** thụt dòng đầu (px, âm = thụt treo) */
  indentFirstLine?: number
  onIndentChange?: (patch: { indentLeft?: number; indentFirstLine?: number }) => void
  /** kéo vùng lề — trả về lề mới (px) */
  onMarginChange?: (marginPx: number) => void
}) {
  // 1cm = 96/2.54 px; vạch mỗi 5mm, số ở mốc cm
  const ticks = useMemo(() => {
    const out: Array<{ x: number; mid: boolean; label?: string }> = []
    for (let mm = 0; mm <= 210; mm += 5) {
      const x = (mm / 10) * (96 / 2.54)
      if (mm === 0) continue
      out.push({
        x,
        mid: mm % 10 !== 0,
        label: mm % 10 === 0 ? String(mm / 10) : undefined,
      })
    }
    return out
  }, [])

  /** kéo chung 1 marker: trả về giá trị px mới (làm tròn 5px) */
  const startDrag = useCallback(
    (e: React.MouseEvent, onMove: (dx: number) => void) => {
      e.preventDefault()
      const startX = e.clientX
      const move = (ev: MouseEvent) => onMove(ev.clientX - startX)
      const up = () => {
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
      }
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    },
    [],
  )

  const startIndentDrag = (kind: 'first' | 'left' | 'right') => (e: React.MouseEvent) => {
    if (!onIndentChange) return
    const base =
      kind === 'first' ? indentFirstLine : kind === 'left' ? indentLeft : 0
    startDrag(e, (dx) => {
      const snap = Math.round((base + dx) / 5) * 5
      if (kind === 'first') onIndentChange({ indentFirstLine: snap })
      else if (kind === 'left') onIndentChange({ indentLeft: Math.max(0, snap) })
    })
  }

  const startMarginDrag = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    if (!onMarginChange) return
    const base = margin
    startDrag(e, (dx) => {
      const next = side === 'left' ? base + dx : base - dx
      const snap = Math.round(next / 5) * 5
      onMarginChange(Math.min(width / 2 - 60, Math.max(20, snap)))
    })
  }

  return (
    <div className="ruler" style={{ width }} role="group" aria-label="Thước kẻ">
      {/* nút chọn kiểu tab, bên trái */}
      <button type="button" className="ruler-tab-type" title="Kiểu tab">
        L
      </button>

      {/* vùng lề trái / lề phải — kéo được */}
      <div
        className="ruler-zone ruler-zone--drag"
        style={{ left: 0, width: margin }}
        title="Kéo để đổi lề trái"
        onMouseDown={startMarginDrag('left')}
        aria-hidden="true"
      />
      <div
        className="ruler-zone ruler-zone--drag"
        style={{ left: width - margin, width: margin }}
        title="Kéo để đổi lề phải"
        onMouseDown={startMarginDrag('right')}
        aria-hidden="true"
      />

      {ticks.map((t, i) => (
        <span
          key={i}
          className={cn('ruler-tick', t.mid && 'ruler-tick--mid')}
          style={{ left: t.x }}
        />
      ))}
      {ticks
        .filter((t) => t.label)
        .map((t, i) => (
          <span key={`n${i}`} className="ruler-num" style={{ left: t.x }}>
            {t.label}
          </span>
        ))}

      {/* marker thụt lề — kéo được (giống Word) */}
      {onIndentChange && (
        <>
          <button
            type="button"
            className="ruler-marker ruler-marker--first"
            style={{ left: margin + indentLeft + indentFirstLine }}
            title="Thụt dòng đầu"
            aria-label="Thụt dòng đầu"
            onMouseDown={startIndentDrag('first')}
          />
          <button
            type="button"
            className="ruler-marker ruler-marker--hang"
            style={{ left: margin + indentLeft }}
            title="Thụt treo"
            aria-label="Thụt treo"
            onMouseDown={startIndentDrag('left')}
          />
          <button
            type="button"
            className="ruler-marker ruler-marker--left"
            style={{ left: margin + indentLeft }}
            title="Thụt lề trái"
            aria-label="Thụt lề trái"
            onMouseDown={startIndentDrag('left')}
          />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Dock AI (có rail thu gọn) — mặc định bên trái, `side="right"` để
 * đặt ở cột phải (dùng cho trình soạn slide).
 * ------------------------------------------------------------------ */

export function AiDock({
  open,
  onToggle,
  width,
  side = 'left',
  children,
}: {
  open: boolean
  onToggle: () => void
  width: number
  /** cột đặt panel — 'left' cho soạn đề, 'right' cho soạn slide */
  side?: 'left' | 'right'
  children: ReactNode
}) {
  // Panel luôn được mount (giữ lịch sử chat); đóng/mở chỉ đổi width bằng CSS
  // transition `.ai-dock` ↔ `.ai-dock.collapsed`, panel teo về 0 và rail hiện ra.
  return (
    <aside
      className={cn('ai-dock', !open && 'collapsed', side === 'right' && 'ai-dock--right')}
      style={{ ['--ai-panel-width' as string]: `${width}px` }}
    >
      <div className="ai-dock__body" inert={!open}>
        {children}
      </div>
      {open ? (
        <button
          type="button"
          className="ai-dock__collapse"
          onClick={onToggle}
          title="Thu gọn trợ lý AI"
          aria-label="Thu gọn trợ lý AI"
        >
          {side === 'right' ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </button>
      ) : (
        <button
          type="button"
          className={cn('ai-rail', side === 'right' && 'ai-rail--right')}
          onClick={onToggle}
          title="Mở trợ lý AI"
          aria-label="Mở trợ lý AI"
        >
          {side === 'right' ? <IconSidebarRight size={18} /> : <IconSidebarLeft size={18} />}
          <span className="ai-rail-text">Trợ lý AI</span>
        </button>
      )}
    </aside>
  )
}

/* ------------------------------------------------------------------ *
 * Nav pane bên phải (mục lục / khối mẫu / tìm kiếm)
 * ------------------------------------------------------------------ */

export function NavPane({
  width,
  onResize,
  children,
}: {
  width: number
  onResize: (w: number) => void
  children: ReactNode
}) {
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragRef.current = { startX: e.clientX, startW: width }
      const move = (ev: MouseEvent) => {
        const d = dragRef.current
        if (!d) return
        const next = Math.min(520, Math.max(200, d.startW - (ev.clientX - d.startX)))
        onResize(next)
      }
      const up = () => {
        dragRef.current = null
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
      }
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    },
    [width, onResize],
  )

  return (
    <aside className="nav-pane" style={{ width }}>
      <div
        className="nav-pane-resizer"
        onMouseDown={onMouseDown}
        role="separator"
        aria-orientation="vertical"
      />
      {children}
    </aside>
  )
}

/* ------------------------------------------------------------------ *
 * Hook: kích thước khung nhìn
 * ------------------------------------------------------------------ */

export function useViewportSize() {
  const [size, setSize] = useState({ w: 1280, h: 800 })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export { IconSidebarRight }
