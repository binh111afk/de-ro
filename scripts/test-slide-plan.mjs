/**
 * Test hợp đồng dàn ý slide (chặng 26a): parse/sanitize + catalog prompt.
 * Chạy: npm run test:slide-plan
 */
import assert from 'node:assert/strict'
import {
  parseAiDeck,
  parseDeckPlan,
  slideCatalogText,
} from '../src/lib/aiDeck.ts'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'
import { SLIDE_LAYOUTS } from '../src/lib/slideLayouts.ts'
import { enforceRhythm } from '../src/lib/aiDeck.ts'

/* 1. Dàn ý hợp lệ giữ nguyên field; theme/layout/tone đúng danh mục. */
const good = parseDeckPlan(
  JSON.stringify({
    title: 'Hệ thức lượng',
    theme: 'khoa-hoc',
    stylePack: 'editorial',
    audience: 'Học sinh lớp 9',
    style: 'Tối giản, nhiều hình minh hoạ.',
    mainIdeas: ['Định lí Pythagore', 'Tỉ số lượng giác'],
    slides: [
      { title: 'Hệ thức lượng', layout: 'title', kicker: 'TOÁN 9', brief: 'Giới thiệu bài' },
      { title: 'Ba hệ thức', layout: 'cards', tone: 'accent', brief: 'Liệt kê ba hệ thức' },
      { title: 'Tổng kết', layout: 'closing' },
    ],
  }),
)
assert.ok(good)
assert.equal(good.title, 'Hệ thức lượng')
assert.equal(good.theme, 'sang', 'id theme cũ khoa-hoc được đổi sang theme thay thế')
assert.equal(good.stylePack, 'editorial')
assert.equal(good.audience, 'Học sinh lớp 9')
assert.equal(good.style, 'Tối giản, nhiều hình minh hoạ.')
assert.deepEqual(good.mainIdeas, ['Định lí Pythagore', 'Tỉ số lượng giác'])
assert.equal(good.slides.length, 3)
assert.deepEqual(good.slides[0], {
  title: 'Hệ thức lượng',
  layout: 'title',
  kicker: 'TOÁN 9',
  brief: 'Giới thiệu bài',
})
assert.equal(good.slides[1].tone, 'accent')
assert.equal(good.slides[2].tone, undefined)

/* 2. Giá trị lạ: theme bỏ, layout về bullets, tone bỏ, slide không tiêu đề bỏ. */
const messy = parseDeckPlan(
  JSON.stringify({
    theme: 'khong-ton-tai',
    stylePack: 'khong-co',
    slides: [
      { title: '  Slide   một  ', layout: 'khong-co', tone: 'sai' },
      { title: '   ', layout: 'cards' },
      { nope: true },
    ],
  }),
)
assert.ok(messy)
assert.equal(messy.theme, undefined)
assert.equal(messy.stylePack, undefined, 'stylePack lạ bị bỏ')
assert.equal(messy.slides.length, 1)
assert.equal(messy.slides[0].title, 'Slide một')
assert.equal(messy.slides[0].layout, 'bullets')
assert.equal(messy.slides[0].tone, undefined)

/* 3. Chặn độ dài: tối đa 20 slide, 6 ý chính, title 160 ký tự. */
const many = parseDeckPlan(
  JSON.stringify({
    mainIdeas: Array.from({ length: 10 }, (_, i) => `Ý ${i}`),
    slides: Array.from({ length: 25 }, (_, i) => ({ title: `Slide ${i}`, layout: 'bullets' })),
  }),
)
assert.ok(many)
assert.equal(many.slides.length, 20)
assert.equal(many.mainIdeas.length, 6)

const longTitle = parseDeckPlan(
  JSON.stringify({ slides: [{ title: 'x'.repeat(400), layout: 'title' }] }),
)
assert.ok(longTitle)
assert.equal(longTitle.slides[0].title.length, 160)

/* 4. Nhận dàn ý bọc trong {"plan": …} hoặc ```json fence```. */
const wrapped = parseDeckPlan(
  '{"plan":{"title":"A","slides":[{"title":"Mở đầu","layout":"title"}]}}',
)
assert.ok(wrapped)
assert.equal(wrapped.slides[0].title, 'Mở đầu')

const fenced = parseDeckPlan(
  'Đây là dàn ý:\n```json\n{"slides":[{"title":"B","layout":"section"}]}\n```',
)
assert.ok(fenced)
assert.equal(fenced.slides[0].layout, 'section')

/* 5. Không phải dàn ý → null (để rơi về đường deck một lượt). */
assert.equal(parseDeckPlan('Mình gợi ý bài giảng gồm 3 phần.'), null)
assert.equal(parseDeckPlan('{"slides":[]}'), null)
assert.equal(parseDeckPlan('{"slides":[{"bullets":["a"]}]}'), null)

/* 6. Catalog prompt sinh từ code: đủ 6 theme + 19 layout. */
const catalog = slideCatalogText()
for (const theme of DECK_THEMES) assert.ok(catalog.includes(theme.id), `thiếu theme ${theme.id}`)
for (const layout of SLIDE_LAYOUTS)
  assert.ok(catalog.includes(layout.id), `thiếu layout ${layout.id}`)
assert.equal(DECK_THEMES.length, 6)
assert.equal(SLIDE_LAYOUTS.length, 19)

/* 7. Hợp đồng deck cũ vẫn đọc được (không hồi quy). */
const deck = parseAiDeck(
  '```json\n{"title":"Deck","slides":[{"layout":"bullets","title":"A","bullets":["x"]}]}\n```',
)
assert.ok(deck)
assert.equal(deck.title, 'Deck')
assert.equal(deck.slides[0].bullets?.length, 1)

/* Ép nhịp: không lặp layout liền kề, bullets ≤ 40%, đầu/cuối giữ nguyên. */
{
  const mk = (layout) => ({ title: layout, layout })
  const plan = enforceRhythm(
    ['title', 'bullets', 'bullets', 'bullets', 'bullets', 'bullets', 'bullets', 'closing'].map(mk),
  )
  for (let i = 1; i < plan.length; i++) assert.notEqual(plan[i].layout, plan[i - 1].layout, `lặp liền kề ở ${i}`)
  assert.equal(plan[0].layout, 'title')
  assert.equal(plan.at(-1).layout, 'closing')
  assert.ok(plan.filter((s) => s.layout === 'bullets').length <= Math.floor(plan.length * 0.4))
}

console.log('test-slide-plan: 7 nhóm kiểm tra đạt')
