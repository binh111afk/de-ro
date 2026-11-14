/** Slide — phần sửa trực tiếp trên khung: kéo / đổi cỡ / xoay, đường gióng bắt dính, thanh nhóm. */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { svgDataUrl } from '@/lib/plot'
import { readToolDoc, type ToolDoc } from '@/lib/toolSpec'
import { ToolModal } from './tools/ToolModal'
import { FRAME_PLACEHOLDER, dragImage, photoFrameClip } from '@/lib/slideShapes'
import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceAround, AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceAround, RotateCw, Trash2 } from 'lucide-react'
import { type AlignMode } from '@/lib/slideAlign'
import { slideIconById } from '@/lib/slideIconLibrary'
import { graphicById, graphicMarkup } from '@/lib/slideGraphics'
import { cn } from '@/lib/cn'
import type { SlideElement } from '@/store/docs'
import { elementHeight } from '@/lib/slideText'
import { readableTextOn, type ResolvedTheme } from '@/lib/slideTheme'
import { uploadImage } from '@/lib/mediaStore'
import { MathCell, clamp } from './SlideEditor'
import { fontStack, ConnectorSvg, shapeCss, isHollowShape, HOLLOW_HIT, shapeInner, ShapeText, ChartView, AutoFitText } from './slideRender'

export const FRAME_HOVER = 'slide-frame-hover'

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

