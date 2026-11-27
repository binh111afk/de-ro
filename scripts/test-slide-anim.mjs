/**
 * Test hiệu ứng bấm-chuột: mọi layout có nội dung đều có ít nhất một lần bấm,
 * tiêu đề hiện sẵn, đáp án quiz hiện cuối, bullets hiện từng dòng.
 * Chạy: npm run test:slide-anim
 */
import assert from 'node:assert/strict'
import { composeLayout, SLIDE_LAYOUTS } from '../src/lib/slideLayouts.ts'
import { applyElementAnim, autoAnimate, clearAnimation, clearSlideAnim, keepAnim, pageDelays, pageState, setPageAnim, slideSteps } from '../src/lib/slideAnim.ts'
import { boxShift, matchMorph, sameLook, settleDeck, textShift } from '../src/lib/slideMorph.ts'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'

const theme = DECK_THEMES[0]
const content = {
  title: 'Tiêu đề mẫu',
  kicker: 'Nhãn',
  subtitle: 'Phụ đề mẫu',
  body: 'Một câu nội dung chính',
  bullets: ['Ý một', 'Ý hai', 'Ý ba'],
  items: ['Một: mô tả ngắn', 'Hai: mô tả ngắn', 'Ba: mô tả ngắn'],
  steps: ['Bước một', 'Bước hai', 'Bước ba'],
  left: ['Trái 1', 'Trái 2'],
  right: ['Phải 1', 'Phải 2'],
  leftTitle: 'Bên trái',
  rightTitle: 'Bên phải',
  options: ['A1', 'B1', 'C1', 'D1'],
  answer: 'B',
  explanation: 'Vì B đúng',
  quote: 'Một câu trích',
  author: 'Tác giả',
  rows: [['Cột 1', 'Cột 2'], ['a', 'b'], ['c', 'd']],
  problem: 'Đề bài mẫu',
  conclusion: 'Kết luận mẫu',
}

const report = []
for (const { id } of SLIDE_LAYOUTS) {
  const els = composeLayout(theme, id, content)
  if (els.length === 0) continue
  const steps = slideSteps(els)
  report.push(`${id}:${steps}`)
  const title = els.find((el) => el.id === 'title' || el.id === 'question')
  if (title) assert.ok(!title.step && !title.lineStep, `${id}: tiêu đề phải hiện sẵn`)
  if (!['image-full', 'image-left', 'image-right', 'photo-full', 'photo-compare', 'bars'].includes(id)) assert.ok(steps >= 1, `${id}: phải có hiệu ứng bấm`)
}
console.log(report.join('  '))

const quiz = composeLayout(theme, 'quiz', content)
const answer = quiz.find((el) => el.id === 'answer')
assert.ok(answer?.step, 'đáp án quiz hiện khi bấm')
assert.ok(quiz.filter((el) => el.id.startsWith('option-')).every((el) => !el.step), 'các lựa chọn hiện sẵn')

const bullets = composeLayout(theme, 'bullets', content).find((el) => el.id === 'bullets')
assert.equal(bullets.lineStep, 1)
assert.equal(slideSteps([bullets]), 3, '3 ý → 3 lần bấm')

const cards = composeLayout(theme, 'cards', content)
assert.deepEqual(
  [...new Set(cards.filter((el) => el.step).map((el) => el.step))].sort(),
  [1, 2, 3],
  'mỗi thẻ một lần bấm, các phần của thẻ cùng lần',
)

const cleared = clearAnimation(cards)
assert.equal(slideSteps(cleared), 0)
assert.deepEqual(autoAnimate(cleared, 'cards'), cards)
// hiệu ứng từng đối tượng: thêm nối tiếp, đổi thứ tự, hiện từng dòng, bỏ thì đánh số lại liền mạch
let els = [
  { id: 'a', type: 'shape', x: 0, y: 0, w: 10, h: 10 },
  { id: 'b', type: 'text', x: 0, y: 0, w: 10, h: 10, text: ['x', 'y', 'z'].join('\n') },
  { id: 'c', type: 'shape', x: 0, y: 0, w: 10, h: 10 },
]
const at = (id) => els.find((e) => e.id === id)
els = applyElementAnim(els, 'a', { type: 'set', anim: 'left' })
els = applyElementAnim(els, 'b', { type: 'set', anim: 'fade' })
els = applyElementAnim(els, 'c', { type: 'set', anim: 'zoom' })
assert.deepEqual([at('a').step, at('b').step, at('c').step], [1, 2, 3])
els = applyElementAnim(els, 'b', { type: 'byLine', on: true })
assert.equal(at('b').lineStep, 2)
assert.equal(at('c').step, 5, 'hộp 3 dòng chiếm lần bấm 2–4')
els = applyElementAnim(els, 'c', { type: 'move', dir: -1 })
assert.deepEqual([at('a').step, at('c').step, at('b').lineStep], [1, 2, 3])
els = applyElementAnim(els, 'a', { type: 'none' })
assert.equal(at('a').step, undefined)
assert.deepEqual([at('c').step, at('b').lineStep], [1, 2])
els = applyElementAnim(els, 'c', { type: 'speed', ms: 700 })
assert.equal(at('c').animMs, 700)
assert.equal(slideSteps(els), 4)

