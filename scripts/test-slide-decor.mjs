/**
 * Test bộ trang trí (lib/slideDecor.ts):
 *  - mỗi bộ trỏ tới hoạ tiết có thật
 *  - app đặt đúng vị trí thiết kế sẵn, không đè phần tử nào, slide nội dung tối đa 1 món
 *  - "tối giản" bỏ cả hoạ tiết mặc định; không có bộ thì giữ hoạ tiết mặc định (deck cũ)
 *  - slide nhiều chữ không trang trí; dựng lại bố cục giữ đúng bộ
 *  - dàn ý đọc/bỏ decorKit, suy mặc định theo style pack/môn
 * Chạy: npm run test:slide-decor
 */
import assert from 'node:assert/strict'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'
import { SLIDE_LAYOUTS, composeLayout, contentFromSlide, withPlaceholders } from '../src/lib/slideLayouts.ts'
import { graphicById } from '../src/lib/slideGraphics.ts'
import { DECOR_ANCHORS, DECOR_KITS } from '../src/lib/slideDecor.ts'
import { parseDeckPlan, slideCatalogText } from '../src/lib/aiDeck.ts'
import { planDecorKit, slideFromAi } from '../src/lib/slideAi.ts'

let passed = 0
const check = (name, fn) => {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    console.log(`  ✗ ${name}`)
    throw err
  }
}

const theme = DECK_THEMES[0]
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const kitEls = (els) => els.filter((el) => el.id.startsWith('decor-kit-'))
const OPENERS = new Set(['title', 'section', 'statement', 'closing'])

check('mỗi bộ trỏ tới hoạ tiết có thật', () => {
  for (const kit of DECOR_KITS) {
    for (const id of Object.values(kit.pieces ?? {})) assert.ok(graphicById(id), `${kit.id}: ${id}`)
  }
})

check('đặt đúng chỗ: trong khung, không đè phần tử nào, slide nội dung tối đa 1 món', () => {
  for (const kit of DECOR_KITS.filter((k) => k.pieces)) {
    for (const layout of SLIDE_LAYOUTS) {
      for (const theme of DECK_THEMES) {
        const els = composeLayout(theme, layout.id, { ...withPlaceholders(layout.id, {}), decorKit: kit.id })
        const decor = kitEls(els)
        const rest = els.filter((el) => !el.id.startsWith('decor-kit-') && el.w * el.h < 5000)
        assert.ok(decor.length <= (DECOR_ANCHORS[layout.id]?.length ?? 0), layout.id)
        if (!OPENERS.has(layout.id)) assert.ok(decor.length <= 1, `${layout.id}: slide nội dung chỉ 1 món`)
        for (const d of decor) {
          assert.ok(d.x >= 0 && d.y >= 0 && d.x + d.w <= 100 && d.y + d.h <= 100, `${kit.id}/${layout.id} ra ngoài khung`)
          for (const el of rest) assert.ok(!overlap(d, el), `${kit.id}/${layout.id}: ${d.graphicId} đè ${el.id}`)
        }
        assert.ok(!els.some((el) => /^decor-\d+$/.test(el.id)), `${layout.id}: bộ trang trí thay hoạ tiết mặc định`)
      }
    }
  }
})

check('bố cục có vị trí thì thật sự đặt được hoạ tiết (với nội dung mẫu)', () => {
  const miss = []
  for (const kit of DECOR_KITS.filter((k) => k.pieces)) {
    for (const [id, anchors] of Object.entries(DECOR_ANCHORS)) {
      const els = composeLayout(theme, id, { ...withPlaceholders(id, {}), decorKit: kit.id })
      const n = kitEls(els).length
      if (n !== anchors.length) miss.push(`${kit.id}/${id}: ${n}/${anchors.length}`)
    }
  }
  assert.deepEqual(miss, [], 'vị trí thiết kế sẵn bị vướng')
})

check('tối giản: không trang trí gì; không có bộ: giữ hoạ tiết mặc định của bố cục', () => {
  const plain = composeLayout(theme, 'statement', { body: 'Một thông điệp', decorKit: 'toi-gian' })
  assert.ok(!plain.some((el) => el.type === 'graphic'))
  const legacy = composeLayout(theme, 'statement', { body: 'Một thông điệp' })
  assert.ok(legacy.some((el) => el.id === 'decor-1'))
})

check('slide nhiều chữ không trang trí', () => {
  const long = Array.from({ length: 5 }, () => 'Một ý khá dài để slide dày chữ, kèm ví dụ cụ thể và số liệu minh hoạ')
  const els = composeLayout(theme, 'bullets', { title: 'Tiêu đề', bullets: long, decorKit: 've-tay' })
  assert.equal(kitEls(els).length, 0)
})

check('slide AI mang bộ của deck, dựng lại bố cục vẫn đúng bộ', () => {
  const slide = slideFromAi({ layout: 'quote', quote: 'Học, học nữa, học mãi.', author: 'Lênin', decorKit: 'la-xanh' }, theme)
  assert.equal(slide.decorKit, 'la-xanh')
  assert.equal(kitEls(slide.elements)[0]?.graphicId, 'orn-canh-la')
  const back = contentFromSlide(slide)
  assert.equal(back.decorKit, 'la-xanh')
  const relaid = composeLayout(theme, 'closing', { ...withPlaceholders('closing', back) })
  assert.ok(kitEls(relaid).some((el) => el.graphicId === 'orn-nhanh-la-goc'))
})

check('dàn ý: đọc decorKit hợp lệ, bỏ id lạ, mặc định theo style pack/môn', () => {
  const plan = (extra) =>
    parseDeckPlan(JSON.stringify({ title: 'Bài', theme: 'sang', slides: [{ title: 'A', layout: 'title' }], ...extra }))
  assert.equal(plan({ decorKit: 'lap-lanh' }).decorKit, 'lap-lanh')
  assert.equal(plan({ decorKit: 'khong-co' }).decorKit, undefined)
  assert.equal(planDecorKit({ ...plan({}), stylePack: 'consulting' }), 'toi-gian')
  assert.equal(planDecorKit({ ...plan({}), subject: 'toan', stylePack: undefined }), 'hinh-hoc')
  assert.ok(slideCatalogText().includes('decorKit'))
})

console.log(`\n${passed} nhóm test pass.`)
