/**
 * Thanh công cụ nổi trên phần tử đang chọn: những thao tác hay dùng nhất ngay gần chỗ đang sửa,
 * để người mới không phải tìm trên ribbon. Đặt trong `.slide-stage__inner` (cùng kích thước khung slide),
 * toạ độ theo % khung.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Copy, Italic, Layers, Palette, SlidersHorizontal, Sparkles, Trash2, Type } from 'lucide-react'
import type { SlideElement } from '@/store/docs'
import { REWRITE_PRESETS } from '@/lib/slideRewrite'
import { graphicById, graphicMainColor } from '@/lib/slideGraphics'
import { readableTextOn } from '@/lib/slideTheme'
import { ColorPalette } from './ColorPalette'

const POPOVER = 'absolute top-full z-10 mt-1.5 rounded-lg border border-line bg-surface p-2 shadow-[0_8px_24px_-6px_rgba(35,32,28,0.3)]'

/** Nút màu: bấm mở bảng màu (màu của bộ màu + màu phổ biến + chọn màu tuỳ ý). */
function ColorTool({
  title,
  value,
  themeColors,
  right,
  onPick,
}: {
  right?: boolean
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
        <div className={`${POPOVER} ${right ? 'right-0' : 'left-0'}`}>
          <ColorPalette
            value={value}
            themeColors={themeColors}
            onPick={onPick}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

const LAYER_MENU = { w: 224, max: 380 }

const TYPE_LABEL: Record<string, string> = {
  text: 'Chữ',
  shape: 'Hình khối',
  icon: 'Icon',
  image: 'Ảnh',
  connector: 'Đường nối',
  chart: 'Biểu đồ',
}

/** nhãn ngắn của một phần tử trong danh sách lớp: chữ thì lấy vài chữ đầu, đồ hoạ thì lấy tên */
function layerLabel(el: SlideElement): string {
  if (el.type === 'graphic') return graphicById(el.graphicId)?.name ?? 'Đồ hoạ'
  const text = (el.text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if ((el.type === 'text' || el.type === 'shape') && text) return text.length > 22 ? `${text.slice(0, 22)}…` : text
  return TYPE_LABEL[el.type] ?? 'Phần tử'
}

/**
 * Menu lớp (kiểu Canva): đưa lên/xuống một lớp hoặc lên đầu/xuống cuối, và danh sách mọi lớp của slide
 * (trên xuống dưới) để chọn thẳng một phần tử — cần khi nó bị phần tử khác che hết hoặc chồng gần kín.
 * Vẽ bằng portal ra `body` với toạ độ cố định kẹp trong cửa sổ, nên phần tử sát mép slide
 * hay sát mép cửa sổ thì menu vẫn hiện đủ (mở lên trên khi dưới hết chỗ).
 */
function LayerTool({
  elements,
  selectedId,
  onArrange,
  onSelect,
}: {
  elements: SlideElement[]
  selectedId: string
  onArrange: (action: 'front' | 'back' | 'forward' | 'backward') => void
  onSelect: (id: string) => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null)
  const open = pos !== null
  const count = elements.length
  const index = elements.findIndex((e) => e.id === selectedId)

  useEffect(() => {
    if (!pos) return
    const close = () => setPos(null)
    const outside = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close()
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close()
    // cuộn bên trong chính menu (danh sách lớp) không được đóng menu
    const scroll = (e: Event) => !menuRef.current?.contains(e.target as Node) && close()
    // pha bắt (capture): kéo phần tử chặn lan truyền sự kiện, nếu nghe ở pha nổi thì menu không đóng khi bắt đầu kéo
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('keydown', esc)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', scroll, true)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', scroll, true)
    }
  }, [pos])

  const toggle = () => {
    if (open) return setPos(null)
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const spaceBelow = window.innerHeight - r.bottom - 14
    const spaceAbove = r.top - 14
    const left = Math.min(Math.max(8, r.left), window.innerWidth - LAYER_MENU.w - 8)
    // mở xuống khi dưới đủ chỗ cho menu đầy đủ, không thì mở về phía rộng hơn (menu tự co, danh sách lớp cuộn)
    const down = spaceBelow >= LAYER_MENU.max || spaceBelow >= spaceAbove
    setPos(down ? { left, top: r.bottom + 6 } : { left, bottom: window.innerHeight - r.top + 6 })
  }
  const atTop = index >= count - 1
  const atBottom = index <= 0
  const items: Array<{ action: 'front' | 'back' | 'forward' | 'backward'; label: string; icon: React.ReactNode; disabled: boolean }> = [
    { action: 'front', label: 'Đưa lên trên cùng', icon: <ChevronsUp className="size-3.5" />, disabled: atTop },
    { action: 'forward', label: 'Lên một lớp', icon: <ChevronUp className="size-3.5" />, disabled: atTop },
    { action: 'backward', label: 'Xuống một lớp', icon: <ChevronDown className="size-3.5" />, disabled: atBottom },
    { action: 'back', label: 'Đưa xuống dưới cùng', icon: <ChevronsDown className="size-3.5" />, disabled: atBottom },
  ]
  const itemCls = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-ink-2 hover:bg-paper-2 disabled:opacity-35 disabled:hover:bg-transparent'
  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        title="Lớp"
        aria-label="Lớp"
        aria-expanded={open}
        disabled={count < 2}
        className={`flex size-7 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 disabled:opacity-30 ${open ? 'bg-paper-2' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        <Layers className="size-3.5" />
      </button>
      {pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="layer-menu fixed z-[200] flex flex-col rounded-lg border border-line bg-surface p-1 shadow-[0_8px_24px_-6px_rgba(35,32,28,0.3)]"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: LAYER_MENU.w, maxHeight: `min(${LAYER_MENU.max}px, calc(100vh - 16px))` }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="px-2 pb-1 pt-0.5 text-[11.5px] text-ink-3">
              Lớp {index + 1}/{count}
            </div>
            {items.map((it) => (
              <button
                key={it.action}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                className={itemCls}
                onClick={() => {
                  onArrange(it.action)
                  setPos(null)
                }}
              >
                {it.icon}
                {it.label}
              </button>
            ))}
            <div className="mx-1 my-1 border-t border-line" />
            <div className="px-2 pb-1 text-[11.5px] text-ink-3">Chọn lớp (trên → dưới)</div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {[...elements].reverse().map((e) => (
                <button
                  key={e.id}
                  type="button"
                  role="menuitem"
                  className={`${itemCls} ${e.id === selectedId ? 'bg-paper-2 font-semibold text-clay' : ''}`}
                  onClick={() => {
                    setPos(null)
                    onSelect(e.id)
                  }}
                >
                  <span className="shrink-0 text-[11px] font-normal text-ink-3">{TYPE_LABEL[e.type] ?? 'Đồ hoạ'}</span>
                  <span className="truncate">{layerLabel(e)}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body,
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
  right,
  onUpdate,
}: {
  right?: boolean
  el: SlideElement
  themeColors: string[]
  onUpdate: (patch: Partial<SlideElement>) => void
}) {
  const [open, setOpen] = useState(false)
  const isLine = el.shape === 'line'
  const width = el.border ?? 0
  const opacity = Math.round((el.opacity ?? 1) * 100)
  // hình bị cắt (sao, tim, tam giác, mũi tên) cắt luôn bóng đổ nên không hiện mục bóng cho chúng
  const plain = el.type !== 'shape' // đồ hoạ/icon: chỉ có độ trong suốt
  const clipped = el.shape === 'star' || el.shape === 'heart' || el.shape === 'triangle' || el.shape === 'arrow'
  const shadow = el.shadowLevel ?? (el.shadow ? 2 : 0)
  return (
    <div className="relative">
      <button
        type="button"
        title={plain ? 'Độ trong suốt' : isLine ? 'Độ dày, đầu mũi tên' : 'Viền, độ trong suốt, bóng đổ'}
        aria-label="Kiểu hình"
        aria-expanded={open}
        className={`flex size-7 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 ${open ? 'bg-paper-2' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal className="size-3.5" />
      </button>
      {open && (
        <div className={`${POPOVER} ${right ? 'right-0' : 'left-0'} ${plain ? 'w-[196px]' : 'w-[240px]'} text-[12px] text-ink-2`} onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}>
          {plain ? null : isLine ? (
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
          <label className={plain ? 'block' : 'mt-3 block'}>
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
          {!plain && !isLine && !clipped && (
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
  onDuplicate,
  onArrange,
  elements,
  onSelectLayer,
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
  onDuplicate: () => void
  onArrange: (action: 'front' | 'back' | 'forward' | 'backward') => void
  /** mọi phần tử của slide, theo thứ tự lớp (cuối mảng = trên cùng) */
  elements: SlideElement[]
  onSelectLayer: (id: string) => void
  /** nhờ AI viết lại chữ của ô (chỉ hộp chữ); ném lỗi có thông báo tiếng Việt khi thất bại */
  onAskAi?: (instruction: string) => Promise<void>
  /** bắt đầu gõ chữ trong hình khối */
  onEditText?: () => void
}) {
  const isText = el.type === 'text'
  // thanh nằm nửa phải khung thì bảng màu mở sang trái, khỏi tràn mép
  const right = el.x > 25
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
  const covers = !above && el.y + height > 80
  // nút xoay lật lên đỉnh khi phần tử sát mép dưới (khớp EditableEl): thanh nhường chỗ
  const rotTop = el.y + height > 88
  // phần tử nằm sát bên phải thì thanh canh theo mép phải phần tử, vẫn đi theo khi kéo
  const alignEnd = el.x > 62
  const style: React.CSSProperties = {
    position: 'absolute',
    ...(alignEnd ? { right: `${Math.max(100 - (el.x + el.w), 0)}%` } : { left: `${Math.max(el.x, 0)}%` }),
    // phần tử phủ gần kín slide: không có chỗ trên/dưới, đặt thanh vào trong sát mép trên
    top: covers ? '10px' : above ? `calc(${el.y}% - ${rotTop ? 76 : 44}px)` : `calc(${el.y + height}% + 8px)`,
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
      ? { position: 'absolute', left: style.left, right: style.right, bottom: `calc(${100 - el.y}% + ${rotTop ? 84 : 52}px)`, zIndex: 51 }
      : { position: 'absolute', left: style.left, right: style.right, top: `calc(${el.y + height}% + 10px)`, zIndex: 51 }

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
          <ColorTool right={right} title="Màu chữ" value={el.textColor ?? fg} themeColors={[fg, accent]} onPick={(textColor) => onUpdate({ textColor })} />
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
              <ColorTool right={right} title="Màu chữ" value={el.textColor ?? readableTextOn(el.fill ?? accent)} themeColors={[fg, accent, '#ffffff']} onPick={(textColor) => onUpdate({ textColor })} />
            </>
          )}
          {sep}
        </>
      )}
      {el.type === 'shape' && (
        <>
          <ColorTool right={right} title="Màu tô" value={el.fill ?? accent} themeColors={[accent, fg]} onPick={(fill) => onUpdate({ fill })} />
          <ShapeStyleTool right={right} el={el} themeColors={[accent, fg]} onUpdate={onUpdate} />
          {sep}
        </>
      )}
      {el.type === 'graphic' && (
        <>
          <ColorTool right={right} title="Màu nét" value={el.textColor ?? fg} themeColors={[fg, accent]} onPick={(textColor) => onUpdate({ textColor })} />
          <ColorTool right={right} title="Màu chủ đạo" value={el.fill ?? graphicMainColor(el.graphicId)} themeColors={[accent, fg]} onPick={(fill) => onUpdate({ fill })} />
        </>
      )}
      {el.type === 'icon' && <ColorTool right={right} title="Màu icon" value={el.textColor ?? accent} themeColors={[accent, fg]} onPick={(textColor) => onUpdate({ textColor })} />}
      {(el.type === 'graphic' || el.type === 'icon') && (
        <>
          <ShapeStyleTool right={right} el={el} themeColors={[accent, fg]} onUpdate={onUpdate} />
          {sep}
        </>
      )}
      {tool('Nhân đôi (Ctrl+D)', onDuplicate, <Copy className="size-3.5" />)}
      <LayerTool elements={elements} selectedId={el.id} onArrange={onArrange} onSelect={onSelectLayer} />
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