// hiệu ứng cả trang
const slideOf = (layout) => ({ layout, elements: composeLayout(theme, layout, content) })
const auto = setPageAnim(slideOf('cards'), 'rise', 'auto', 700)
assert.deepEqual(auto.pageAnim, { anim: 'rise', ms: 700 })
assert.equal(slideSteps(auto.elements), 0, 'cả trang tự chạy thì không còn phải bấm')
const delays = pageDelays(auto.elements)
const card1 = auto.elements.filter((el) => /^card-1(-|$)/.test(el.id) && !el.decor).map((el) => delays.get(el.id))
assert.equal(new Set(card1).size, 1, 'các mảnh của một thẻ vào cùng lúc')
assert.ok(Math.max(...delays.values()) <= 700)

const quizAuto = setPageAnim(setPageAnim(slideOf('quiz'), 'none', 'auto'), 'fade', 'auto')
assert.ok(quizAuto.elements.find((el) => el.id === 'answer').step, 'đáp án vẫn phải bấm mới hiện')

const clicked = setPageAnim(auto, 'zoom', 'click')
assert.equal(clicked.pageAnim, undefined)
assert.deepEqual(pageState(clicked), { mode: 'click', anim: 'zoom', ms: 450 })

// slide tự làm (không có bố cục): mỗi khối một lần bấm, tiêu đề hiện sẵn
const own = setPageAnim(
  { elements: [{ id: 't', type: 'text', variant: 'title' }, { id: 'a', type: 'shape' }, { id: 'b', type: 'shape' }].map((el) => ({ ...el, x: 0, y: 0, w: 10, h: 10 })) },
  'left',
  'click',
)
assert.deepEqual(own.elements.map((el) => el.step), [undefined, 1, 2])

assert.deepEqual(pageState(clearSlideAnim({ ...auto, transition: 'zoom' })), { mode: null, anim: 'none', ms: 450 })
assert.equal(clearSlideAnim({ ...auto, transition: 'zoom' }).transition, 'none')

// dựng lại phần tử (đổi bộ màu) không gắn lại hiệu ứng đã bỏ
const rebuilt = composeLayout(theme, 'cards', content)
assert.equal(slideSteps(keepAnim(setPageAnim(slideOf('cards'), 'none', 'auto'), rebuilt)), 0)
assert.equal(slideSteps(keepAnim(auto, rebuilt)), 0)
assert.deepEqual(pageState({ elements: keepAnim(clicked, rebuilt) }), pageState(clicked))
// Morph: ghép theo mã trước, rồi theo nội dung (bài chép dán có mã khác)
const box = (id, extra) => ({ id, type: 'text', x: 10, y: 10, w: 40, h: 10, text: id, fontSize: 4, ...extra })
const first = [box('a'), box('b'), box('c', { text: 'chung' })]
const second = [box('a', { x: 50 }), box('z', { text: 'chung' }), box('moi')]
const pairs = matchMorph(first, second)
assert.deepEqual([...pairs].map(([id, el]) => `${id}<${el.id}`), ['a<a', 'z<c'])
assert.ok(sameLook(first[0], { ...second[0], fontSize: 8 }), 'đổi chỗ, đổi cỡ chữ vẫn là một mặt ngoài')
assert.ok(!sameLook(first[0], { ...second[0], textColor: '#f00' }))
assert.deepEqual(textShift(second[0], first[0]), { origin: '51% 11.778%', translate: '-40% 0%', scale: 1, rotate: '0deg' })
assert.equal(boxShift({ ...second[0], rotation: 350 }, { ...first[0], rotation: 10 }).rotate, '20deg', 'quay theo góc ngắn nhất')

// slide Morph: phần giữ nguyên nội dung không bắt bấm lại, đáp án và phần đổi nội dung vẫn chờ bấm
const deckOf = (elements, transition) => ({ id: transition ?? 'goc', background: '#fff', transition, elements })
const [, settled] = settleDeck([
  deckOf([box('a'), box('answer'), box('d')]),
  deckOf([box('a', { step: 1 }), box('answer', { step: 2 }), box('d', { step: 3, text: 'khác' })], 'morph'),
])
assert.deepEqual(settled.elements.map((el) => el.step), [undefined, 1, 2])
const untouched = deckOf([box('a', { step: 1 })], 'fade')
assert.equal(settleDeck([deckOf([box('a')]), untouched])[1], untouched)
console.log('test-slide-anim: pass')
