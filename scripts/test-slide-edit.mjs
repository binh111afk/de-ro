/**
 * Test lệnh sửa slide bằng AI: parse, kiểm tra, áp lên deck (thuần).
 * Chạy: npm run test:slide-edit
 */
import assert from 'node:assert/strict'
import { applyEdits, looksLikeEdit, parseEditCommands } from '../src/lib/slideEdit.ts'
import { slideFromAi } from '../src/lib/slideAi.ts'
import { DECK_THEMES, normalizeTheme } from '../src/lib/slideTheme.ts'

const theme = DECK_THEMES[0]
const page = (title) => ({ layout: 'bullets', title, bullets: ['Ý thứ nhất', 'Ý thứ hai'] })
const deck = () => ({
  id: 'd',
  title: 'T',
  theme,
  slides: ['A', 'B', 'C'].map((t) => slideFromAi(page(t), theme)),
  createdAt: '',
  updatedAt: '',
})

// --- bước lọc
assert.equal(looksLikeEdit('đổi phông chữ sang Times New Roman'), true)
assert.equal(looksLikeEdit('thay bộ màu thành xanh rừng'), true)
assert.equal(looksLikeEdit('xoá slide 3'), true)
assert.equal(looksLikeEdit('soạn bài giảng về quang hợp'), false)
assert.equal(looksLikeEdit('sửa tiêu đề slide 2 thành Mở đầu'), true)
assert.equal(looksLikeEdit('rút gọn slide 3'), true)
assert.equal(looksLikeEdit('đổi bố cục slide 4 sang mốc thời gian'), true)

// --- parse
const parsed = parseEditCommands('```json\n{"action":"edit","commands":[{"op":"set_theme","theme":"rung"},{"op":"zzz"},{"op":"delete_slides","slides":[2]}]}\n```')
assert.deepEqual(parsed.ops.map((o) => o.op), ['set_theme', 'delete_slides'])
assert.equal(parsed.errors.length, 1, 'lệnh lạ bị báo')
assert.deepEqual(parseEditCommands('{"action":"none"}').ops, [])
assert.deepEqual(parseEditCommands('không phải json').ops, [])
assert.equal(parseEditCommands('{"action":"edit","commands":[{"op":"set_tone","tone":"xxx"}]}').ops.length, 0, 'tông sai bị loại')

// --- phông
{
  const r = applyEdits(deck(), [{ op: 'set_fonts', heading: 'times new roman', body: 'Arial' }])
  assert.equal(r.changed, true)
  const t = normalizeTheme(r.deck.theme)
  assert.ok(t.fonts.heading.includes('Times New Roman'))
  assert.ok(t.fonts.body.includes('Arial'))
  assert.equal(r.deck.slides.length, 3)
  assert.ok(r.deck.slides[0].elements.length > 0, 'slide được dựng lại')
  const bad = applyEdits(deck(), [{ op: 'set_fonts', heading: 'Georgia' }])
  assert.equal(bad.changed, false, 'Georgia làm vỡ dấu → không hỗ trợ')
}

// --- theme
{
  const r = applyEdits(deck(), [{ op: 'set_theme', theme: 'rung' }])
  assert.equal(normalizeTheme(r.deck.theme).id, 'rung')
  assert.notEqual(r.deck.slides[0].background, deck().slides[0].background, 'nền đổi theo theme mới')
  assert.equal(applyEdits(deck(), [{ op: 'set_theme', theme: 'khong-co' }]).changed, false)
  // phông đã đặt riêng được giữ khi đổi bộ màu sau đó
  const both = applyEdits(deck(), [{ op: 'set_fonts', heading: 'Arial' }, { op: 'set_theme', theme: 'rung' }])
  assert.equal(normalizeTheme(both.deck.theme).id, 'rung')
  assert.ok(normalizeTheme(both.deck.theme).fonts.heading.includes('Arial'), 'phông tiêu đề giữ nguyên')
}

// --- màu
{
  assert.equal(applyEdits(deck(), [{ op: 'set_colors', bg: '#ffffff', fg: '#eeeeee' }]).changed, false, 'tương phản thấp bị chặn')
  assert.equal(applyEdits(deck(), [{ op: 'set_colors', accent: 'đỏ' }]).changed, false, 'không phải hex')
  const ok = applyEdits(deck(), [{ op: 'set_colors', accent: '#b4532a' }])
  assert.equal(ok.deck.theme.accent, '#b4532a')
}

// --- tông / hiệu ứng / xoá / dời
{
  const tone = applyEdits(deck(), [{ op: 'set_tone', tone: 'accent', slides: [1] }])
  assert.equal(tone.deck.slides[0].tone, 'accent')
  assert.notEqual(tone.deck.slides[1].tone, 'accent')
  assert.equal(applyEdits(deck(), [{ op: 'set_transition', transition: 'fade' }]).deck.slides.every((s) => s.transition === 'fade'), true)
  const del = applyEdits(deck(), [{ op: 'delete_slides', slides: [2, 9] }])
  assert.equal(del.deck.slides.length, 2)
  assert.equal(applyEdits(deck(), [{ op: 'delete_slides', slides: [1, 2, 3] }]).changed, false, 'không xoá hết')
  const d = deck()
  const moved = applyEdits(d, [{ op: 'move_slide', from: 3, to: 1 }])
  assert.equal(moved.deck.slides[0].id, d.slides[2].id)
  assert.equal(applyEdits(d, [{ op: 'move_slide', from: 0, to: 9 }]).changed, false)
}

