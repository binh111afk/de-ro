/**
 * Test hợp đồng sinh từng slide (chặng 26b): sanitize, validate, prompt,
 * repair, parse JSON bọc trong lời văn.
 * Chạy: npm run test:slide-ai
 */
import assert from 'node:assert/strict'
import { parseAiObject } from '../src/lib/aiDeck.ts'
import {
  appendSlidesToDeck,
  checkSlide,
  pageSystemPrompt,
  repairPrompt,
  sanitizeSlide,
  slideFromAi,
  validateSlide,
} from '../src/lib/slideAi.ts'
import { SLIDE_LAYOUTS } from '../src/lib/slideLayouts.ts'
import { DECK_THEMES, normalizeTheme } from '../src/lib/slideTheme.ts'

/* 1. Sanitize: layout do dàn ý quyết định, tone ưu tiên dàn ý, cắt giới hạn. */
const fixed = sanitizeSlide({ layout: 'cards', title: '  A  ', bullets: [' x ', '', 3] }, 'title', 'accent')
assert.equal(fixed.layout, 'title', 'layout bị ép theo dàn ý')
assert.equal(fixed.title, 'A')
assert.deepEqual(fixed.bullets, ['x'])
assert.equal(fixed.tone, 'accent')

assert.equal(sanitizeSlide({ tone: 'sai' }, 'bullets').tone, undefined)
assert.equal(sanitizeSlide({ tone: 'accent' }, 'bullets', 'soft').tone, 'soft')

const capped = sanitizeSlide(
  {
    items: Array.from({ length: 10 }, (_, i) => `thẻ ${i}`),
    rows: Array.from({ length: 10 }, () => Array.from({ length: 8 }, () => 'x'.repeat(120))),
    stats: [
      { value: '', label: 'bỏ' },
      ...Array.from({ length: 5 }, (_, i) => ({ value: `${i}`, label: 'x' })),
    ],
    notes: Array.from({ length: 10 }, () => 'ghi chú'),
  },
  'cards',
)
assert.equal(capped.items?.length, 6)
assert.equal(capped.rows?.length, 8)
assert.equal(capped.rows?.[0]?.length, 6)
assert.equal(capped.rows?.[0]?.[0]?.length, 80)
assert.equal(capped.stats?.length, 4, 'stats bỏ mục không có value, cắt còn 4')
assert.ok(capped.stats?.every((stat) => stat.value))
assert.equal(capped.notes?.length, 6)

// stats rỗng sau khi lọc → bỏ hẳn field
assert.equal(sanitizeSlide({ stats: [{ label: 'x' }] }, 'stats').stats, undefined)

/* 2. Mọi layout có dữ liệu đầy đủ → không lỗi. */
const rich = {
  title: 'Tiêu đề',
  kicker: 'NHÃN',
  subtitle: 'Dòng phụ',
  body: 'Đoạn thân',
  bullets: ['ý 1', 'ý 2'],
  items: ['thẻ 1', 'thẻ 2', 'thẻ 3'],
  left: ['trái'],
  right: ['phải'],
  leftTitle: 'Trước',
  rightTitle: 'Sau',
  quote: 'Học đi đôi với hành.',
  author: 'Tác giả',
  rows: [
    ['Cột 1', 'Cột 2'],
    ['a', 'b'],
  ],
  stats: [{ value: '85%', label: 'Tỉ lệ' }],
  steps: ['một', 'hai', 'ba'],
  question: 'Chọn đáp án đúng?',
  options: ['A', 'B'],
  answer: 0,
}
for (const layout of SLIDE_LAYOUTS) {
  const check = checkSlide(rich, layout.id)
  assert.deepEqual(check.errors, [], `${layout.id} hợp lệ nhưng báo lỗi`)
}

