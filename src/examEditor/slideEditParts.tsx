/** Slide — phần sửa trực tiếp trên khung: kéo / đổi cỡ / xoay, đường gióng bắt dính, thanh nhóm. */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { svgDataUrl } from '@/lib/plot'
import { readToolDoc, type ToolDoc } from '@/lib/toolSpec'
import { ToolModal } from './tools/ToolModal'
import { FRAME_PLACEHOLDER, dragImage, photoFrameClip } from '@/lib/slideShapes'
import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceAround, AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceAround, CopyPlus, Ellipsis, Link2, Lock, LockOpen, RotateCw } from 'lucide-react'
import { TrashIcon } from '@/components/appIcons'
import { type AlignMode } from '@/lib/slideAlign'
import { graphicById } from '@/lib/slideGraphics'
import { GraphicFill, SlideIcon } from './LazyAssets'
import { cn } from '@/lib/cn'
import type { SlideElement } from '@/store/docs'
import { elementHeight } from '@/lib/slideText'
import { readableTextOn, type ResolvedTheme } from '@/lib/slideTheme'
import { uploadImage } from '@/lib/mediaStore'
import { MathCell, clamp } from './SlideEditor'
import { fontStack, ConnectorSvg, shapeCss, isHollowShape, HOLLOW_HIT, shapeInner, ShapeText, ChartView, AutoFitText, imageImgStyle, imageStyleParts, VideoView } from './slideRender'

export const FRAME_HOVER = 'slide-frame-hover'

type CropBox = { l: number; t: number; r: number; b: number }
function coverCropOf(w: number, h: number, nat: { w: number; h: number } | null): CropBox {
  if (!nat || nat.w <= 0 || nat.h <= 0 || w <= 0 || h <= 0) return { l: 0, t: 0, r: 0, b: 0 }
  const boxRatio = (w * 16) / (h * 9)
  const imgRatio = nat.w / nat.h
  if (Math.abs(boxRatio - imgRatio) < 1e-3) return { l: 0, t: 0, r: 0, b: 0 }
  if (imgRatio > boxRatio) {
    const cut = Math.min(45, ((1 - boxRatio / imgRatio) * 100) / 2)
    return { l: cut, t: 0, r: cut, b: 0 }
  }
  const cut = Math.min(45, ((1 - imgRatio / boxRatio) * 100) / 2)
  return { l: 0, t: cut, r: 0, b: cut }
}

/* ---------- thanh nổi khi chọn nhiều phần tử: căn + phân bố đều ---------- */
export const GROUP_ACTIONS: Array<{ mode: AlignMode; label: string; Icon: typeof AlignStartVertical; min?: number }> = [
  { mode: 'left', label: 'Căn trái', Icon: AlignStartVertical },
  { mode: 'center', label: 'Căn giữa ngang', Icon: AlignCenterVertical },
  { mode: 'right', label: 'Căn phải', Icon: AlignEndVertical },
  { mode: 'top', label: 'Căn trên', Icon: AlignStartHorizontal },
  { mode: 'middle', label: 'Căn giữa dọc', Icon: AlignCenterHorizontal },
  { mode: 'bottom', label: 'Căn dưới', Icon: AlignEndHorizontal },
  { mode: 'spreadX', label: 'Khoảng cách đều theo chiều ngang', Icon: AlignHorizontalSpaceAround, min: 3 },
  { mode: 'spreadY', label: 'Khoảng cách đều theo chiều dọc', Icon: AlignVerticalSpaceAround, min: 3 },
]

