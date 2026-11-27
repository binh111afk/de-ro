/**
 * Hiệu ứng "bấm chuột rồi hiện" khi trình chiếu. Layout engine đặt tên phần tử theo vai trò
 * (`card-2-heading`, `step-3`, `answer`…) nên nhóm bấm-chuột suy ra thẳng từ id — AI không phải sinh gì thêm.
 * Phần tử không thuộc nhóm nào (tiêu đề, nền, họa tiết) hiện sẵn.
 */
import type { Slide, SlideElement } from '@/store/docs'

type Anim = NonNullable<SlideElement['anim']>

/** tư thế lúc còn ẩn của từng hiệu ứng (translate / scale / rotate tách khỏi transform xoay của phần tử) */
export const HIDDEN_POSE: Record<Anim, { translate?: string; scale?: string; rotate?: string }> = {
  fade: {},
  rise: { translate: '0 2.4cqw' },
  drop: { translate: '0 -2.4cqw' },
  left: { translate: '-6cqw 0' },
  right: { translate: '6cqw 0' },
  zoom: { scale: '0.8' },
  spin: { rotate: '-90deg', scale: '0.6' },
}

const NUMBERED = /^(card|stat|step|item|node|pill|link|divider|left|right)-(\d+)/
const ANSWER = new Set(['answer-bar', 'answer-stripe', 'answer'])
const CONCLUSION = new Set(['conclusion-bar', 'conclusion'])
const SINGLE = new Set(['subtitle', 'author', 'body', 'body-2', 'bullets'])
const COMPARE_LEFT = new Set(['left-panel', 'left-title', 'body'])
const COMPARE_RIGHT = new Set(['right-panel', 'right-title', 'body-2', 'vs-badge', 'mark'])
const ZOOM = new Set(['stat', 'node', 'pill'])

/** khoá nhóm: cùng khoá → cùng một lần bấm; null = hiện sẵn */
function unitOf(el: SlideElement, layoutId: string): { key: string; anim: Anim } | null {
  if (layoutId === 'comparison') {
    if (COMPARE_LEFT.has(el.id)) return { key: 'left', anim: 'rise' }
    if (COMPARE_RIGHT.has(el.id)) return { key: 'right', anim: 'rise' }
  }
  const m = NUMBERED.exec(el.id)
  if (m) {
    const side = m[1] === 'left' || m[1] === 'right' ? m[1] : ''
    return { key: side + m[2], anim: ZOOM.has(m[1]) ? 'zoom' : m[1] === 'link' ? 'fade' : 'rise' }
  }
  if (ANSWER.has(el.id)) return { key: 'answer', anim: 'zoom' }
  if (CONCLUSION.has(el.id)) return { key: 'conclusion', anim: 'rise' }
  if (SINGLE.has(el.id) || el.type === 'table' || el.type === 'chart') return { key: el.id, anim: 'fade' }
  return null
}

const lineCount = (el: SlideElement) => (el.text ?? '').split('\n').length

export function clearAnimation(elements: SlideElement[]): SlideElement[] {
  return elements.map((el) => {
    const copy = { ...el }
    delete copy.step
    delete copy.lineStep
    delete copy.anim
    delete copy.animMs
    return copy
  })
}

/** Gán thứ tự bấm theo thứ tự xuất hiện của phần tử (layout engine xếp theo thứ tự đọc). */
export function autoAnimate(elements: SlideElement[], layoutId: string): SlideElement[] {
  const ranks = new Map<string, number>()
  let next = 1
  return clearAnimation(elements).map((el, i) => {
    // mỗi gạch đầu dòng một lần bấm; nội dung dòng vẫn nằm trong MỘT hộp nên cỡ chữ/bố cục không đổi
    if (el.id === 'bullets' && el.type === 'text' && lineCount(el) > 1) {
      const lineStep = next
      next += lineCount(el)
      return { ...el, lineStep, anim: 'rise' as const }
    }
    const unit = unitOf(elements[i], layoutId)
    if (!unit) return el
    if (!ranks.has(unit.key)) ranks.set(unit.key, next++)
    return { ...el, step: ranks.get(unit.key), anim: unit.anim }
  })
}

/** Số lần bấm cần để hiện hết slide (0 = slide không có hiệu ứng). */
export function slideSteps(elements: SlideElement[]): number {
  return elements.reduce(
    (max, el) => Math.max(max, el.step ?? 0, el.lineStep ? el.lineStep + lineCount(el) - 1 : 0),
    0,
  )
}

/* ---------- hiệu ứng cả trang (bảng Hiệu ứng) ---------- */