export function GroupToolbar({ els, onAlign, onDelete }: { els: SlideElement[]; onAlign: (mode: AlignMode) => void; onDelete: () => void }) {
  const top = Math.min(...els.map((e) => e.y))
  const bottom = Math.max(...els.map((e) => e.y + elementHeight(e)))
  const above = top > 12
  return (
    <div
      className="slide-sel-toolbar absolute left-1/2 z-[51] flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_16px_-4px_rgba(35,32,28,0.25)]"
      style={above ? { top: `calc(${top}% - 44px)` } : { top: `calc(${Math.min(bottom, 100)}% + 8px)` }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="whitespace-nowrap px-1.5 text-[12px] font-medium text-ink/60">{els.length} mục</span>
      {GROUP_ACTIONS.map(({ mode, label, Icon, min }, i) => (
        <button
          key={mode}
          type="button"
          data-tip={min && els.length < min ? `${label} (cần chọn từ ${min} mục)` : label}
          aria-label={label}
          disabled={!!min && els.length < min}
          className={cn('grid size-7 place-items-center rounded-md text-ink hover:bg-black/5 disabled:opacity-35 disabled:hover:bg-transparent', (i === 3 || i === 6) && 'ml-1.5')}
          onClick={() => onAlign(mode)}
        >
          <Icon size={16} strokeWidth={1.8} />
        </button>
      ))}
      <button type="button" data-tip="Xoá các mục đã chọn" aria-label="Xoá các mục đã chọn" className="ml-1.5 grid size-7 place-items-center rounded-md text-ink hover:bg-black/5" onClick={onDelete}>
        <Trash2 size={16} strokeWidth={1.8} />
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
export function snapTo(pos: number, size: number, targets: number[], tol: number) {
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
  grouped = false,
  group = [],
  onToggleSelect,
  onPreviewMany,
}: {
  el: SlideElement
  theme: ResolvedTheme
  selected: boolean
  onSelect: () => void
  /** nằm trong nhóm chọn nhiều: chỉ viền, không tay nắm */
  grouped?: boolean
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
}) {
  const movedRef = useRef(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
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
    outline: selected || grouped ? '2px solid #b4532a' : undefined,
    outlineOffset: selected || grouped ? 0 : undefined,
    // khung viền rỗng (nền trong suốt, vd khung trang trí của bộ thiết kế phủ gần cả slide):
    // chỉ nhận chuột ở dải viền, kẻo bấm vào vùng trống hay sát mép lại chọn nhầm cả khung to
    clipPath: isHollowShape(el) && !selected && !grouped ? HOLLOW_HIT : undefined,
    touchAction: editingText ? 'auto' : 'none',
  }

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize', dir?: ResizeDir) => {
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
      onDragEnd()
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
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); if (!e.shiftKey && !movedRef.current) onSelect() },
    onPointerDown: (e: React.PointerEvent) => startDrag(e, 'move'),
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

  const handle = selected ? (
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

  if (el.type === 'text')
    return (
      <div {...common} style={{ ...style, cursor: selected && !editingText ? 'move' : 'default' }} onDoubleClick={() => onEditingText(true)}>
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
          valign={el.valign === 'middle' || el.fill ? 'middle' : 'top'}
          onChange={(text) => onChange({ text })}
        />
        {handle}
      </div>
    )

  if (el.type === 'icon') {
    const Icon = slideIconById(el.assetId)
    return Icon ? (
      <div {...common} style={{ ...style, opacity: el.opacity, color: el.textColor ?? theme.accent, cursor: selected ? 'move' : 'default' }}>
        <Icon size="100%" weight="duotone" className="h-full w-full p-[2%]" />
        {handle}
      </div>
    ) : null
  }

  if (el.type === 'connector') {
    return (
      <div {...common} style={{ ...style, cursor: selected ? 'move' : 'default' }}>
        <ConnectorSvg el={el} theme={theme} />
        {handle}
      </div>
    )
  }

  if (el.type === 'graphic') {
    if (!el.graphicId || !graphicById(el.graphicId)) return null
    return (
      <div {...common} style={{ ...style, opacity: el.opacity, cursor: selected ? 'move' : 'default' }}>
        <div
          className={`h-full w-full ${graphicById(el.graphicId)?.category === 'ornament' ? '' : 'p-[2%]'}`}
          dangerouslySetInnerHTML={{ __html: graphicMarkup(el.graphicId, el.textColor ?? theme.fg, el.fill) }}
        />
        {handle}
      </div>
    )
  }

  if (el.type === 'shape')
    return (
      <div {...common} style={{ ...style, ...shapeCss(el, theme), ...(style.clipPath ? { clipPath: style.clipPath } : null) }} onDoubleClick={() => el.shape !== 'line' && onEditingText(true)}>
        {shapeInner(el, theme)}
        {editingText && el.shape !== 'line' ? (
          <div style={{ position: 'absolute', inset: '10% 12%' }} onBlur={() => onEditingText(false)}>
            <AutoFitText
              value={el.text ?? ''}
              baseSize={el.fontSize ?? 2.4}
              weight={el.fontWeight ?? 600}
              fontFamily={fontStack(el.fontFamily ?? theme.fonts.body)}
              fontStyle={el.fontStyle}
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
        {handle}
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
        {handle}
      </div>
    )
  }

  if (el.type === 'chart')
    return (
      <div {...common}>
        <ChartView el={el} absolute={false} colors={theme.chart} />
        {handle}
      </div>
    )

  if (el.type === 'image')
    return (
      <div {...common} className="group/frame">
        {/* ô cắt (bo góc/elip) tách khỏi khung ngoài để tay nắm resize và xoay không bị overflow-hidden cắt mất */}
        <div
          data-frame-id={isFrame ? el.id : undefined}
          style={{ clipPath: photoFrameClip(el.shape) }}
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
            if (!file) return onChange({ src: url })
            const reader = new FileReader()
            reader.onload = () => {
              const data = String(reader.result)
              onChange({ src: data })
              uploadImage(data)
                .then((src) => onChange({ src }))
                .catch(() => {})
            }
            reader.readAsDataURL(file)
          }}
          className={cn(
            'flex h-full w-full items-center justify-center overflow-hidden',
            photoFrameClip(el.shape) ? '' : 'rounded-[1cqw]',
            el.src || photoFrameClip(el.shape)
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
            className="h-full w-full object-cover"
            onDoubleClick={() => {
              // ảnh vẽ bằng công cụ Đồ thị: nhấp đúp mở lại modal để sửa
              const doc = readToolDoc(el.src)
              if (doc) setPlotEdit(doc)
            }}
          />
        ) : photoFrameClip(el.shape) ? (
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
                      .then((src) => onChange({ src }))
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
        {isFrame && (
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
                  onChange({ src: data })
                  uploadImage(data).then((src) => onChange({ src })).catch(() => {})
                }
                reader.readAsDataURL(file)
              }}
            />
            {el.src ? 'Đổi ảnh' : 'Chọn ảnh'}
          </label>
        )}
        {handle}
        {plotModal}
      </div>
    )

  return null
}