/* 3. Lỗi theo layout: thiếu field bắt buộc / sai cấu trúc. */
const errorsOf = (raw, layout) => validateSlide(sanitizeSlide(raw, layout), layout)
assert.ok(errorsOf({ title: 'x' }, 'bullets').length > 0, 'bullets thiếu ý')
assert.ok(errorsOf({ items: ['một'] }, 'cards').length > 0, 'cards cần 2 thẻ')
assert.ok(errorsOf({ left: ['một'] }, 'two-column').length > 0, 'two-column cần 2 ý')
assert.ok(errorsOf({ rows: [['a', 'b']] }, 'table').length > 0, 'table cần 2 hàng')
assert.ok(errorsOf({ rows: [['a'], ['b']] }, 'table').length > 0, 'table cần 2 cột')
assert.ok(errorsOf({ stats: [{ label: 'x' }] }, 'stats').length > 0, 'stats thiếu value')
assert.ok(errorsOf({ title: 'x' }, 'quote').length > 0, 'quote thiếu trích dẫn')
assert.ok(errorsOf({ steps: ['một'] }, 'timeline').length > 0, 'timeline cần 2 bước')
assert.ok(errorsOf({ title: 'x' }, 'title').length === 0, 'title chỉ cần title')

/* 4. Quiz: đáp án theo chỉ số, chữ cái, nguyên văn; sai thì báo lỗi. */
assert.equal(errorsOf({ question: '?', options: ['A', 'B'], answer: 1 }, 'quiz').length, 0)
assert.equal(errorsOf({ question: '?', options: ['A', 'B'], answer: 'B' }, 'quiz').length, 0)
assert.equal(errorsOf({ question: '?', options: ['A', 'B'], answer: 'b' }, 'quiz').length, 0)
assert.equal(errorsOf({ question: '?', options: ['A', 'B'], answer: 'A' }, 'quiz').length, 0)
assert.ok(errorsOf({ question: '?', options: ['A', 'B'], answer: 5 }, 'quiz').length > 0)
assert.ok(errorsOf({ question: '?', options: ['A', 'B'], answer: 'Z' }, 'quiz').length > 0)
assert.ok(errorsOf({ question: '?', options: ['A'], answer: 0 }, 'quiz').length > 0, 'quiz cần 2 phương án')

/* 5. Prompt một slide: đúng layout, brief, style, không gửi cả catalog. */
const plan = {
  title: 'Hệ thức lượng',
  theme: 'khoa-hoc',
  stylePack: 'editorial',
  audience: 'Học sinh lớp 9',
  style: 'Tối giản, nhiều hình minh hoạ',
  mainIdeas: [],
  slides: [
    { title: 'Mở đầu', layout: 'title', kicker: 'Toán 9', brief: 'Trang bìa' },
    { title: 'Ba hệ thức', layout: 'bullets', brief: 'Nêu ba hệ thức và ví dụ' },
  ],
}
const prompt = pageSystemPrompt(plan, plan.slides[1], 1)
assert.ok(prompt.includes('LAYOUT BẮT BUỘC: "bullets"'))
assert.ok(prompt.includes('Nêu ba hệ thức và ví dụ'), 'brief có trong prompt')
assert.ok(prompt.includes('Tối giản, nhiều hình minh hoạ'), 'style có trong prompt')
assert.ok(prompt.includes('Học sinh lớp 9'), 'audience có trong prompt')
assert.ok(prompt.includes('ART DIRECTION'), 'style pack có trong prompt')
assert.ok(prompt.includes('Tiêu đề nêu thẳng luận điểm'), 'luật style pack có trong prompt')
assert.ok(prompt.includes('DÀN Ý CẢ DECK'))
assert.ok(prompt.includes('SLIDE CẦN VIẾT: 2/2'))
assert.ok(prompt.includes('"bullets" — mảng 2–4 ý'))
assert.ok(prompt.includes('NGÂN SÁCH CHỮ: tổng ≤ 460 ký tự'), 'prompt có ngân sách chữ')
assert.ok(prompt.includes('MỘT thông điệp chính mỗi slide'), 'prompt ép một thông điệp chính')
assert.ok(prompt.includes('làm điểm nhấn của slide'), 'prompt yêu cầu điểm nhấn')
assert.ok(!prompt.includes('"cards":') && !prompt.includes('BỐ CỤC'), 'không gửi catalog 19 layout')

