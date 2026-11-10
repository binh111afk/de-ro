/**
 * Chữ phải đọc được trên màu nền NGAY DƯỚI nó, không phải nền chung của bộ màu.
 * Nền dưới chữ = ô tô màu của chính chữ, nếu không thì hình khối đặc nằm dưới
 * (vẽ trước) che tâm khung chữ, nếu không nữa thì nền slide. Tương phản dưới 3:1
 * (mức WCAG cho chữ lớn) thì thay bằng mực đậm hoặc trắng.
 * Chỉ đổi lúc vẽ, không ghi vào dữ liệu bài.
 */
import type { Slide, SlideElement } from '@/store/docs'
import { contrastRatio, readableTextOn } from './slideTheme'

const MIN_RATIO = 3

/** màu đặc dạng #rgb / #rrggbb; gradient thì lấy mã hex đầu tiên; còn lại (trong suốt, rgba…) bỏ qua */
function solidHex(css: string | undefined): string | null {
  if (!css) return null
  const m = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i.exec(css)
  if (!m) return null
  // #rrggbbaa / rgba thì không tính là đặc
  if (/^#[0-9a-f]{8}$/i.test(css.trim())) return null
  return m[0]
}

const order = (els: SlideElement[]) =>
  els.map((el, i) => ({ el, i })).sort((a, b) => (a.el.zIndex ?? 0) - (b.el.zIndex ?? 0) || a.i - b.i)

function bgUnder(el: SlideElement, below: SlideElement[], slideBg: string): string {
  const own = solidHex(el.fill)
  if (own) return own
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  for (let k = below.length - 1; k >= 0; k--) {
    const s = below[k]
    if (s.type !== 'shape' || s.shape === 'line' || (s.opacity ?? 1) < 0.6) continue
    if (cx < s.x || cx > s.x + s.w || cy < s.y || cy > s.y + s.h) continue
    const fill = solidHex(s.fill)
    if (fill) return fill
  }
  return slideBg
}

/** Bản sao danh sách phần tử, chữ khó đọc được đổi `textColor`; thứ tự giữ nguyên. */
export function readableElements(slide: Slide, theme: { fg: string; bg: string }): SlideElement[] {
  const slideBg = solidHex(slide.background) ?? solidHex(theme.bg) ?? '#ffffff'
  const sorted = order(slide.elements)
  const fixed = new Map<string, string>()
  sorted.forEach(({ el }, idx) => {
    if (el.type !== 'text') return
    const color = solidHex(el.textColor ?? theme.fg)
    if (!color) return
    const bg = bgUnder(el, sorted.slice(0, idx).map((x) => x.el), slideBg)
    if (contrastRatio(color, bg) >= MIN_RATIO) return
    const alt = contrastRatio(theme.fg, bg) >= MIN_RATIO ? theme.fg : readableTextOn(bg)
    fixed.set(el.id, alt)
  })
  if (!fixed.size) return slide.elements
  return slide.elements.map((el) => (fixed.has(el.id) ? { ...el, textColor: fixed.get(el.id) } : el))
}
