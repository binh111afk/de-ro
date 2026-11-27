/**
 * Chuyển trang Morph: ghép phần tử giữa hai slide liền nhau rồi tính đường đi. Thuần dữ liệu
 * (không có DOM); phần vẽ ở examEditor/SlideMorph.tsx.
 */
import type { Slide, SlideElement } from '@/store/docs'
import { isHeld, renumber, startOf, withoutAnim } from './slideAnim'

const json = (value: unknown) => JSON.stringify(value) ?? ''

/** cùng nội dung: chữ, ảnh, hình… giống nhau (vị trí, cỡ, màu có thể khác) */
const CONTENT = ['type', 'text', 'src', 'graphicId', 'assetId', 'shape', 'rows', 'chart'] as const
const sameContent = (a: SlideElement, b: SlideElement) => CONTENT.every((key) => json(a[key]) === json(b[key]))

/** thứ không làm đổi mặt ngoài (hoặc đã được diễn bằng đường đi) */
const MOTION = new Set(['id', 'x', 'y', 'w', 'h', 'rotation', 'zIndex', 'step', 'lineStep', 'anim', 'animMs', 'groupId', 'locked', 'decor', 'fixedHeight'])

/** nhìn y hệt → chỉ cần di chuyển; khác → vừa đi vừa chuyển mờ từ bản cũ sang bản mới */
export function sameLook(a: SlideElement, b: SlideElement): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof SlideElement>
  // cỡ chữ của hộp chữ thường được diễn bằng phóng to; chữ trong hình thì không
  const scaled = movesAsText(b)
  return [...keys].every((key) => MOTION.has(key) || (key === 'fontSize' && scaled) || json(a[key]) === json(b[key]))
}

/** để nhận ra "cùng một vật" khi mã khác nhau (chép dán, bài nhân bản từ trước) */
function contentKey(el: SlideElement): string | null {
  const value =
    el.text?.trim() ||
    el.src ||
    el.graphicId ||
    el.assetId ||
    (el.rows && json(el.rows)) ||
    (el.chart && json(el.chart)) ||
    (el.type === 'shape' ? [el.shape, el.fill, el.w, el.h].join() : '')
  return value ? `${el.type}|${value}` : null
}

/** id phần tử slide sau → phần tử slide trước sẽ biến thành nó. Ưu tiên trùng mã, rồi trùng nội dung. */
export function matchMorph(from: SlideElement[], to: SlideElement[]): Map<string, SlideElement> {
  const pairs = new Map<string, SlideElement>()
  const used = new Set<SlideElement>()
  const take = (el: SlideElement, test: (candidate: SlideElement) => boolean) => {
    if (pairs.has(el.id)) return
    const hit = from.find((c) => !used.has(c) && c.type === el.type && test(c))
    if (!hit) return
    pairs.set(el.id, hit)
    used.add(hit)
  }
  for (const el of to) take(el, (c) => c.id === el.id)
  for (const el of to) {
    const key = contentKey(el)
    if (key) take(el, (c) => contentKey(c) === key)
  }
  return pairs
}

/**
 * Deck dùng khi trình chiếu: ở slide Morph, phần giữ nguyên nội dung từ slide trước thì đã hiện rồi,
 * không bắt bấm lại (đáp án / kết luận vẫn chờ bấm).
 */
export function settleDeck(slides: Slide[]): Slide[] {
  const out: Slide[] = []
  for (const slide of slides) {
    const prev = out[out.length - 1]
    if (!prev || slide.transition !== 'morph' || slide.html || prev.html) {
      out.push(slide)
      continue
    }
    const pairs = matchMorph(prev.elements, slide.elements)
    const elements = slide.elements.map((el) => {
      const from = pairs.get(el.id)
      return from && startOf(el) !== undefined && !isHeld(el) && sameContent(from, el) ? withoutAnim(el) : el
    })
    out.push({ ...slide, elements: renumber(elements) })
  }
  return out
}

/** chữ đi bằng transform (đổi bề rộng thật sẽ ngắt dòng lại giữa chừng); thứ khác đổi vị trí + cỡ thật */
export const movesAsText = (el: SlideElement) => el.type === 'text' && !el.textArc

const fontSize = (el: SlideElement) => el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)

/** điểm chữ bám vào (đã trừ lề trong của hộp chữ, slideRender): theo canh lề nên đổi bề rộng hộp không làm chữ trôi */
function anchor(el: SlideElement, like: SlideElement, rotated: boolean): [number, number] {
  // lề trong tính theo % bề rộng slide 16:9
  const side = el.fill ? 3 : 1
  const x = rotated || like.align === 'center' ? el.x + el.w / 2 : like.align === 'right' ? el.x + el.w - side : el.x + side
  const y = rotated || like.fill || like.valign === 'middle' ? el.y + el.h / 2 : el.y + 16 / 9
  return [x, y]
}

/** góc quay ngắn nhất từ `a` tới `b` */
const turn = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180

/** Transform để lớp phủ cả slide đang vẽ `on` trông như đang ở chỗ của `other`. */
export function textShift(on: SlideElement, other: SlideElement) {
  const rotated = Boolean(on.rotation || other.rotation)
  const [x, y] = anchor(on, on, rotated)
  const [ox, oy] = anchor(other, on, rotated)
  const round = (n: number) => Math.round(n * 1000) / 1000
  return {
    origin: `${round(x)}% ${round(y)}%`,
    translate: `${round(ox - x)}% ${round(oy - y)}%`,
    scale: fontSize(other) / fontSize(on),
    rotate: `${turn(on.rotation ?? 0, other.rotation ?? 0)}deg`,
  }
}

/** vị trí + cỡ của `other`, và độ lệch góc so với `on` */
export const boxShift = (on: SlideElement, other: SlideElement) => ({
  left: `${other.x}%`,
  top: `${other.y}%`,
  width: `${other.w}%`,
  height: `${other.h}%`,
  rotate: `${turn(on.rotation ?? 0, other.rotation ?? 0)}deg`,
})