/** `auto`: tự chạy khi sang slide (`Slide.pageAnim`); `click`: bấm từng phần (`step` trên phần tử) */
export type PageMode = 'auto' | 'click'
type PageSlide = Pick<Slide, 'elements' | 'layout' | 'pageAnim' | 'transition'>

const DEFAULT_MS = 450
const hasClicks = (elements: SlideElement[]) => elements.some((el) => startOf(el) !== undefined)
export const withoutAnim = (el: SlideElement) => clearAnimation([el])[0]
/** phần phải bấm mới hiện kể cả khi cả trang tự chạy: đáp án và kết luận */
export const isHeld = (el: SlideElement) => ANSWER.has(el.id) || CONCLUSION.has(el.id)
/** các mảnh của cùng một thẻ / nhóm vào cùng lúc */
function unitKey(el: SlideElement): string {
  if (el.groupId) return el.groupId
  const m = NUMBERED.exec(el.id)
  return m ? (m[1] === 'left' || m[1] === 'right' ? m[1] : '') + m[2] : el.id
}

export function pageState(slide: PageSlide): { mode: PageMode | null; anim: Anim | 'none' | null; ms: number } {
  if (slide.pageAnim) return { mode: 'auto', anim: slide.pageAnim.anim, ms: slide.pageAnim.ms ?? DEFAULT_MS }
  const stepped = slide.elements.filter((el) => startOf(el) !== undefined)
  if (!stepped.length) return { mode: null, anim: 'none', ms: DEFAULT_MS }
  const first = stepped[0].anim ?? 'fade'
  // `anim: null` = mỗi phần một kiểu
  return { mode: 'click', anim: stepped.every((el) => (el.anim ?? 'fade') === first) ? first : null, ms: stepped[0].animMs ?? DEFAULT_MS }
}

/** bấm từng phần: bài dựng theo bố cục dùng thứ tự của bố cục; slide tự làm thì mỗi khối một lần bấm */
function clickEach(slide: PageSlide): SlideElement[] {
  if (slide.layout) {
    const auto = autoAnimate(slide.elements, slide.layout)
    if (hasClicks(auto)) return auto
  }
  const ranks = new Map<string, number>()
  return clearAnimation(slide.elements).map((el) => {
    if (el.decor || el.variant === 'title' || el.id === 'title' || el.id === 'question') return el
    const key = unitKey(el)
    if (!ranks.has(key)) ranks.set(key, ranks.size + 1)
    return { ...el, step: ranks.get(key), anim: 'fade' as const }
  })
}

/** Đặt hiệu ứng cho cả trang. `anim: null` (chỉ ở chế độ bấm) = giữ kiểu mặc định của từng phần. */
export function setPageAnim<S extends PageSlide>(slide: S, anim: Anim | 'none' | null, mode: PageMode, ms = DEFAULT_MS): S {
  if (anim === 'none') return { ...slide, pageAnim: undefined, elements: clearAnimation(slide.elements) }
  const time = ms === DEFAULT_MS ? undefined : ms
  if (mode === 'auto') {
    const answers = autoAnimate(slide.elements, slide.layout ?? 'bullets').map((el) => (isHeld(el) ? el : withoutAnim(el)))
    return { ...slide, pageAnim: { anim: anim ?? 'rise', ms: time }, elements: renumber(answers) }
  }
  const elements = clickEach(slide).map((el) =>
    startOf(el) === undefined ? el : { ...el, ...(anim ? { anim } : {}), ...(time ? { animMs: time } : {}) },
  )
  return { ...slide, pageAnim: undefined, elements }
}

export const clearSlideAnim = <S extends PageSlide>(slide: S): S => ({
  ...slide,
  pageAnim: undefined,
  transition: 'none' as const,
  elements: clearAnimation(slide.elements),
})

/** Dựng lại phần tử (đổi bộ màu, tông, nội dung) mà giữ lựa chọn hiệu ứng đang có. */
export function keepAnim(before: PageSlide, next: SlideElement[]): SlideElement[] {
  const old = new Map(before.elements.map((el) => [el.id, el]))
  // phần tử mới chỉ nhận hiệu ứng mặc định khi slide đang chạy kiểu bấm
  const fresh = hasClicks(before.elements) && !before.pageAnim
  return renumber(
    next.map((el) => {
      const prev = old.get(el.id)
      if (!prev) return fresh ? el : withoutAnim(el)
      const { step, lineStep, anim, animMs } = prev
      return {
        ...withoutAnim(el),
        ...(step !== undefined ? { step } : {}),
        ...(lineStep !== undefined ? { lineStep } : {}),
        ...(anim ? { anim } : {}),
        ...(animMs ? { animMs } : {}),
      }
    }),
  )
}