export function GroupToolbar({
  els,
  onAlign,
  onDelete,
  onGroup,
  onUngroup,
  onDuplicate,
  onToggleLock,
  onMore,
}: {
  els: SlideElement[]
  onAlign: (mode: AlignMode) => void
  onDelete: () => void
  onGroup: () => void
  onUngroup: () => void
  onDuplicate: () => void
  onToggleLock: () => void
  /** mở menu đầy đủ (Lớp, Căn chỉnh theo trang…) ngay dưới nút ⋯ */
  onMore: (anchor: DOMRect) => void
}) {
  const gid = els[0]?.groupId
  const isOneGroup = Boolean(gid) && els.every((e) => e.groupId === gid)
  const locked = els.every((e) => e.locked)
  const top = Math.min(...els.map((e) => e.y))
  const bottom = Math.max(...els.map((e) => e.y + elementHeight(e)))
  const above = top > 12
  const btn = 'grid size-8 place-items-center rounded-md text-ink hover:bg-black/5'
  return (
    <div
      className="slide-sel-toolbar absolute left-1/2 z-[51] flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-surface px-1.5 py-1 shadow-[0_4px_16px_-4px_rgba(35,32,28,0.25)]"
      style={above ? { top: `calc(${top}% - 48px)` } : { top: `calc(${Math.min(bottom, 100)}% + 8px)` }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {isOneGroup ? (
        <button type="button" data-tip-kbd="Ctrl+Shift+G" data-tip="Rã nhóm" className="h-8 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-ink hover:bg-black/5" onClick={onUngroup}>
          Bỏ nhóm
        </button>
      ) : (
        <>
          <button type="button" data-tip-kbd="Ctrl+G" data-tip={`Nhóm ${els.length} mục`} className="h-8 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-ink hover:bg-black/5" onClick={onGroup}>
            Nhóm
          </button>
          {GROUP_ACTIONS.map(({ mode, label, Icon, min }, i) => (
            <button
              key={mode}
              type="button"
              data-tip={min && els.length < min ? `${label} (cần chọn từ ${min} mục)` : label}
              aria-label={label}
              disabled={!!min && els.length < min}
              className={cn(btn, 'disabled:opacity-35 disabled:hover:bg-transparent', (i === 0 || i === 3 || i === 6) && 'ml-1')}
              onClick={() => onAlign(mode)}
            >
              <Icon size={16} strokeWidth={1.8} />
            </button>
          ))}
        </>
      )}
      <button type="button" data-tip={locked ? 'Mở khoá' : 'Khoá'} aria-label={locked ? 'Mở khoá' : 'Khoá'} aria-pressed={locked} className={cn(btn, 'ml-1', locked && 'bg-clay/10 text-clay')} onClick={onToggleLock}>
        {locked ? <Lock size={17} strokeWidth={1.8} /> : <LockOpen size={17} strokeWidth={1.8} />}
      </button>
      <button type="button" data-tip="Nhân bản" data-tip-kbd="Ctrl+D" aria-label="Nhân bản" className={btn} onClick={onDuplicate}>
        <CopyPlus size={17} strokeWidth={1.8} />
      </button>
      <button type="button" data-tip="Xoá" aria-label="Xoá các mục đã chọn" className={btn} onClick={onDelete}>
        <TrashIcon size={17} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        data-tip="Thêm"
        aria-label="Thêm lệnh"
        className={cn(btn, 'bg-black/5')}
        onClick={(e) => onMore(e.currentTarget.getBoundingClientRect())}
      >
        <Ellipsis size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

/* ---------- đường gióng khi kéo (smart guides kiểu Canva) ---------- */
export const GUIDES = 'slide-snap-guides'
export const SNAP_PX = 5
/** khoảng cách tới phần tử gần nhất: đoạn thẳng (% khung) và nhãn px */
export type Gap = { x1: number; y1: number; x2: number; y2: number; label: number }
export type Guides = { x: number | null; y: number | null; gaps?: Gap[] }
/** slide quy về 1920×1080 để con số khoảng cách không đổi theo mức zoom (như Canva) */
export const SLIDE_W_PX = 1920
export const SLIDE_H_PX = 1080

/** Khoảng trống ngang/dọc từ hộp đang kéo tới phần tử gần nhất cùng hàng/cột. */
export function gapsTo(box: { x: number; y: number; w: number; h: number }, others: Array<{ xs: number[]; ys: number[] }>): Gap[] {
  const [l, r, t, b] = [box.x, box.x + box.w, box.y, box.y + box.h]
  const cx = l + box.w / 2
  const cy = t + box.h / 2
  let left: Gap | null = null
  let right: Gap | null = null
  let up: Gap | null = null
  let down: Gap | null = null
  for (const o of others) {
    const [ol, , or] = o.xs
    const [ot, , ob] = o.ys
    const rowOverlap = ot < b && ob > t
    const colOverlap = ol < r && or > l
    if (rowOverlap && or <= l && (!left || or > left.x1)) left = { x1: or, y1: cy, x2: l, y2: cy, label: 0 }
    if (rowOverlap && ol >= r && (!right || ol < right.x2)) right = { x1: r, y1: cy, x2: ol, y2: cy, label: 0 }
    if (colOverlap && ob <= t && (!up || ob > up.y1)) up = { x1: cx, y1: ob, x2: cx, y2: t, label: 0 }
    if (colOverlap && ot >= b && (!down || ot < down.y2)) down = { x1: cx, y1: b, x2: cx, y2: ot, label: 0 }
  }
  return [left, right, up, down]
    .filter((g): g is Gap => !!g)
    .map((g) => ({ ...g, label: Math.round(g.y1 === g.y2 ? ((g.x2 - g.x1) * SLIDE_W_PX) / 100 : ((g.y2 - g.y1) * SLIDE_H_PX) / 100) }))
    .filter((g) => g.label > 0)
}
export const showGuides = (g: Guides) => window.dispatchEvent(new CustomEvent<Guides>(GUIDES, { detail: g }))

/** Mép trái/giữa/phải (hoặc trên/giữa/dưới) của hộp gần đích nào nhất trong `tol` → độ dời và vị trí đường gióng. */
let snapEnabled = true
/** bật/tắt đường gióng + hít khi kéo (ribbon Xem → Đường gióng) */
export const setSnapEnabled = (on: boolean) => {
  snapEnabled = on
}
export function snapTo(pos: number, size: number, targets: number[], tol: number) {
  if (!snapEnabled) return null
  let best: { d: number; at: number } | null = null
  for (const off of [0, size / 2, size])
    for (const at of targets) {
      const d = at - (pos + off)
      if (Math.abs(d) <= tol && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, at }
    }
  return best
}

export function SnapGuides() {
  const [g, setG] = useState<Guides>({ x: null, y: null })
  useEffect(() => {
    const on = (e: Event) => setG((e as CustomEvent<Guides>).detail)
    window.addEventListener(GUIDES, on)
    return () => window.removeEventListener(GUIDES, on)
  }, [])
  return (
    <>
      {g.x !== null && <div className="pointer-events-none absolute inset-y-0 z-[60] w-px bg-[#e0368f]" style={{ left: `${g.x}%` }} />}
      {g.y !== null && <div className="pointer-events-none absolute inset-x-0 z-[60] h-px bg-[#e0368f]" style={{ top: `${g.y}%` }} />}
      {g.gaps?.map((gap, i) => {
        const across = gap.y1 === gap.y2
        return (
          <div
            key={i}
            // khung trong suốt chỉ để canh nhãn vào giữa khoảng trống — không vẽ đường nối
            className={cn('pointer-events-none absolute z-[60] flex items-center justify-center', across ? 'h-px' : 'w-px')}
            style={{ left: `${gap.x1}%`, top: `${gap.y1}%`, width: across ? `${gap.x2 - gap.x1}%` : undefined, height: across ? undefined : `${gap.y2 - gap.y1}%` }}
          >
            {/* nhãn cùng kiểu viên thuốc "Chọn ảnh": nền trắng, bóng, chữ đậm — nằm giữa đoạn đo */}
            <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2 py-[3px] text-[11px] font-semibold leading-none text-ink shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_2px_6px_-1px_rgb(0_0_0/0.3)] tabular-nums">
              {gap.label}
            </span>
          </div>
        )
      })}
    </>
  )
}

/** Hướng tay nắm resize — 8 anchor như Transformer của bản gốc. */
export type ResizeDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
export const HANDLE_DIRS: ResizeDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export function EditableEl({
  el,
  theme,
  selected,
  onSelect,
  onBeginHistory,
  onPreview,
  onChange,
  onDragEnd,
  onGenerateImage,
  onDropInFrame,
  editingText,
  onEditingText,
  cropping = false,
  grouped = false,
  onSelectSingle,
  group = [],
  onToggleSelect,
  onPreviewMany,
  formatPainterActive = false,
  onPaintApply,
}: {
  el: SlideElement
  theme: ResolvedTheme
  selected: boolean
  onSelect: () => void
  /** nằm trong nhóm chọn nhiều: chỉ viền, không tay nắm; 'soft' = thuộc nhóm cố định (khung bao chung vẽ riêng) */
  grouped?: boolean | 'soft'
  /** bấm đúp vào một mục của nhóm cố định: chọn riêng mục đó (như Canva) */
  onSelectSingle?: () => void
  /** các phần tử khác trong nhóm — kéo phần tử này thì cả nhóm đi theo */
  group?: Array<{ id: string; x: number; y: number }>
  /** Shift+bấm: thêm/bớt khỏi nhóm chọn */
  onToggleSelect?: () => void
  onPreviewMany?: (patches: Record<string, Partial<SlideElement>>) => void
  onBeginHistory: () => void
  onPreview: (patch: Partial<SlideElement>) => void
  onChange: (patch: Partial<SlideElement>) => void
  /** kết thúc kéo/resize/xoay — chặn cú click rơi ra ngoài phần tử làm bỏ chọn */
  onDragEnd: () => void
  /** tạo ảnh AI cho khung ảnh trống (prompt lấy từ nội dung slide) */
  onGenerateImage: () => Promise<void>
  /** kéo ảnh trên slide thả vào khung ảnh: khung nhận ảnh, ảnh kéo bị bỏ */
  onDropInFrame: (frameId: string, src: string) => void
  /** đang gõ chữ trong hình khối (nhấp đúp hình hoặc nút "Thêm chữ" trên thanh nổi) */
  editingText: boolean
  onEditingText: (on: boolean) => void
  /** đang ở chế độ cắt ảnh */
  cropping?: boolean
  /** chế độ sao chép định dạng đang bật — nhấp vào ô chữ sẽ dán định dạng thay vì kéo */
  formatPainterActive?: boolean
  onPaintApply?: () => void
}) {
  const movedRef = useRef(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    setNatSize(null)
  }, [el.src])
  // ảnh đang được kéo qua khung: '' = file từ máy (chưa đọc được), null = không kéo
  const [dropPreview, setDropPreview] = useState<string | null>(null)
  // đồ thị đang mở lại để sửa (ảnh chèn từ công cụ Đồ thị hàm số)
  const [plotEdit, setPlotEdit] = useState<ToolDoc | null>(null)
  const plotModal =
    plotEdit &&
    createPortal(
      <ToolModal
        kind={plotEdit.kind}
        initial={plotEdit.spec}
        onClose={() => setPlotEdit(null)}
        onInsert={(img) => {
          // giữ bề rộng, chiều cao theo tỉ lệ ảnh mới trên khung 16:9
          onChange({ src: svgDataUrl(img.svg), h: (el.w * img.height * 16) / (img.width * 9) })
          setPlotEdit(null)
        }}
      />,
      document.body,
    )
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${elementHeight(el)}%`,
    zIndex: el.zIndex,
    // xoay + lật tách thành `rotate`/`scale` (cùng thứ tự với elTransform) để bấm Lật có chuyển động lật, còn xoay/kéo vẫn tức thì
    rotate: el.rotation ? `${el.rotation}deg` : undefined,
    scale: el.flipX || el.flipY ? `${el.flipX ? -1 : 1} ${el.flipY ? -1 : 1}` : undefined,
    transition: 'scale 350ms cubic-bezier(.2,.8,.2,1)',
    outline: selected || grouped === true ? '2px solid #b4532a' : grouped === 'soft' ? '1px dashed rgba(180, 83, 42, 0.55)' : undefined,
    outlineOffset: selected || grouped ? 0 : undefined,
    // khung viền rỗng (nền trong suốt, vd khung trang trí của bộ thiết kế phủ gần cả slide):
    // chỉ nhận chuột ở dải viền, kẻo bấm vào vùng trống hay sát mép lại chọn nhầm cả khung to
    clipPath: isHollowShape(el) && !selected && !grouped ? HOLLOW_HIT : undefined,
    touchAction: editingText ? 'auto' : 'none',
  }

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize', dir?: ResizeDir) => {
    if (formatPainterActive && mode === 'move') {
      e.stopPropagation()
      e.preventDefault()
      return
    }
    if ((e.target as HTMLElement).closest('textarea, input, button, label')) {
      onSelect()
      return
    }
    e.stopPropagation()
    movedRef.current = false
    if (e.shiftKey && mode === 'move' && onToggleSelect) {
      e.preventDefault()
      onToggleSelect()
      return
    }
    // Chọn và bắt đầu kéo trong cùng một thao tác, như PowerPoint.
    if (!selected && !grouped) onSelect()
    e.preventDefault()
    if (el.locked) return
    const frame = (e.currentTarget as HTMLElement).closest('.slide-frame') as HTMLElement | null
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const base = { x: el.x, y: el.y, w: el.w, h: elementHeight(el) }
    // đường gióng (kiểu Canva): mép/tâm của slide và của các phần tử khác, tính theo % khung
    const others = [...frame.querySelectorAll<HTMLElement>('[data-el-id]')]
      .filter((n) => n.dataset.elId !== el.id && !group.some((g) => g.id === n.dataset.elId))
      .map((n) => {
        const r = n.getBoundingClientRect()
        const l = ((r.left - rect.left) / rect.width) * 100
        const rr = ((r.right - rect.left) / rect.width) * 100
        const t = ((r.top - rect.top) / rect.height) * 100
        const b = ((r.bottom - rect.top) / rect.height) * 100
        return { xs: [l, (l + rr) / 2, rr], ys: [t, (t + b) / 2, b] }
      })
    if (mode === 'move') document.body.dataset.slideDrag = ''
    const snapXs = [0, 50, 100, ...others.flatMap((o) => o.xs)]
    const snapYs = [0, 50, 100, ...others.flatMap((o) => o.ys)]
    const startX = e.clientX
    const startY = e.clientY
    const MIN = 4
    onBeginHistory()
    // ảnh đang kéo đi qua khung ảnh nào (kiểu Canva): khung xem trước ảnh, thả ra thì ảnh vào khung
    const self = e.currentTarget as HTMLElement
    const canFill = mode === 'move' && el.type === 'image' && !!el.src && !photoFrameClip(el.shape)
    let frameId: string | null = null
    const hoverFrame = (id: string | null) => {
      if (id === frameId) return
      frameId = id
      self.style.opacity = id ? '0.25' : ''
      window.dispatchEvent(new CustomEvent(FRAME_HOVER, { detail: { id, src: el.src } }))
    }
    const move = (ev: PointerEvent) => {
      movedRef.current = true
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      if (mode === 'move' || !dir) {
        let x = base.x + dx
        let y = base.y + dy
        // hút vào đường gióng khi lệch dưới 5px; giữ Alt để đặt tự do
        const sx = ev.altKey ? null : snapTo(x, base.w, snapXs, (SNAP_PX / rect.width) * 100)
        const sy = ev.altKey ? null : snapTo(y, base.h, snapYs, (SNAP_PX / rect.height) * 100)
        if (sx) x += sx.d
        if (sy) y += sy.d
        showGuides({ x: sx?.at ?? null, y: sy?.at ?? null, gaps: gapsTo({ x, y, w: base.w, h: base.h }, others) })
        // kéo ra ngoài slide được (phần ngoài bị khung che), chỉ giữ lại một mép 3% để còn nắm kéo về
        x = clamp(x, 3 - base.w, 97)
        y = clamp(y, 3 - base.h, 97)
        if (group.length && onPreviewMany) {
          const patches: Record<string, Partial<SlideElement>> = { [el.id]: { x, y } }
          for (const g of group) patches[g.id] = { x: g.x + x - base.x, y: g.y + y - base.y }
          onPreviewMany(patches)
          return
        }
        onPreview({ x, y })
        if (canFill) {
          const hit = document
            .elementsFromPoint(ev.clientX, ev.clientY)
            .find((n): n is HTMLElement => n instanceof HTMLElement && !!n.dataset.frameId && n.dataset.frameId !== el.id)
          hoverFrame(hit?.dataset.frameId ?? null)
        }
        return
      }
      // Resize theo trục cục bộ của phần tử (không theo trục màn hình) để
      // phần tử đã xoay/lật vẫn bám đúng con trỏ và giữ cạnh đối diện đứng yên.
      const rad = ((el.rotation ?? 0) * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const moveX = ev.clientX - startX
      const moveY = ev.clientY - startY
      // chiếu delta màn hình vào hệ trục của hộp, rồi bỏ lật
      let localX = moveX * cos + moveY * sin
      let localY = -moveX * sin + moveY * cos
      const flipX = el.flipX ? -1 : 1
      const flipY = el.flipY ? -1 : 1
      if (flipX < 0) localX = -localX
      if (flipY < 0) localY = -localY

      const wPx = (base.w / 100) * rect.width
      const hPx = (base.h / 100) * rect.height
      const minW = (MIN / 100) * rect.width
      const minH = (MIN / 100) * rect.height
      let l = -wPx / 2
      let r = wPx / 2
      let t = -hPx / 2
      let b = hPx / 2
      if (dir.includes('w')) l = Math.min(l + localX, r - minW)
      if (dir.includes('e')) r = Math.max(r + localX, l + minW)
      if (dir.includes('n')) t = Math.min(t + localY, b - minH)
      if (dir.includes('s')) b = Math.max(b + localY, t + minH)
      // đồ hoạ kéo góc: khoá theo tỉ lệ thật của hình (hộp cũ bị vuông/méo cũng tự khớp lại)
      const ratio = el.type === 'graphic' && dir.length === 2 ? graphicById(el.graphicId)?.ratio : undefined
      if (ratio) {
        const fitH = (r - l) / ratio
        if (dir.includes('n')) t = b - fitH
        else b = t + fitH
      }

      const nextW = r - l
      const nextH = b - t
      // tâm hộp dời nửa delta cục bộ của hai cạnh đối diện; đổi về trục slide
      const shiftX = flipX * ((l + r) / 2)
      const shiftY = flipY * ((t + b) / 2)
      const cx = ((base.x + base.w / 2) / 100) * rect.width + shiftX * cos - shiftY * sin
      const cy = ((base.y + base.h / 2) / 100) * rect.height + shiftX * sin + shiftY * cos
      let nextXPct = ((cx - nextW / 2) / rect.width) * 100
      let nextYPct = ((cy - nextH / 2) / rect.height) * 100
      let nextWPct = (nextW / rect.width) * 100
      let nextHPct = (nextH / rect.height) * 100
      if (!el.rotation) {
        // phần tử chưa xoay: giữ hộp trong trang như trước
        nextWPct = Math.min(nextWPct, 100)
        nextHPct = Math.min(nextHPct, 100)
        nextXPct = clamp(nextXPct, 0, 100 - nextWPct)
        nextYPct = clamp(nextYPct, 0, 100 - nextHPct)
        // hút cạnh đang kéo vào đường gióng (góc khoá tỉ lệ thì bỏ — hút một trục sẽ làm lệch trục kia)
        if (!ev.altKey && !ratio && !(el.type === 'text' && dir.length === 2)) {
          const tolX = (SNAP_PX / rect.width) * 100
          const tolY = (SNAP_PX / rect.height) * 100
          let gx: number | null = null
          let gy: number | null = null
          if (dir.includes('w')) {
            const s = snapTo(nextXPct, 0, snapXs, tolX)
            if (s && nextWPct - s.d >= MIN) { nextXPct += s.d; nextWPct -= s.d; gx = s.at }
          } else if (dir.includes('e')) {
            const s = snapTo(nextXPct + nextWPct, 0, snapXs, tolX)
            if (s && nextWPct + s.d >= MIN) { nextWPct += s.d; gx = s.at }
          }
          if (dir.includes('n')) {
            const s = snapTo(nextYPct, 0, snapYs, tolY)
            if (s && nextHPct - s.d >= MIN) { nextYPct += s.d; nextHPct -= s.d; gy = s.at }
          } else if (dir.includes('s')) {
            const s = snapTo(nextYPct + nextHPct, 0, snapYs, tolY)
            if (s && nextHPct + s.d >= MIN) { nextHPct += s.d; gy = s.at }
          }
          showGuides({ x: gx, y: gy })
        }
      }
      const patch: Partial<SlideElement> = {
        x: nextXPct,
        y: nextYPct,
        w: nextWPct,
        h: nextHPct,
      }
      // Kéo góc hộp chữ (kiểu Canva): phóng chữ theo bề rộng, chiều cao lại bám nội dung —
      // trước đây góc bị coi như cạnh dưới nên chốt cứng chiều cao và thừa khoảng trống dưới chữ.
      if (el.type === 'text' && dir.length === 2) {
        const baseFont = el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)
        const ratio = nextW / wPx
        patch.fontSize = clamp(Number((baseFont * ratio).toFixed(2)), 0.8, 12)
        patch.fixedHeight = false
        // chữ và hộp phóng cùng tỉ lệ nên các dòng giữ nguyên chỗ xuống dòng: chiều cao nhân đúng tỉ lệ
        // (không lấy ước lượng — ước lượng cố tình dư để tránh tràn, chữ sát mép bị tính thành 2 dòng)
        patch.h = base.h * ratio
        onPreview(patch)
        return
      }
      // Hộp chữ mặc định bám theo nội dung; kéo cạnh trên/dưới là chốt chiều
      // cao thủ công, từ đó khung giữ đúng kích thước người dùng đặt.
      if (el.type === 'text' && (dir.includes('n') || dir.includes('s'))) {
        patch.fixedHeight = true
      }
      // Chữ co/giãn theo chiều cao hộp (như "shrink text on overflow" của
      // PowerPoint) — nếu không, thu nhỏ hộp sẽ cắt mất chữ.
      if (el.type === 'text' && (dir.includes('n') || dir.includes('s'))) {
        const baseFont = el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)
        const ratio = nextH / hPx
        patch.fontSize = clamp(Number((baseFont * ratio).toFixed(2)), 0.8, 12)
      }
      onPreview(patch)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      // chỉ chặn cú click sau khi kéo thật; bấm tại chỗ phải tới được onClick (vd chọn riêng một mục trong nhóm)
      if (movedRef.current) onDragEnd()
      showGuides({ x: null, y: null })
      delete document.body.dataset.slideDrag
      const target = frameId
      hoverFrame(null)
      if (target && el.src) onDropInFrame(target, el.src)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  // khung ảnh nghe ảnh trên slide đang kéo qua để xem trước
  const isFrame = el.type === 'image' && !!photoFrameClip(el.shape)
  useEffect(() => {
    if (!isFrame) return
    const on = (e: Event) => {
      const { id, src } = (e as CustomEvent<{ id: string | null; src: string }>).detail
      setDropPreview(id === el.id ? src : null)
    }
    window.addEventListener(FRAME_HOVER, on)
    return () => window.removeEventListener(FRAME_HOVER, on)
  }, [isFrame, el.id])

  const common = {
    style,
    'data-el-id': el.id,
    // Shift+bấm đã xử lý ở pointerdown; vừa kéo xong thì giữ nguyên vùng chọn (nhóm không bị thu về một)
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (formatPainterActive) {
        onPaintApply?.()
        return
      }
      if (!e.shiftKey && !movedRef.current) onSelect()
    },
    onPointerDown: (e: React.PointerEvent) => startDrag(e, 'move'),
    // chạy trước handler bấm đúp của từng loại (sửa chữ…): vào trong nhóm rồi mới sửa
    onDoubleClickCapture: grouped === 'soft' ? () => onSelectSingle?.() : undefined,
  }

  // sát mép dưới slide thì nút xoay không còn chỗ phía dưới (bị cắt) nên lật lên đỉnh;
  // phần tử phủ gần kín slide (không còn chỗ trên lẫn dưới) thì đặt nút xoay vào trong, sát đáy
  const bottomEdge = el.y + elementHeight(el) > 88
  const rotTop = bottomEdge && el.y > 10
  const rotInside = bottomEdge && !(el.y > 10)
  // khung slide cắt phần tràn ra ngoài: cạnh nào chạm mép slide thì tay nắm resize dời vào trong để còn kéo được
  const edgeH = elementHeight(el)
  const atL = el.x < 1.5
  const atR = el.x + el.w > 98.5
  const atT = el.y < 1.5
  const atB = el.y + edgeH > 98.5

  /** Xoay quanh tâm hộp; giữ Shift để bắt góc 15°. */
  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!selected) onSelect()
    const frame = (e.currentTarget as HTMLElement).closest('.slide-frame') as HTMLElement | null
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const cx = rect.left + ((el.x + el.w / 2) / 100) * rect.width
    const cy = rect.top + ((el.y + el.h / 2) / 100) * rect.height
    onBeginHistory()
    const move = (ev: PointerEvent) => {
      // tay nắm dưới đáy: con trỏ ở chính giữa phía dưới = 0° (−90); sát mép dưới slide thì tay nắm lật lên đỉnh (+90).
      const deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + (rotTop ? 90 : -90)
      const snapped = ev.shiftKey ? Math.round(deg / 15) * 15 : Math.round(deg)
      onPreview({ rotation: ((snapped % 360) + 360) % 360 })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      onDragEnd()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const handle = selected && el.locked ? (
    <span className="slide-el-lock" data-tip="Đã khoá" aria-label="Đã khoá">
      <Lock size={12} strokeWidth={2.2} />
    </span>
  ) : selected ? (
    <>
      {/* hộp chữ không có tay nắm trên/dưới (như Canva): chiều cao luôn ôm theo chữ */}
      {HANDLE_DIRS.filter((dir) => el.type !== 'text' || (dir !== 'n' && dir !== 's')).map((dir) => (
        <span
          key={dir}
          className={`slide-el-handle slide-el-handle--${dir}`}
          // tâm tay nắm nằm trên viền; sát mép slide (khung cắt overflow) thì đẩy hẳn vào trong
          style={{
            translate: `${dir.includes('w') ? (atL ? '0' : '-50%') : dir.includes('e') ? (atR ? '-100%' : '-50%') : '-50%'} ${
              dir.includes('n') ? (atT ? '0' : '-50%') : dir.includes('s') ? (atB ? '-100%' : '-50%') : '-50%'
            }`,
          }}
          onPointerDown={(e) => startDrag(e, 'resize', dir)}
        />
      ))}
      <span className={`slide-el-rotate${rotTop ? ' slide-el-rotate--top' : ''}${rotInside ? ' slide-el-rotate--in' : ''}`} data-tip="Xoay" onPointerDown={startRotate}>
        <RotateCw size={13} strokeWidth={2} />
      </span>
    </>
  ) : null

  const linkBadge = el.href ? (
    <span
      className="slide-el-link"
      data-tip={`Liên kết: ${el.href}`}
      aria-label={`Liên kết: ${el.href}`}
      onClick={(e) => {
        e.stopPropagation()
        if (formatPainterActive) onPaintApply?.()
        else if (!selected) onSelect()
      }}
    >
      <Link2 size={11} strokeWidth={2.2} />
    </span>
  ) : null

  const chrome = (
    <>
      {linkBadge}
      {handle}
    </>
  )

  if (el.type === 'text')
    return (
      <div
        {...common}
        style={{ ...style, cursor: formatPainterActive ? 'inherit' : selected && !editingText ? 'move' : 'default' }}
        onDoubleClick={() => {
          if (!formatPainterActive) onEditingText(true)
        }}
      >
        <AutoFitText
          locked={!editingText}
          focusOnMount={editingText}
          onDone={() => onEditingText(false)}
          value={el.text ?? ''}
          baseSize={el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)}
          weight={el.fontWeight ?? (el.variant === 'body' ? 500 : 600)}
          fontFamily={fontStack(
            el.fontFamily ?? (el.variant === 'body' ? theme.fonts.body : theme.fonts.heading),
          )}
          fontStyle={el.fontStyle}
          textDecoration={el.textDecoration}
          align={el.align}
          color={el.textColor ?? theme.fg}
          lineHeight={el.lineHeight}
          letterSpacing={el.letterSpacing}
          background={el.fill}
          highlight={el.highlight}
          valign={el.valign === 'middle' || el.fill ? 'middle' : 'top'}
          onChange={(text) => onChange({ text })}
        />
        {chrome}
      </div>
    )

  if (el.type === 'icon') {
    return el.assetId ? (
      <div {...common} style={{ ...style, opacity: el.opacity, color: el.textColor ?? theme.accent, cursor: formatPainterActive ? 'inherit' : selected ? 'move' : 'default' }}>
        <SlideIcon id={el.assetId} className="h-full w-full p-[2%]" />
        {chrome}
      </div>
    ) : null
  }

  if (el.type === 'connector') {
    return (
      <div {...common} style={{ ...style, cursor: formatPainterActive ? 'inherit' : selected ? 'move' : 'default' }}>
        <ConnectorSvg el={el} theme={theme} />
        {chrome}
      </div>
    )
  }

  if (el.type === 'graphic') {
    if (!el.graphicId || !graphicById(el.graphicId)) return null
    return (
      <div {...common} style={{ ...style, opacity: el.opacity, cursor: formatPainterActive ? 'inherit' : selected ? 'move' : 'default' }}>
        <GraphicFill
          className={`h-full w-full ${graphicById(el.graphicId)?.category === 'ornament' ? '' : 'p-[2%]'}`}
          id={el.graphicId}
          ink={el.textColor ?? theme.fg}
          fill={el.fill}
        />
        {chrome}
      </div>
    )
  }

  if (el.type === 'shape')
    return (
      <div {...common} style={{ ...style, ...shapeCss(el, theme), ...(style.clipPath ? { clipPath: style.clipPath } : null) }} onDoubleClick={() => el.shape !== 'line' && !formatPainterActive && onEditingText(true)}>
        {shapeInner(el, theme)}
        {editingText && el.shape !== 'line' ? (
          <div style={{ position: 'absolute', inset: '10% 12%' }} onBlur={() => onEditingText(false)}>
            <AutoFitText
              value={el.text ?? ''}
              baseSize={el.fontSize ?? 2.4}
              weight={el.fontWeight ?? 600}
              fontFamily={fontStack(el.fontFamily ?? theme.fonts.body)}
              fontStyle={el.fontStyle}
              textDecoration={el.textDecoration}
              align={el.align ?? 'center'}
              color={el.textColor ?? readableTextOn(el.fill ?? theme.accent)}
              valign="middle"
              focusOnMount
              onChange={(text) => onChange({ text })}
            />
          </div>
        ) : (
          <ShapeText el={el} theme={theme} />
        )}
        {chrome}
      </div>
    )

  if (el.type === 'table') {
    const headerFg = readableTextOn(theme.accent)
    const rowCount = el.rows?.length ?? 0
    return (
      <div {...common}>
        <table
          className="h-full w-full"
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            border: `1px solid ${theme.muted}`,
            borderRadius: '0.8cqw',
            overflow: 'hidden',
            fontSize: '1.7cqw',
            color: theme.fg,
          }}
        >
          <tbody>
            {(el.rows ?? []).map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '0.5em 0.7em',
                      borderBottom:
                        ri < rowCount - 1 ? `1px solid ${theme.muted}` : undefined,
                      borderRight: ci < r.length - 1 ? `1px solid ${theme.muted}` : undefined,
                      background:
                        ri === 0 ? theme.accent : ri % 2 === 0 ? theme.surface : 'transparent',
                      color: ri === 0 ? headerFg : theme.fg,
                      fontWeight: ri === 0 ? 600 : 400,
                    }}
                  >
                    <MathCell
                      value={c}
                      onChange={(value) => {
                        const rows = (el.rows ?? []).map((row) => [...row])
                        rows[ri][ci] = value
                        onChange({ rows })
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {chrome}
      </div>
    )
  }

  if (el.type === 'chart')
    return (
      <div {...common}>
        <ChartView el={el} absolute={false} colors={theme.chart} />
        {chrome}
      </div>
    )

  if (el.type === 'video')
    return (
      <div {...common}>
        {/* bản soạn chỉ hiện ảnh bìa: iframe sẽ nuốt thao tác kéo/chọn */}
        <VideoView el={el} theme={theme} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        {chrome}
      </div>
    )

  if (el.type === 'image') {
    const parts = imageStyleParts(el, theme)
    const activeCrop = cropping ? (el.crop ?? coverCropOf(el.w, el.h, natSize)) : el.crop
    const isCropActive = cropping && !!el.src && !el.locked

    const startCropHandle = (e: React.PointerEvent, dir: ResizeDir) => {
      e.stopPropagation()
      e.preventDefault()
      if (el.locked) return
      const frame = (e.currentTarget as HTMLElement).closest('.slide-frame') as HTMLElement | null
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      const startX = e.clientX
      const startY = e.clientY
      const base = el.crop ?? coverCropOf(el.w, el.h, natSize)
      const visL0 = el.flipX ? base.r : base.l
      const visR0 = el.flipX ? base.l : base.r
      const visT0 = el.flipY ? base.b : base.t
      const visB0 = el.flipY ? base.t : base.b
      const fullW = (el.w * 100) / Math.max(10, 100 - visL0 - visR0)
      const fullH = (el.h * 100) / Math.max(10, 100 - visT0 - visB0)
      const fullX = el.x - (visL0 / 100) * fullW
      const fullY = el.y - (visT0 / 100) * fullH
      const hitW = (dir.includes('w') && !el.flipX) || (dir.includes('e') && !!el.flipX)
      const hitE = (dir.includes('e') && !el.flipX) || (dir.includes('w') && !!el.flipX)
      const hitN = (dir.includes('n') && !el.flipY) || (dir.includes('s') && !!el.flipY)
      const hitS = (dir.includes('s') && !el.flipY) || (dir.includes('n') && !!el.flipY)
      const minCropPctW = Math.max(10, (2 / Math.max(0.1, fullW)) * 100)
      const minCropPctH = Math.max(10, (2 / Math.max(0.1, fullH)) * 100)

      const move = (ev: PointerEvent) => {
        const dxPct = ((ev.clientX - startX) / rect.width) * 100
        const dyPct = ((ev.clientY - startY) / rect.height) * 100
        let visL = visL0
        let visR = visR0
        let visT = visT0
        let visB = visB0
        if (hitW) visL = clamp(visL0 + (dxPct / fullW) * 100, 0, Math.min(90, 100 - minCropPctW - visR))
        if (hitE) visR = clamp(visR0 - (dxPct / fullW) * 100, 0, Math.min(90, 100 - minCropPctW - visL))
        if (hitN) visT = clamp(visT0 + (dyPct / fullH) * 100, 0, Math.min(90, 100 - minCropPctH - visB))
        if (hitS) visB = clamp(visB0 - (dyPct / fullH) * 100, 0, Math.min(90, 100 - minCropPctH - visT))
        const l = Math.round((el.flipX ? visR : visL) * 100) / 100
        const r = Math.round((el.flipX ? visL : visR) * 100) / 100
        const t = Math.round((el.flipY ? visB : visT) * 100) / 100
        const b = Math.round((el.flipY ? visT : visB) * 100) / 100
        const x = fullX + (visL / 100) * fullW
        const y = fullY + (visT / 100) * fullH
        const w = (fullW * (100 - visL - visR)) / 100
        const h = (fullH * (100 - visT - visB)) / 100
        const isEmpty = l < 0.05 && t < 0.05 && r < 0.05 && b < 0.05
        onPreview({ x, y, w, h, crop: isEmpty ? undefined : { l, t, r, b } })
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        onDragEnd()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }

    const startCropPan = (e: React.PointerEvent) => {
      if (e.button !== 0 || el.locked) return
      e.stopPropagation()
      e.preventDefault()
      const frame = (e.currentTarget as HTMLElement).closest('.slide-frame') as HTMLElement | null
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      const startX = e.clientX
      const startY = e.clientY
      const base = el.crop ?? coverCropOf(el.w, el.h, natSize)
      const visL0 = el.flipX ? base.r : base.l
      const visR0 = el.flipX ? base.l : base.r
      const visT0 = el.flipY ? base.b : base.t
      const visB0 = el.flipY ? base.t : base.b
      const spanX = visL0 + visR0
      const spanY = visT0 + visB0
      if (spanX < 0.05 && spanY < 0.05) return
      const fullW = (el.w * 100) / Math.max(10, 100 - spanX)
      const fullH = (el.h * 100) / Math.max(10, 100 - spanY)
      const move = (ev: PointerEvent) => {
        const dxPct = ((ev.clientX - startX) / rect.width) * 100
        const dyPct = ((ev.clientY - startY) / rect.height) * 100
        const visL = clamp(visL0 - (dxPct / fullW) * 100, 0, spanX)
        const visR = spanX - visL
        const visT = clamp(visT0 - (dyPct / fullH) * 100, 0, spanY)
        const visB = spanY - visT
        const l = Math.round((el.flipX ? visR : visL) * 100) / 100
        const r = Math.round((el.flipX ? visL : visR) * 100) / 100
        const t = Math.round((el.flipY ? visB : visT) * 100) / 100
        const b = Math.round((el.flipY ? visT : visB) * 100) / 100
        onPreview({ crop: { l, t, r, b } })
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        onDragEnd()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }

    const inner = (
      <div
        data-frame-id={isFrame ? el.id : undefined}
        style={{
          position: 'relative',
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          borderRadius: parts.polygonBorder ? 0 : parts.borderRadius,
          clipPath: parts.frameRadius ? undefined : parts.clip,
          border: parts.cssBorder,
        }}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('Files') && !e.dataTransfer.types.includes('text/uri-list')) return
          e.preventDefault()
          if (dropPreview === null) setDropPreview(dragImage.src)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropPreview(null)
        }}
        onDrop={(e) => {
          setDropPreview(null)
          // kéo ảnh (file từ máy hoặc ảnh ở tab Tải lên) thả vào khung: ảnh tự cover rồi cắt theo khung
          const file = e.dataTransfer.files[0]
          const url = e.dataTransfer.getData('text/uri-list')
          if (!file?.type.startsWith('image/') && !url) return
          e.preventDefault()
          e.stopPropagation()
          if (!file) return onChange({ src: url, crop: undefined })
          const reader = new FileReader()
          reader.onload = () => {
            const data = String(reader.result)
            uploadImage(data)
              .then((src) => onChange({ src, crop: undefined }))
              .catch(() => onChange({ src: data, crop: undefined }))
          }
          reader.readAsDataURL(file)
        }}
        className={cn(
          'flex items-center justify-center overflow-hidden',
          el.src || parts.clip || parts.cssBorder
            ? ''
            : 'border-2 border-dashed border-[#9ca3af] text-[1.8cqw] text-[#6b7280]',
        )}
      >
        {dropPreview !== null ? (
          // xem trước khi kéo ảnh qua khung (file từ máy chưa đọc được thì làm mờ ảnh hiện có)
          <img
            src={dropPreview || el.src || FRAME_PLACEHOLDER}
            alt=""
            className={cn('pointer-events-none h-full w-full object-cover', dropPreview ? '' : 'opacity-60')}
          />
        ) : el.src ? (
          <img
            src={el.src}
            alt=""
            style={imageImgStyle(el.crop)}
            onLoad={(e) => setNatSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            onDoubleClick={() => {
              // ảnh vẽ bằng công cụ Đồ thị: nhấp đúp mở lại modal để sửa
              const doc = readToolDoc(el.src)
              if (doc) setPlotEdit(doc)
            }}
          />
        ) : parts.clip ? (
          <img src={FRAME_PLACEHOLDER} alt="" className="pointer-events-none h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 px-1 text-center">
            <label className="cursor-pointer hover:underline">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    uploadImage(String(reader.result))
                      .then((src) => onChange({ src, crop: undefined }))
                      .catch((err) => setImageError(err instanceof Error ? err.message : String(err)))
                  }
                  reader.readAsDataURL(file)
                }}
              />
              Chọn ảnh
            </label>
            <button
              type="button"
              disabled={imageBusy}
              onClick={async (e) => {
                e.stopPropagation()
                setImageBusy(true)
                setImageError(null)
                try {
                  await onGenerateImage()
                } catch (err) {
                  setImageError(err instanceof Error ? err.message : String(err))
                } finally {
                  setImageBusy(false)
                }
              }}
              className="rounded border border-clay/60 px-1.5 py-0.5 text-[1.5cqw] font-semibold text-clay disabled:opacity-60"
            >
              {imageBusy ? 'Đang tạo ảnh…' : 'Tạo ảnh AI'}
            </button>
            {imageError ? (
              <span className="max-w-full truncate text-[1.3cqw] text-red-500" data-tip={imageError}>
                Lỗi tạo ảnh
              </span>
            ) : null}
          </div>
        )}
      </div>
    )

    return (
      <div
        {...common}
        onPointerDown={isCropActive ? startCropPan : common.onPointerDown}
        style={{
          ...style,
          cursor: isCropActive ? 'move' : undefined,
        }}
        className="group/frame"
      >
        {/* Khi đang cắt ảnh: hiện toàn bộ ảnh gốc làm mờ phía sau để người dùng căn vùng giữ lại */}
        {isCropActive && (
          <img
            src={el.src}
            alt=""
            style={{
              ...imageImgStyle(activeCrop),
              opacity: 0.34,
              filter: 'brightness(0.72)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
        {/* Wrapper bóng đổ đặt ngoài clipPath/overflow-hidden để drop-shadow bám đúng mép bo góc/khung hình */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            opacity: el.opacity,
            filter: parts.shadowFilter,
          }}
        >
          {parts.polygonBorder ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                clipPath: parts.clip,
                background: parts.borderColor,
                padding: `max(1px, ${parts.borderW / 10}cqw)`,
              }}
            >
              {inner}
            </div>
          ) : (
            inner
          )}
        </div>
        {isFrame && !isCropActive && (
          // nút chọn file nằm ngoài lớp cắt để khung tim/sao… không cắt mất; khung vẫn nhận kéo-thả
          <label className="absolute bottom-[6%] left-1/2 z-10 -translate-x-1/2 cursor-pointer whitespace-nowrap rounded-full bg-white/95 px-[1.2cqw] py-[0.45cqw] text-[1.35cqw] font-semibold text-ink opacity-0 shadow transition-opacity group-hover/frame:opacity-100">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const data = String(reader.result)
                  uploadImage(data)
                    .then((src) => onChange({ src, crop: undefined }))
                    .catch(() => onChange({ src: data, crop: undefined }))
                }
                reader.readAsDataURL(file)
              }}
            />
            {el.src ? 'Đổi ảnh' : 'Chọn ảnh'}
          </label>
        )}
        {isCropActive
          ? HANDLE_DIRS.map((dir) => (
              <span
                key={dir}
                className={`slide-crop-handle slide-crop-handle--${dir}`}
                onPointerDown={(e) => startCropHandle(e, dir)}
              />
            ))
          : chrome}
        {plotModal}
      </div>
    )
  }

  return null
}
