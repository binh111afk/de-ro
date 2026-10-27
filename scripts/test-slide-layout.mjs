/**
 * Test layout engine 19 bố cục: catalog/geometry, cards, quote/closing, fallback,
 * đọc nội dung slide, bảng 6×8, timeline/cycle 3–6 bước, quiz 2–4 đáp án, tone,
 * 5 bố cục art-directed (statement/comparison/agenda/image-full/stat-image).
 * Chạy: npm run test:slide-layout
 */
import assert from 'node:assert/strict'
import { DECK_THEMES, contrastRatio, normalizeTheme, readableTextOn } from '../src/lib/slideTheme.ts'
import {
  SLIDE_LAYOUTS,
  composeLayout,
  contentFromSlide,
  defaultTone,
  isLayoutId,
  isTone,
  toneBackground,
  withPlaceholders,
} from '../src/lib/slideLayouts.ts'

const theme = DECK_THEMES[0]
const resolved = normalizeTheme(theme)

const rich = {
  title: 'Tiêu đề bài học',
  kicker: 'NHÃN PHẦN',
  subtitle: 'Dòng phụ',
  body: 'Đoạn thân',
  bullets: ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'],
  items: ['Thẻ một', 'Thẻ hai', 'Thẻ ba'],
  left: ['Trái một', 'Trái hai'],
  right: ['Phải một', 'Phải hai'],
  leftTitle: 'Trước',
  rightTitle: 'Sau',
  quote: 'Học đi đôi với hành.',
  author: 'Tác giả',
  rows: [['Nội dung', 'Ghi chú'], ['Ý một', '…'], ['Ý hai', '…']],
  stats: [
    { value: '85%', label: 'Tỉ lệ đạt' },
    { value: '12', label: 'Bài học' },
    { value: '3', label: 'Mức độ' },
  ],
  steps: ['Khởi động', 'Khám phá', 'Luyện tập', 'Vận dụng'],
  question: 'Phân số nào bằng 1/2?',
  options: ['2/4', '2/3', '3/4', '1/3'],
  answer: 0,
}

/* 1. Catalog đủ 19 layout; mọi phần tử nằm trong khung 0–100, id không trùng. */
assert.equal(SLIDE_LAYOUTS.length, 19)
assert.equal(new Set(SLIDE_LAYOUTS.map((l) => l.id)).size, 19, 'id layout không trùng')
for (const layout of SLIDE_LAYOUTS) {
  const elements = composeLayout(theme, layout.id, rich)
  assert.ok(elements.length > 0, `${layout.id} phải dựng được phần tử`)
  assert.equal(
    new Set(elements.map((el) => el.id)).size,
    elements.length,
    `${layout.id}: id phần tử không trùng`,
  )
  for (const el of elements) {
    assert.ok(el.x >= 0 && el.y >= 0 && el.w > 0 && el.h > 0, `${layout.id}: toạ độ âm/0`)
    assert.ok(el.x + el.w <= 100 + 1e-9, `${layout.id}: tràn phải (${el.id})`)
    assert.ok(el.y + el.h <= 100 + 1e-9, `${layout.id}: tràn đáy (${el.id})`)
  }
}

/* 2. Cards nhận 2–6 thẻ, quá 6 thì cắt, thiếu 2 thì trả rỗng để caller fallback. */
const cards = (items) =>
  composeLayout(theme, 'cards', { title: 'Thẻ', items }).filter((el) => /^card-\d+$/.test(el.id))
