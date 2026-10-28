/**
 * Thanh công cụ nổi trên phần tử đang chọn: những thao tác hay dùng nhất ngay gần chỗ đang sửa,
 * để người mới không phải tìm trên ribbon. Đặt trong `.slide-stage__inner` (cùng kích thước khung slide),
 * toạ độ theo % khung.
 */
import { useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Palette, SlidersHorizontal, Sparkles, Trash2, Type } from 'lucide-react'
import type { SlideElement } from '@/store/docs'
import { REWRITE_PRESETS } from '@/lib/slideRewrite'
import { readableTextOn } from '@/lib/slideTheme'
import { ColorPalette } from './ColorPalette'

const POPOVER = 'absolute left-0 top-full z-10 mt-1.5 rounded-lg border border-line bg-surface p-2 shadow-[0_8px_24px_-6px_rgba(35,32,28,0.3)]'

/** Nút màu: bấm mở bảng màu (màu của bộ màu + màu phổ biến + chọn màu tuỳ ý). */
function ColorTool({
  title,
  value,
  themeColors,
  onPick,
}: {
  title: string
  value: string
  themeColors: string[]
  onPick: (color: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        className={`flex size-7 flex-col items-center justify-center gap-0.5 rounded-md text-ink-2 transition-colors hover:bg-paper-2 ${open ? 'bg-paper-2' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        <Palette className="size-3.5" />
        <span className="h-[3px] w-4 rounded-full border border-black/10" style={{ background: value }} />
      </button>
      {open && (
        <div className={POPOVER}>
          <ColorPalette
            value={value}
            themeColors={themeColors}
            onPick={(color) => {
              onPick(color)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

const BORDER_WIDTHS = [
  { label: 'Không', value: 0 },
  { label: 'Mỏng', value: 2 },
  { label: 'Vừa', value: 4 },
  { label: 'Dày', value: 8 },
]

const LINE_WIDTHS = [
  { label: 'Mỏng', value: 2 },
  { label: 'Vừa', value: 4 },
  { label: 'Dày', value: 8 },
]
const ARROWS: Array<{ label: string; value: NonNullable<SlideElement['lineArrow']> }> = [
  { label: 'Không', value: 'none' },
  { label: 'Một đầu', value: 'end' },
  { label: 'Hai đầu', value: 'both' },
]
const SHADOW_LEVELS = [
  { label: 'Không', value: 0 },
  { label: 'Nhẹ', value: 1 },
  { label: 'Vừa', value: 2 },
  { label: 'Đậm', value: 3 },
] as const

const chip = (active: boolean) =>
  `flex-1 rounded-md border px-1 py-1 transition-colors ${active ? 'border-clay text-clay' : 'border-line hover:border-clay'}`

/** Kiểu hình: đường thẳng (độ dày, đầu mũi tên) hoặc hình khối (viền, bóng đổ), cùng độ trong suốt. */
function ShapeStyleTool({
  el,
  themeColors,
  onUpdate,
}: {
  el: SlideElement
  themeColors: string[]
  onUpdate: (patch: Partial<SlideElement>) => void
}) {
  const [open, setOpen] = useState(false)
  const isLine = el.shape === 'line'
  const width = el.border ?? 0
  const opacity = Math.round((el.opacity ?? 1) * 100)
  // hình bị cắt (sao, tim, tam giác, mũi tên) cắt luôn bóng đổ nên không hiện mục bóng cho chúng
  const clipped = el.shape === 'star' || el.shape === 'heart' || el.shape === 'triangle' || el.shape === 'arrow'
  const shadow = el.shadowLevel ?? (el.shadow ? 2 : 0)
  return (
    <div className="relative">
      <button
        type="button"
        title={isLine ? 'Độ dày, đầu mũi tên' : 'Viền, độ trong suốt, bóng đổ'}
        aria-label="Kiểu hình"
        aria-expanded={open}
        className={`flex size-7 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 ${open ? 'bg-paper-2' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal className="size-3.5" />
      </button>
      {open && (
        <div className={`${POPOVER} w-[196px] text-[12px] text-ink-2`} onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}>
          {isLine ? (
            <>
              <div className="mb-1 font-semibold">Độ dày</div>
              <div className="flex gap-1">
                {LINE_WIDTHS.map((b) => (
                  <button key={b.value} type="button" className={chip((el.border ?? 4) === b.value)} onClick={() => onUpdate({ border: b.value })}>
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="mb-1 mt-3 font-semibold">Đầu mũi tên</div>
              <div className="flex gap-1">
                {ARROWS.map((a) => (
                  <button key={a.value} type="button" className={chip((el.lineArrow ?? 'none') === a.value)} onClick={() => onUpdate({ lineArrow: a.value })}>
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-1 font-semibold">Viền</div>
              <div className="flex gap-1">
                {BORDER_WIDTHS.map((b) => (
                  <button key={b.value} type="button" className={chip(width === b.value)} onClick={() => onUpdate({ border: b.value })}>
                    {b.label}
                  </button>
                ))}
              </div>
              {width > 0 && (
                <div className="mt-2">
                  <ColorPalette value={el.borderColor ?? '#111827'} themeColors={themeColors} onPick={(borderColor) => onUpdate({ borderColor })} />
                </div>
              )}
            </>
          )}
          <label className="mt-3 block">
            <span className="flex justify-between font-semibold">
              Độ trong suốt <span className="font-normal">{100 - opacity}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={100 - opacity}
              className="mt-1 w-full accent-[var(--color-clay)]"
              onChange={(e) => onUpdate({ opacity: 1 - Number(e.target.value) / 100 })}
            />
          </label>
          {!isLine && !clipped && (
            <>
              <div className="mb-1 mt-3 font-semibold">Bóng đổ</div>
              <div className="flex gap-1">
                {SHADOW_LEVELS.map((l) => (
                  <button key={l.value} type="button" className={chip(shadow === l.value)} onClick={() => onUpdate({ shadowLevel: l.value })}>
                    {l.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function SelectionToolbar({
  el,
  height,
  accent,
  fg,
  onUpdate,
  onDelete,
  onAskAi,
  onEditText,
}: {
  el: SlideElement
  /** chiều cao hiển thị của phần tử (%), hộp chữ tự co theo nội dung */
  height: number
  accent: string
  fg: string
  onUpdate: (patch: Partial<SlideElement>) => void
  onDelete: () => void
  /** nhờ AI viết lại chữ của ô (chỉ hộp chữ); ném lỗi có thông báo tiếng Việt khi thất bại */
  onAskAi?: (instruction: string) => Promise<void>
  /** bắt đầu gõ chữ trong hình khối */
  onEditText?: () => void
}) {
  const isText = el.type === 'text'
  const [askOpen, setAskOpen] = useState(false)
  const [ask, setAsk] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async (instruction: string) => {
    if (!onAskAi || !instruction.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await onAskAi(instruction.trim())
      setAskOpen(false)
      setAsk('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI chưa sửa được, thử lại nhé.')
    } finally {
      setBusy(false)
    }
  }
  const size = el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)
  // thanh rộng ~33% khung: kẹp để không tràn mép phải; sát mép trên thì xuống dưới phần tử
  const above = el.y > 10
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${Math.min(Math.max(el.x, 0), 62)}%`,
    top: above ? `calc(${el.y}% - 44px)` : `calc(${el.y + height}% + 8px)`,
    zIndex: 50,
  }
  const btn = 'flex size-7 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 disabled:opacity-30'
  // giữ vùng chọn/ô nhập chữ: bấm nút không làm mất focus
  const keep = (e: React.MouseEvent) => e.preventDefault()
  const tool = (title: string, onClick: () => void, icon: React.ReactNode, active = false) => (
    <button type="button" title={title} aria-label={title} className={`${btn} ${active ? 'bg-paper-2 text-clay' : ''}`} onMouseDown={keep} onClick={onClick}>
      {icon}
    </button>
  )
  const sep = <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />

  // ô hỏi AI mở dưới phần tử (không che chữ đang sửa); phần tử gần đáy thì mở phía trên thanh
  const popStyle: React.CSSProperties =
    el.y + height > 70
      ? { position: 'absolute', left: style.left, bottom: `calc(${100 - el.y}% + 52px)`, zIndex: 51 }
      : { position: 'absolute', left: style.left, top: `calc(${el.y + height}% + 10px)`, zIndex: 51 }

  return (
    <>
    <div
      role="toolbar"
      aria-label="Định dạng nhanh"
      className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_16px_-4px_rgba(35,32,28,0.25)]"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {isText && onAskAi && (
        <>
          <button
            type="button"
            title="Nhờ AI sửa ô chữ này"
            aria-label="Hỏi AI"
            aria-expanded={askOpen}
            className={`flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-semibold text-clay transition-colors hover:bg-paper-2 ${askOpen ? 'bg-paper-2' : ''}`}
            onMouseDown={keep}
            onClick={() => setAskOpen((v) => !v)}
          >
            <Sparkles className="size-3.5" />
            Hỏi AI
          </button>
          {sep}
        </>
      )}
      {isText && (
        <>
          {tool('Giảm cỡ chữ', () => onUpdate({ fontSize: Math.max(1, size - 0.3) }), <span className="text-[11px] font-semibold">A−</span>)}
          {tool('Tăng cỡ chữ', () => onUpdate({ fontSize: size + 0.3 }), <span className="text-[13px] font-semibold">A+</span>)}
          {sep}
          {tool('Đậm', () => onUpdate({ fontWeight: (el.fontWeight ?? 500) >= 700 ? 400 : 700 }), <Bold className="size-3.5" />, (el.fontWeight ?? 500) >= 700)}
          {tool('Nghiêng', () => onUpdate({ fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' }), <Italic className="size-3.5" />, el.fontStyle === 'italic')}
          <ColorTool title="Màu chữ" value={el.textColor ?? fg} themeColors={[fg, accent]} onPick={(textColor) => onUpdate({ textColor })} />
          {sep}
          {tool('Căn trái', () => onUpdate({ align: 'left' }), <AlignLeft className="size-3.5" />, (el.align ?? 'left') === 'left')}
          {tool('Căn giữa', () => onUpdate({ align: 'center' }), <AlignCenter className="size-3.5" />, el.align === 'center')}
          {tool('Căn phải', () => onUpdate({ align: 'right' }), <AlignRight className="size-3.5" />, el.align === 'right')}
          {sep}
        </>
      )}
      {el.type === 'shape' && el.shape !== 'line' && (
        <>
          {tool(el.text?.trim() ? 'Sửa chữ trong hình' : 'Thêm chữ vào hình', () => onEditText?.(), <Type className="size-3.5" />, Boolean(el.text?.trim()))}
          {el.text?.trim() && (
            <>
              {tool('Giảm cỡ chữ', () => onUpdate({ fontSize: Math.max(1, (el.fontSize ?? 2.4) - 0.3) }), <span className="text-[11px] font-semibold">A−</span>)}
              {tool('Tăng cỡ chữ', () => onUpdate({ fontSize: (el.fontSize ?? 2.4) + 0.3 }), <span className="text-[13px] font-semibold">A+</span>)}
              <ColorTool title="Màu chữ" value={el.textColor ?? readableTextOn(el.fill ?? accent)} themeColors={[fg, accent, '#ffffff']} onPick={(textColor) => onUpdate({ textColor })} />
            </>
          )}
          {sep}
        </>
      )}
      {el.type === 'shape' && (
        <>
          <ColorTool title="Màu tô" value={el.fill ?? accent} themeColors={[accent, fg]} onPick={(fill) => onUpdate({ fill })} />
          <ShapeStyleTool el={el} themeColors={[accent, fg]} onUpdate={onUpdate} />
          {sep}
        </>
      )}
      {tool('Xoá', onDelete, <Trash2 className="size-3.5" />)}
    </div>
    {askOpen && isText && (
      <div
        role="dialog"
        aria-label="Hỏi AI"
        className="w-[300px] rounded-lg border border-line bg-surface p-2.5 shadow-[0_8px_24px_-6px_rgba(35,32,28,0.3)]"
        style={popStyle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setAskOpen(false)
        }}
      >
        <div className="flex flex-wrap gap-1.5">
          {REWRITE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={busy}
              onClick={() => void send(p.ask)}
              className="rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 transition-colors hover:border-clay hover:text-clay disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            void send(ask)
          }}
        >
          <input
            autoFocus
            value={ask}
            disabled={busy}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="Hoặc gõ yêu cầu của bạn…"
            className="min-w-0 flex-1 rounded-md border border-line px-2 py-1.5 text-[12.5px] outline-none focus:border-clay"
          />
          <button type="submit" disabled={busy || !ask.trim()} className="rounded-md bg-clay px-3 text-[12.5px] font-semibold text-white disabled:opacity-40">
            Gửi
          </button>
        </form>
        {busy && <div className="mt-2 text-[12px] text-ink-3">AI đang viết…</div>}
        {error && (
          <div role="alert" className="mt-2 rounded-md bg-clay-tint px-2 py-1.5 text-[12px] leading-snug text-clay-deep">
            {error}
          </div>
        )}
      </div>
    )}
    </>
  )
}