/* 6. Lượt sửa nêu đúng lỗi. */
const repair = repairPrompt(['thiếu "title"', '"bullets" cần ít nhất 1 ý'])
assert.ok(repair.includes('thiếu "title"'))
assert.ok(repair.includes('"bullets" cần ít nhất 1 ý'))
assert.ok(repair.includes('DUY NHẤT một JSON'), 'vẫn ép trả JSON')

/* 7. parseAiObject: bóc fence/lời văn; mảng không phải object. */
const parsed = parseAiObject('Đây là slide:\n```json\n{"layout":"quiz","question":"?","options":["A","B"],"answer":0}\n```')
assert.ok(parsed && typeof parsed === 'object' && !Array.isArray(parsed))
assert.equal(parsed.layout, 'quiz')
// mảng một object: bóc được object bên trong; mảng chuỗi thì không
assert.equal(parseAiObject('[{"layout":"bullets"}]')?.layout, 'bullets')
assert.equal(parseAiObject('["a","b"]'), null)

/* 8. Chuỗi sửa: lỗi trước → sửa → hết lỗi (quyết định của vòng repair). */
const broken = checkSlide({ layout: 'cards', items: ['một'] }, 'cards')
assert.ok(broken.errors.length > 0)
const repaired = checkSlide({ layout: 'cards', items: ['một', 'hai'] }, 'cards')
assert.deepEqual(repaired.errors, [])

/* 9. Ngân sách chữ: câu dài / quá nhiều ý / tổng quá dài đều phải báo lỗi. */
const longBullet = checkSlide({ title: 'T', bullets: ['x'.repeat(120), 'ý ngắn'] }, 'bullets')
assert.ok(longBullet.errors.some((error) => error.includes('dài')), 'bắt ý quá dài')
const manyBullets = checkSlide(
  { title: 'T', bullets: Array.from({ length: 6 }, (_, i) => `ý ${i}`) },
  'bullets',
)
assert.ok(manyBullets.errors.some((error) => error.includes('tối đa 4')), 'bắt quá số ý')
const tooMuch = checkSlide(
  { title: 'T'.repeat(60), bullets: ['x'.repeat(110), 'y'.repeat(110), 'z'.repeat(110), 'w'.repeat(110)] },
  'bullets',
)
assert.ok(tooMuch.errors.some((error) => error.includes('quá nhiều chữ')), 'bắt tổng quá dài')
const concise = checkSlide(
  { title: 'Ba điểm', bullets: ['Ý ngắn một', 'Ý ngắn hai', 'Ý ngắn ba'] },
  'bullets',
)
assert.deepEqual(concise.errors, [], 'slide ngắn gọn không bị báo lỗi')

// bảng: quá 6 hàng / ô quá 40 ký tự
assert.ok(
  errorsOf(
    {
      title: 'Bảng',
      rows: [['a', 'b'], ['c', 'd'], ['e', 'f'], ['g', 'h'], ['i', 'j'], ['k', 'l'], ['m', 'n']],
    },
    'table',
  ).some((error) => error.includes('tối đa 6 hàng')),
)
assert.ok(
  errorsOf({ title: 'Bảng', rows: [['a', 'b'], ['c'.repeat(41), 'd']] }, 'table').some((error) =>
    error.includes('ô bảng dài'),
  ),
)

/* 10. Chèn dần: trang đầu áp theme + style, trang sau chỉ nối, giữ thứ tự. */
const baseDeck = {
  id: 'd1',
  title: 'Deck',
  theme: DECK_THEMES[0],
  slides: [],
  createdAt: '',
  updatedAt: '',
}
const themePlan = {
  title: 'Deck',
  theme: 'giay-am',
  style: 'Tối giản, nhiều hình',
  mainIdeas: [],
  slides: [{ title: 'Mở', layout: 'bullets' }],
}
const page1 = sanitizeSlide({ title: 'Mở', bullets: ['a', 'b'] }, 'bullets', 'accent')
const first = appendSlidesToDeck(baseDeck, [page1], themePlan)
assert.equal(first.patch.theme.id, 'giay-am', 'trang đầu đổi theme theo dàn ý')
assert.equal(first.patch.style, 'Tối giản, nhiều hình')
assert.equal(first.patch.slides.length, 1)
assert.equal(first.patch.slides[0].layout, 'bullets')
assert.ok(first.patch.slides[0].elements.length > 0)
assert.equal(first.added.length, 1)