assert.equal(cards(['A', 'B']).length, 2)
assert.equal(cards(['A', 'B', 'C', 'D', 'E', 'F']).length, 6)
assert.equal(cards(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']).length, 6)
assert.equal(composeLayout(theme, 'cards', { title: 'Thẻ', items: ['Chỉ một'] }).length, 0)

/* 3. Quote dùng quote/author; thiếu quote thì lấy ý/đoạn thân, không bịa tác giả. */
const quote = composeLayout(theme, 'quote', { quote: rich.quote, author: rich.author })
assert.equal(quote.find((el) => el.id === 'quote')?.text, rich.quote)
assert.equal(quote.find((el) => el.id === 'author')?.text, rich.author)
const quoteFallback = composeLayout(theme, 'quote', { bullets: ['Ý duy nhất'] })
assert.equal(quoteFallback.find((el) => el.id === 'quote')?.text, 'Ý duy nhất')
assert.equal(quoteFallback.find((el) => el.id === 'author'), undefined)
const quoteFromBody = composeLayout(theme, 'quote', { body: '• Ý một\n• Ý hai' })
assert.equal(quoteFromBody.find((el) => el.id === 'quote')?.text, 'Ý một Ý hai', 'bỏ dấu bullet')

/* 4. Closing dùng title/subtitle, có vạch nhấn, không sinh bullet. */
const closing = composeLayout(theme, 'closing', { title: 'Cảm ơn', subtitle: 'Thảo luận' })
assert.equal(closing.find((el) => el.id === 'title')?.text, 'Cảm ơn')
assert.equal(closing.find((el) => el.id === 'subtitle')?.text, 'Thảo luận')
assert.equal(closing.filter((el) => el.type === 'text').length, 2)
assert.ok(closing.some((el) => el.id === 'accent-line'))

/* 5. Layout lạ rơi về bullets; isLayoutId/isTone lọc đúng. */
assert.equal(isLayoutId('khong-co'), false)
assert.equal(isLayoutId('cards'), true)
assert.equal(isTone('soft'), true)
assert.equal(isTone('nope'), false)
assert.deepEqual(
  composeLayout(theme, 'khong-co', { title: 'A', bullets: ['x', 'y'] }),
  composeLayout(theme, 'bullets', { title: 'A', bullets: ['x', 'y'] }),
)

/* 6. Đọc nội dung slide cũ + placeholder + màu theme áp vào phần tử. */
const slide = {
  id: 's',
  background: '#ffffff',
  elements: [
    { id: 'title', type: 'text', x: 8, y: 8, w: 84, h: 14, text: 'Bài học', variant: 'title' },
    { id: 'random', type: 'text', x: 8, y: 30, w: 84, h: 40, text: '• Ý một\n• Ý hai' },
  ],
}
const content = contentFromSlide(slide)
assert.equal(content.title, 'Bài học')
assert.deepEqual(content.bullets, ['Ý một', 'Ý hai'])
// slide mặc định cũ: ô chữ duy nhất không có id/variant vai trò vẫn phải là tiêu đề
const legacy = contentFromSlide({
  id: 'l',
  background: '#fff',
  elements: [{ id: 'x', type: 'text', x: 8, y: 42, w: 84, h: 16, text: 'Tiêu đề bài giảng' }],
})
assert.equal(legacy.title, 'Tiêu đề bài giảng')
assert.equal(legacy.bullets, undefined)
const carried = composeLayout(theme, 'cards', withPlaceholders('cards', content))
assert.equal(carried.find((el) => el.id === 'card-1')?.text, 'Ý một', 'giữ chữ khi đổi layout')
const panelFill = carried.find((el) => el.id === 'card-1-panel')?.fill
assert.ok(panelFill && contrastRatio(panelFill, resolved.bg) >= 1.1, 'thẻ có panel nhìn thấy trên nền theme')
assert.ok(carried.find((el) => el.id === 'card-1-index')?.text, 'thẻ có số thứ tự')

// slide dựng bằng layout bullets (id vai trò) vẫn đọc lại được các ý
const bulletsSlide = contentFromSlide({
  id: 'b',
  background: '#fff',
  elements: composeLayout(theme, 'bullets', { title: 'T', bullets: ['Một', 'Hai'] }),
})
assert.deepEqual(bulletsSlide.bullets, ['Một', 'Hai'], 'đọc lại khối bullets')

const empty = contentFromSlide({ id: 'e', background: '#fff', elements: [] })
const demo = composeLayout(theme, 'cards', withPlaceholders('cards', empty))
assert.equal(demo.filter((el) => /^card-\d+$/.test(el.id)).length, 3, 'slide trống có thẻ mẫu')

const twoCols = contentFromSlide({
  id: 't',
  background: '#fff',
  elements: [
    { id: 'body', type: 'text', x: 8, y: 27, w: 39, h: 60, text: '• Trái một\n• Trái hai' },
    { id: 'body-2', type: 'text', x: 53, y: 27, w: 39, h: 60, text: '• Phải một' },
  ],
})
assert.deepEqual(twoCols.left, ['Trái một', 'Trái hai'])
assert.deepEqual(twoCols.right, ['Phải một'])

/* 7. Bảng: tối đa 8 hàng × 6 cột, pad đủ cột; không có hàng thì rỗng. */
const wideRows = Array.from({ length: 10 }, (_, row) =>
  Array.from({ length: 8 }, (_, col) => `R${row + 1}C${col + 1}`),
)
const table = composeLayout(theme, 'table', { title: 'Bảng', rows: wideRows }).find(
  (el) => el.id === 'table',
)
assert.equal(table.type, 'table')
assert.equal(table.rows.length, 8, 'cắt còn 8 hàng')
assert.ok(table.rows.every((row) => row.length === 6), 'cắt còn 6 cột')
const ragged = composeLayout(theme, 'table', { rows: [['A', 'B', 'C'], ['D']] }).find(
  (el) => el.id === 'table',
)
assert.deepEqual(ragged.rows, [['A', 'B', 'C'], ['D', '', '']], 'pad ô thiếu')
assert.equal(composeLayout(theme, 'table', { title: 'B', rows: [] }).length, 0)

/* 8. Timeline/cycle nhận 3–6 bước, quá 6 thì cắt, dưới 3 thì rỗng. */
const steps = (n) => Array.from({ length: n }, (_, i) => `Bước ${i + 1}`)
const marks = (layout, n, pattern) =>
  composeLayout(theme, layout, { title: 'T', steps: steps(n) }).filter((el) =>
    pattern.test(el.id),
  ).length
assert.equal(marks('timeline', 3, /^step-\d+$/), 3)
assert.equal(marks('timeline', 6, /^step-\d+$/), 6)
assert.equal(marks('timeline', 9, /^step-\d+$/), 6)
assert.equal(composeLayout(theme, 'timeline', { title: 'T', steps: steps(2) }).length, 0)
assert.equal(marks('cycle', 4, /^node-\d+$/), 4)
assert.equal(marks('cycle', 7, /^node-\d+$/), 6)
assert.equal(composeLayout(theme, 'cycle', { title: 'T', steps: steps(2) }).length, 0)
// dựng lại từ slide đã có không bị nhân đôi số thứ tự
const timelineAgain = contentFromSlide({
  id: 'tl',
  background: '#fff',
  elements: composeLayout(theme, 'timeline', { title: 'T', steps: steps(4) }),
})
assert.deepEqual(timelineAgain.steps, steps(4), 'đọc lại bỏ số thứ tự bước')
assert.equal(
  composeLayout(theme, 'timeline', timelineAgain).find((el) => el.id === 'item-1')?.text,
  'Bước 1',
)

/* 9. Quiz: 2–4 phương án, tô đáp án đúng theo chỉ số hoặc chữ cái. */
const quiz = composeLayout(theme, 'quiz', {
  question: 'Chọn đáp án?',
  options: ['A', 'B', 'C', 'D'],
  answer: 2,
})
const options = quiz.filter((el) => /^option-\d+$/.test(el.id))
assert.equal(options.length, 4)
assert.equal(options[2].fill, resolved.accent, 'đáp án đúng tô màu nhấn')
assert.equal(options[2].textColor, readableTextOn(resolved.accent))
assert.notEqual(options[0].fill, resolved.accent)
assert.ok(options[0].text.startsWith('A.'), 'phương án có nhãn chữ cái')
const byLetter = composeLayout(theme, 'quiz', {
  question: 'Q',
  options: ['A', 'B', 'C'],
  answer: 'C',
}).find((el) => el.id === 'option-3')
assert.equal(byLetter.fill, resolved.accent)
const fiveOptions = composeLayout(theme, 'quiz', {
  question: 'Q',
  options: ['A', 'B', 'C', 'D', 'E'],
  answer: 0,
})
assert.equal(fiveOptions.filter((el) => /^option-\d+$/.test(el.id)).length, 4, 'cắt còn 4')
assert.equal(composeLayout(theme, 'quiz', { question: 'Q', options: ['A'] }).length, 0)
// dựng lại từ slide đã có: bỏ nhãn A–D, suy lại đáp án từ màu, không nhân đôi nhãn
const quizAgain = contentFromSlide({ id: 'q', background: '#fff', elements: quiz })
assert.deepEqual(quizAgain.options, ['A', 'B', 'C', 'D'])
assert.equal(quizAgain.answer, 2)
assert.equal(
  composeLayout(theme, 'quiz', quizAgain).find((el) => el.id === 'option-1')?.text,
  'A. A',
)

/* 10. Tone: mặc định theo layout, nền đổi đúng, chữ trên nền nhấn đủ tương phản. */
assert.equal(defaultTone('title'), 'accent')
assert.equal(defaultTone('section'), 'accent')
assert.equal(defaultTone('quote'), 'soft')
assert.equal(defaultTone('quiz'), 'soft')
assert.equal(defaultTone('closing'), 'soft')
assert.equal(defaultTone('bullets'), 'theme')
const accentBg = toneBackground(theme, 'accent')
assert.notEqual(accentBg, resolved.accent, 'tông nhấn dùng nền tint, không tô kín')
assert.ok(contrastRatio(accentBg, resolved.fg) >= 4.5, 'chữ theme đọc được trên nền tint')
assert.equal(toneBackground(theme, 'soft'), resolved.surface)
assert.equal(toneBackground(theme, 'theme'), resolved.bg)
for (const catalogTheme of DECK_THEMES) {
  const n = normalizeTheme(catalogTheme)
  assert.ok(
    contrastRatio(toneBackground(catalogTheme, 'accent'), n.fg) >= 4.5,
    `tông accent của ${catalogTheme.id} phải đủ tương phản`,
  )
}
const titleEls = composeLayout(theme, 'title', {
  title: 'T',
  kicker: 'K',
  subtitle: 'S',
})
assert.ok(titleEls.some((el) => el.id === 'accent-band'), 'title accent có dải nhấn')
const titleOnAccent = titleEls.find((el) => el.id === 'title')
assert.equal(titleOnAccent.textColor, resolved.fg)
assert.ok(contrastRatio(titleOnAccent.textColor, accentBg) >= 4.5, 'chữ/nền tint ≥ 4,5:1')

const softQuiz = composeLayout(theme, 'quiz', {
  question: 'Q',
  options: ['A', 'B'],
  answer: 0,
})
assert.equal(softQuiz.find((el) => el.id === 'option-1').fill, resolved.accent)

/* Bất biến thị giác trên MỌI theme × tông: panel nhìn thấy, chữ nhấn đọc được. */
for (const catalogTheme of DECK_THEMES) {
  for (const tone of ['theme', 'soft', 'accent']) {
    const bg = toneBackground(catalogTheme, tone)
    const cards = composeLayout(catalogTheme, 'cards', rich, tone)
    const panel = cards.find((el) => el.id === 'card-1-panel')?.fill
    assert.ok(contrastRatio(panel, bg) >= 1.1, `panel nhìn thấy: ${catalogTheme.id}/${tone}`)
    const kicker = composeLayout(catalogTheme, 'bullets', rich, tone).find((el) => el.id === 'kicker')
    assert.ok(contrastRatio(kicker.textColor, bg) >= 4.5, `kicker đủ 4,5:1: ${catalogTheme.id}/${tone}`)
  }
}

console.log('✅ layout v3: 19 bố cục, bảng 8×6, timeline/cycle, quiz, tone, art-directed, đọc nội dung + theme')
console.log('✅ tương phản: panel ≥1,1:1 và kicker ≥4,5:1 trên mọi theme × tông')
console.log('\n10/10 pass, 0 fail')