// --- sửa nội dung một slide: chỉ field nêu mới đổi
{
  const d = deck()
  const before = d.slides[1]
  const r = applyEdits(d, [{ op: 'edit_slide', slide: 2, fields: { title: 'Tiêu đề mới', khongHopLe: 1 } }])
  assert.equal(r.changed, true)
  const s = r.deck.slides[1]
  assert.equal(s.id, before.id, 'giữ id slide')
  assert.equal(s.layout, 'bullets', 'giữ bố cục')
  const texts = s.elements.filter((e) => e.type === 'text').map((e) => e.text)
  assert.ok(texts.includes('Tiêu đề mới'))
  assert.ok(texts.some((t) => t.includes('Ý thứ nhất') && t.includes('Ý thứ hai')), 'ý cũ giữ nguyên')
  assert.equal(r.deck.slides[0], d.slides[0], 'slide khác không đụng')
  const kept = applyEdits(d, [{ op: 'edit_slide', slide: 1, fields: { bullets: ['Chỉ một ý mới'] } }]).deck.slides[0]
  const kt = kept.elements.filter((e) => e.type === 'text').map((e) => e.text)
  assert.ok(kt.includes('A'), 'tiêu đề giữ nguyên khi chỉ đổi ý')
  assert.ok(kt.some((t) => t.includes('Chỉ một ý mới')))
  assert.equal(applyEdits(d, [{ op: 'edit_slide', slide: 2, fields: { bullets: [] } }]).changed, false, 'xoá hết ý → bị chặn')
  assert.equal(applyEdits(d, [{ op: 'edit_slide', slide: 9, fields: { title: 'x' } }]).changed, false)
  assert.equal(applyEdits(d, [{ op: 'edit_slide', slide: 1, fields: { image: 'x' } }]).changed, false, 'không cho đổi ảnh')
}

// --- đổi bố cục
{
  const d = deck()
  const r = applyEdits(d, [{ op: 'set_layout', slide: 1, layout: 'cards' }])
  assert.equal(r.deck.slides[0].layout, 'cards')
  assert.equal(applyEdits(d, [{ op: 'set_layout', slide: 1, layout: 'timeline' }]).changed, false, '2 ý chưa đủ cho timeline (cần ≥3) → bị chặn')
  assert.equal(r.changed, true)
  assert.equal(applyEdits(d, [{ op: 'set_layout', slide: 1, layout: 'khong-co' }]).changed, false)
}

// --- lệnh bổ sung
{
  const d = deck()
  const added = applyEdits(d, [{ op: 'add_slide', layout: 'statement', fields: { body: 'Một câu chốt ý.' }, position: 2 }])
  assert.equal(added.deck.slides.length, 4)
  assert.equal(added.deck.slides[1].layout, 'statement', 'chèn đúng vị trí')
  assert.equal(applyEdits(d, [{ op: 'add_slide', layout: 'statement', fields: {} }]).changed, false, 'thiếu field bắt buộc → bị chặn')
  const dup = applyEdits(d, [{ op: 'duplicate_slide', slide: 1 }])
  assert.equal(dup.deck.slides.length, 4)
  assert.notEqual(dup.deck.slides[1].id, dup.deck.slides[0].id)
  assert.equal(applyEdits(d, [{ op: 'set_notes', slide: 2, notes: ' Nhắc học sinh ' }]).deck.slides[1].notes, 'Nhắc học sinh')
  assert.equal(applyEdits(d, [{ op: 'rename_deck', title: 'Bài mới' }]).deck.title, 'Bài mới')
  assert.equal(parseEditCommands('{"action":"edit","commands":[{"op":"rename_deck","title":"  "}]}').ops.length, 0)
}

// --- deck HTML: giao diện không đổi được, xoá/dời vẫn được
{
  const d = { ...deck(), format: 'html', slides: ['A', 'B'].map((t, i) => ({ id: `h${i}`, background: '#fff', elements: [], html: '<p>x</p>' })) }
  assert.equal(applyEdits(d, [{ op: 'set_theme', theme: 'rung' }]).changed, false)
  assert.equal(applyEdits(d, [{ op: 'delete_slides', slides: [1] }]).deck.slides.length, 1)
}

// --- deck gốc không bị đổi
{
  const d = deck()
  const before = JSON.stringify(d)
  applyEdits(d, [{ op: 'set_theme', theme: 'tim' }, { op: 'delete_slides', slides: [1] }])
  assert.equal(JSON.stringify(d), before)
}

console.log('test-slide-edit: parse/phông/theme/màu/tông/xoá/dời/HTML pass')
