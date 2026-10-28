/**
 * Hiệu ứng "bấm chuột rồi hiện" khi trình chiếu. Layout engine đặt tên phần tử theo vai trò
 * (`card-2-heading`, `step-3`, `answer`…) nên nhóm bấm-chuột suy ra thẳng từ id — AI không phải sinh gì thêm.
 * Phần tử không thuộc nhóm nào (tiêu đề, nền, họa tiết) hiện sẵn.
 */
import type { SlideElement } from '@/store/docs'

type Anim = NonNullable<SlideElement['anim']>

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
