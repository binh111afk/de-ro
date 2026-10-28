/**
 * Test hiệu ứng bấm-chuột: mọi layout có nội dung đều có ít nhất một lần bấm,
 * tiêu đề hiện sẵn, đáp án quiz hiện cuối, bullets hiện từng dòng.
 * Chạy: npm run test:slide-anim
 */
import assert from 'node:assert/strict'
import { composeLayout, SLIDE_LAYOUTS } from '../src/lib/slideLayouts.ts'
import { autoAnimate, clearAnimation, slideSteps } from '../src/lib/slideAnim.ts'
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
  if (!['image-full', 'image-left', 'image-right'].includes(id)) assert.ok(steps >= 1, `${id}: phải có hiệu ứng bấm`)
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
console.log('test-slide-anim: pass')