/** Độ trễ vào của từng phần tử khi cả trang tự chạy; họa tiết, video và phần chờ bấm không có trong danh sách. */
export function pageDelays(elements: SlideElement[]): Map<string, number> {
  const moving = elements.filter((el) => !el.decor && el.type !== 'video' && startOf(el) === undefined)
  const keys = [...new Set(moving.map(unitKey))]
  const gap = Math.min(110, 700 / Math.max(1, keys.length - 1))
  return new Map(moving.map((el) => [el.id, Math.round(keys.indexOf(unitKey(el)) * gap)]))
}

/* ---------- hiệu ứng cho từng đối tượng ---------- */

export const ANIM_EFFECTS: Array<{ id: Anim; label: string }> = [
  { id: 'fade', label: 'Hiện dần' },
  { id: 'rise', label: 'Bay lên' },
  { id: 'drop', label: 'Rơi xuống' },
  { id: 'left', label: 'Từ trái' },
  { id: 'right', label: 'Từ phải' },
  { id: 'zoom', label: 'Phóng to' },
  { id: 'spin', label: 'Xoay vào' },
]

export const ANIM_SPEEDS: Array<{ ms: number; label: string }> = [
  { ms: 300, label: 'Nhanh (0,3 giây)' },
  { ms: 450, label: 'Vừa (0,45 giây)' },
  { ms: 700, label: 'Chậm (0,7 giây)' },
  { ms: 1000, label: 'Rất chậm (1 giây)' },
]

/** lần bấm đầu tiên làm phần tử hiện; undefined = hiện sẵn */
export const startOf = (el: SlideElement): number | undefined => el.step ?? el.lineStep

/**
 * Đánh số lại các lần bấm liên tiếp từ 1, giữ thứ tự hiện có. Phần tử cùng lần bấm vẫn đi cùng nhau;
 * hộp chữ hiện từng dòng chiếm một lần bấm cho mỗi dòng.
 */
export function renumber(elements: SlideElement[], order?: number[]): SlideElement[] {
  const starts = [...new Set(elements.map(startOf).filter((s): s is number => s !== undefined))].sort((a, b) => a - b)
  const ordered = order ?? starts
  const span = (start: number) =>
    Math.max(1, ...elements.filter((el) => startOf(el) === start).map((el) => (el.lineStep !== undefined ? lineCount(el) : 1)))
  const map = new Map<number, number>()
  let next = 1
  for (const s of ordered) {
    map.set(s, next)
    next += span(s)
  }
  return elements.map((el) => {
    if (el.step !== undefined) return { ...el, step: map.get(el.step) }
    if (el.lineStep !== undefined) return { ...el, lineStep: map.get(el.lineStep) }
    return el
  })
}

export type ElementAnimAction =
  | { type: 'set'; anim: Anim }
  | { type: 'none' }
  | { type: 'move'; dir: -1 | 1 }
  | { type: 'byLine'; on: boolean }
  | { type: 'speed'; ms: number }

/** Áp một thao tác hiệu ứng cho phần tử `id`; các lần bấm luôn được đánh số lại liền mạch. */
export function applyElementAnim(elements: SlideElement[], id: string, action: ElementAnimAction): SlideElement[] {
  const el = elements.find((e) => e.id === id)
  if (!el) return elements
  const patch = (fn: (e: SlideElement) => SlideElement) => elements.map((e) => (e.id === id ? fn({ ...e }) : e))
  switch (action.type) {
    case 'set': {
      if (startOf(el) !== undefined) return patch((e) => ({ ...e, anim: action.anim }))
      return renumber(patch((e) => ({ ...e, step: slideSteps(elements) + 1, anim: action.anim })))
    }
    case 'none':
      return renumber(
        patch((e) => {
          delete e.step
          delete e.lineStep
          delete e.anim
          delete e.animMs
          return e
        }),
      )
    case 'speed':
      return startOf(el) === undefined ? elements : patch((e) => ({ ...e, animMs: action.ms }))
    case 'byLine': {
      const start = startOf(el)
      if (start === undefined) return elements
      return renumber(
        patch((e) => {
          delete e.step
          delete e.lineStep
          return action.on ? { ...e, lineStep: start } : { ...e, step: start }
        }),
      )
    }
    case 'move': {
      const start = startOf(el)
      if (start === undefined) return elements
      const starts = [...new Set(elements.map(startOf).filter((s): s is number => s !== undefined))].sort((a, b) => a - b)
      const i = starts.indexOf(start)
      const j = i + action.dir
      if (j < 0 || j >= starts.length) return elements
      const order = [...starts]
      ;[order[i], order[j]] = [order[j], order[i]]
      return renumber(elements, order)
    }
  }
}