const deck2 = { ...baseDeck, ...first.patch }
const page2 = sanitizeSlide({ title: 'Hai', bullets: ['c'] }, 'bullets')
const second = appendSlidesToDeck(deck2, [page2], themePlan)
assert.equal(second.patch.theme, undefined, 'trang sau không đổi theme lần nữa')
assert.equal(second.patch.slides.length, 2, 'nối đúng thứ tự')
assert.equal(second.patch.slides[0].id, first.added[0].id, 'giữ slide đã chèn')
assert.equal(second.patch.slides[1].layout, 'bullets')

// đổi theme còn dựng lại slide layout cũ, giữ nội dung
const existing = slideFromAi(page1, normalizeTheme(DECK_THEMES[0]))
const third = appendSlidesToDeck({ ...baseDeck, slides: [existing] }, [page2], themePlan)
assert.equal(third.patch.slides.length, 2)
assert.ok(third.patch.slides[0].elements.length > 0, 'slide cũ được dựng lại')
assert.notEqual(third.patch.slides[0].background, existing.background, 'nền đổi theo theme')

// không có trang → không đổi gì; layout lạ vẫn có fallback title + bullets
assert.deepEqual(appendSlidesToDeck(baseDeck, [], themePlan).patch, {})
const fallback = slideFromAi(
  { layout: 'khong-co', title: 'T', bullets: ['x'] },
  normalizeTheme(DECK_THEMES[0]),
)
assert.equal(fallback.layout, undefined)
assert.ok(fallback.elements.length >= 2, 'fallback có tiêu đề + khối ý')

/* 11. Đọc được: nhồi chữ vào thẻ → báo; slide ngắn → sạch; icon không mặc định/không lặp. */
{
  const { readabilityIssues, checkSlide } = await import('../src/lib/slideAi.ts')
  const { composeLayout } = await import('../src/lib/slideLayouts.ts')
  const long = 'Một ý rất dài được viết liền mạch như một đoạn văn xuôi để chắc chắn sẽ làm chữ trong thẻ bị co nhỏ '.repeat(2)
  const crowded = sanitizeSlide({ title: 'Bốn ý', items: [1, 2, 3, 4].map((n) => `Ý ${n}: ${long}`) }, 'cards')
  assert.ok(readabilityIssues(crowded, 'cards').length > 0, 'thẻ nhồi chữ phải bị báo')
  const short = sanitizeSlide({ title: 'Bốn ý', items: ['Một: ngắn gọn', 'Hai: ngắn gọn', 'Ba: ngắn gọn', 'Bốn: ngắn gọn'] }, 'cards')
  assert.deepEqual(readabilityIssues(short, 'cards'), [])
  assert.deepEqual(checkSlide({ title: 'Bốn ý', items: short.items }, 'cards').readability, [])
  const els = composeLayout(DECK_THEMES[0], 'cards', { title: 'Ba mục', items: ['Alpha beta', 'Gamma delta', 'Epsilon zeta'] })
  assert.equal(els.some((el) => el.type === 'icon'), false, 'không khớp từ khoá → không icon sách mặc định')
  const timeIcons = composeLayout(DECK_THEMES[0], 'cards', { title: 'Thời gian', items: ['Giờ học', 'Phút nghỉ', 'Lịch tuần'] })
    .filter((el) => el.type === 'icon')
  assert.equal(new Set(timeIcons.map((el) => el.assetId)).size, timeIcons.length, 'icon không lặp trong một slide')
}

console.log('test-slide-ai: 10 nhóm kiểm tra đạt')
