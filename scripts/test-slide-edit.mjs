/**
 * Test lệnh sửa slide bằng AI: parse, kiểm tra, áp lên deck (thuần).
 * Chạy: npm run test:slide-edit
 */
import assert from 'node:assert/strict'
import { sanitizeSlide, slideFromAi } from '../src/lib/slideAi.ts'
import { applyDeckDesign, applyEdits, looksLikeEdit, parseEditCommands } from '../src/lib/slideEdit.ts'
import { designById } from '../src/lib/slideDesigns.ts'
import { contentFromSlide } from '../src/lib/slideLayouts.ts'
import { textBoxHeight } from '../src/lib/slideMeasure.ts'
import { DECK_THEMES, normalizeTheme } from '../src/lib/slideTheme.ts'
import { applyTextFormat, captureTextFormat, clearTextFormatting, normalizeSlideHref, shouldShowSlideFooter } from '../src/lib/slideFormat.ts'
import { buildDeckPptx } from '../src/lib/exportDeck.ts'

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
assert.equal(looksLikeEdit('slide 2 có 5 loại biểu đồ, bạn sửa lại thành 5 mục riêng rẽ đi, ghi đầy đủ là biểu đồ gì'), true)

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
  const newFonts = applyEdits(deck(), [{ op: 'set_fonts', heading: 'barlow-condensed', body: 'Source Serif 4' }])
  assert.match(newFonts.deck.theme.fontHeading, /Barlow Condensed/)
  assert.match(newFonts.deck.theme.fontBody, /Source Serif 4/)
  const bad = applyEdits(deck(), [{ op: 'set_fonts', heading: 'Phông không tồn tại' }])
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

// --- 5–6 thẻ giữ đủ tên biểu đồ, vừa khung. Quá 6 mục phải báo rõ.
{
  const items = [
    'Biểu đồ cột đơn',
    'Biểu đồ cột ghép',
    'Biểu đồ đoạn thẳng',
    'Biểu đồ hình quạt tròn',
    'Biểu đồ tranh',
    'Biểu đồ phân tán',
  ]
  const d = deck()
  d.slides[1] = slideFromAi({ layout: 'cards', title: 'Các loại biểu đồ', items: items.slice(0, 4) }, theme)
  const editItems = (input, list) => applyEdits(input, [{ op: 'edit_slide', slide: 2, fields: { items: list } }])
  const dense = items.map((item) => `${item}: dùng để trình bày số liệu và so sánh các đại lượng trong một tập dữ liệu.`)
  for (const expected of [items.slice(0, 5), items, dense]) {
    const result = editItems(d, expected)
    assert.equal(result.changed, true)
    const slide = result.deck.slides[1]
    assert.equal(slide.id, d.slides[1].id)
    assert.deepEqual(contentFromSlide(slide).items, expected)
    for (const [index, item] of expected.entries()) {
      const box = slide.elements.find((e) => e.id === `card-${index + 1}`)
      const panel = slide.elements.find((e) => e.id === `card-${index + 1}-panel`)
      assert.equal(box.text, item)
      assert.ok(textBoxHeight(box.text, box.w, box.fontSize, box.lineHeight ?? 1.4, { weight: box.fontWeight }) <= box.h + 0.05)
      assert.ok(box.y >= panel.y && box.y + box.h <= panel.y + panel.h)
    }
  }
  const overflow = editItems(d, [...items, 'Biểu đồ miền'])
  assert.equal(overflow.deck, d)
  assert.match(overflow.summary[0], /slide 2.*danh sách thẻ có 7 mục.*chia nội dung thành hai slide/)

  const agenda = deck()
  agenda.slides[1] = slideFromAi({ layout: 'agenda', title: 'Các loại biểu đồ', items: items.slice(0, 5) }, theme)
  for (const input of [deck(), agenda]) {
    const converted = editItems(input, items)
    assert.equal(converted.deck.slides.length, input.slides.length)
    assert.equal(converted.deck.slides[1].layout, 'cards')
    assert.equal(converted.deck.slides[1].id, input.slides[1].id)
    assert.equal(converted.deck.slides[0], input.slides[0])
    assert.deepEqual(contentFromSlide(converted.deck.slides[1]).items, items)
  }
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

// --- applyDeckDesign: không thêm/bớt slide, idempotent A -> B -> A, giữ phần tử tự thêm, freeform, html, clear -> null
{
  const titleSlide = slideFromAi({ layout: 'title', kicker: 'BÀI 1', title: 'Quang hợp', subtitle: 'Sinh học 11' }, theme)
  titleSlide.notes = 'Ghi chú trang bìa'
  const userShape = { id: 'u1234567', type: 'shape', shape: 'ellipse', x: 82, y: 12, w: 8, h: 10, fill: '#ff0000' }
  const userText = { id: 'u7654321', type: 'text', x: 80, y: 80, w: 15, h: 6, text: 'Nhãn riêng' }
  const bulletSlide = slideFromAi(page('Cơ chế'), theme)
  bulletSlide.elements = [...bulletSlide.elements, userShape, userText]
  const freeformSlide = {
    id: 'free-1',
    background: theme.bg,
    elements: [{ id: 'free-t', type: 'text', x: 10, y: 20, w: 60, h: 12, text: 'Slide tự do' }],
  }
  const customBgFreeform = {
    id: 'free-custom',
    background: '#123456',
    customBg: true,
    elements: [{ id: 'free-c', type: 'text', x: 10, y: 20, w: 60, h: 12, text: 'Nền riêng' }],
  }
  const htmlSlide = { id: 'html-1', background: '#ffffff', elements: [], html: '<h1>HTML</h1>' }

  const baseDeck = {
    id: 'd-design',
    title: 'Test',
    theme,
    slides: [titleSlide, bulletSlide, freeformSlide, customBgFreeform, htmlSlide],
    createdAt: '',
    updatedAt: '',
  }

  const tech = designById('cong-nghe')
  const elegant = designById('thanh-lich')
  assert.ok(tech && elegant)

  const afterTech1 = applyDeckDesign(baseDeck, tech)
  assert.equal(afterTech1.design, 'cong-nghe')
  assert.equal(afterTech1.slides.length, 5)
  assert.deepEqual(afterTech1.slides.map((s) => s.id), baseDeck.slides.map((s) => s.id))
  assert.equal(afterTech1.slides[0].notes, 'Ghi chú trang bìa')
  assert.equal(afterTech1.slides[4].html, '<h1>HTML</h1>')
  assert.equal(afterTech1.slides[2].elements[0].text, 'Slide tự do')
  assert.equal(afterTech1.slides[3].background, '#123456')

  // Áp lại A -> B -> A không chồng motif, không lồng "[ ... ]" hay "> EXECUTE:"
  const afterElegant = applyDeckDesign(afterTech1, elegant)
  const afterTech2 = applyDeckDesign(afterElegant, tech)
  assert.equal(afterTech2.slides[0].elements.length, afterTech1.slides[0].elements.length)
  assert.equal(afterTech2.slides[1].elements.length, afterTech1.slides[1].elements.length)
  const techTitle = afterTech2.slides[0].elements.find((e) => e.id === 'title')?.text
  const techKicker = afterTech2.slides[0].elements.find((e) => e.id === 'kicker')?.text
  assert.equal(techTitle, '[ Quang hợp ]')
  assert.equal(techKicker, '> EXECUTE: BÀI 1')

  // Phần tử người dùng tự thêm vẫn còn nguyên
  assert.ok(afterTech2.slides[1].elements.some((e) => e.id === 'u1234567' && e.shape === 'ellipse'))
  assert.ok(afterTech2.slides[1].elements.some((e) => e.id === 'u7654321' && e.text === 'Nhãn riêng'))

  // Gỡ thiết kế -> gỡ motif, bỏ ngoặc/prefix của skin, giữ phần tử tự thêm
  const cleared = applyDeckDesign(afterTech2, null)
  assert.equal(cleared.design, undefined)
  assert.equal(cleared.slides.length, 5)
  assert.equal(cleared.slides[0].elements.find((e) => e.id === 'title')?.text, 'Quang hợp')
  assert.equal(cleared.slides[0].elements.find((e) => e.id === 'kicker')?.text, 'BÀI 1')
  assert.equal(cleared.slides[0].elements.some((e) => e.decor || e.id.startsWith('skin-motif-')), false)
  assert.ok(cleared.slides[1].elements.some((e) => e.id === 'u1234567'))
  assert.ok(cleared.slides[1].elements.some((e) => e.id === 'u7654321'))
}

// --- chuẩn hoá liên kết (chặn javascript:, tự thêm https://)
assert.equal(normalizeSlideHref('vi.wikipedia.org/wiki/Toán'), 'https://vi.wikipedia.org/wiki/To%C3%A1n')
assert.equal(normalizeSlideHref('http://example.com/bai'), 'http://example.com/bai')
assert.equal(normalizeSlideHref('https://example.com'), 'https://example.com/')
assert.equal(normalizeSlideHref('javascript:alert(1)'), null)
assert.equal(normalizeSlideHref('  JaVaScRiPt:void(0)'), null)
assert.equal(normalizeSlideHref('data:text/html,<script>'), null)
assert.equal(normalizeSlideHref('not a url'), null)
assert.equal(normalizeSlideHref('   '), null)

// --- xoá định dạng chữ (giữ cỡ chữ, căn lề, toạ độ; bỏ **đậm**)
{
  const el = {
    id: 't1',
    type: 'text',
    x: 10,
    y: 20,
    w: 50,
    h: 15,
    text: 'Nội dung **quan trọng** và $x^{2}$',
    fontSize: 3.6,
    align: 'center',
    fontWeight: 700,
    fontStyle: 'italic',
    textDecoration: 'line-through',
    textColor: '#dc2626',
    fontFamily: 'Times New Roman',
    highlight: '#fef08a',
    letterSpacing: 0.08,
    lineHeight: 1.5,
  }
  const merged = { ...el, ...clearTextFormatting(el) }
  assert.equal(merged.text, 'Nội dung quan trọng và $x^{2}$')
  assert.equal(merged.fontSize, 3.6)
  assert.equal(merged.align, 'center')
  assert.equal(merged.x, 10)
  assert.equal(merged.fontWeight, undefined)
  assert.equal(merged.fontStyle, undefined)
  assert.equal(merged.textDecoration, undefined)
  assert.equal(merged.textColor, undefined)
  assert.equal(merged.fontFamily, undefined)
  assert.equal(merged.highlight, undefined)
  assert.equal(merged.letterSpacing, undefined)
  assert.equal(merged.lineHeight, undefined)
}

// --- sao chép định dạng (cây cọ): bắt đủ thuộc tính và ghi đè sạch đích
{
  const src = {
    id: 'src',
    type: 'text',
    x: 5,
    y: 5,
    w: 40,
    h: 10,
    text: 'Nguồn',
    fontWeight: 700,
    fontStyle: 'italic',
    textDecoration: 'line-through',
    textColor: '#1d4ed8',
    fontFamily: 'Georgia',
    highlight: '#fde047',
    textStroke: { width: 2, color: '#111111' },
    textShadow: { x: 2, y: 3, blur: 4, color: '#111111' },
    textGradient: { from: '#112233', to: '#445566', angle: 45 },
    textArc: -90,
    fontSize: 4,
    align: 'right',
  }
  const sample = captureTextFormat(src)
  assert.ok(sample)
  assert.equal(captureTextFormat({ id: 's1', type: 'shape', x: 0, y: 0, w: 10, h: 10 }), null)
  const target = {
    id: 'dst',
    type: 'text',
    x: 20,
    y: 30,
    w: 40,
    h: 10,
    text: 'Đích',
    letterSpacing: 0.1,
    lineHeight: 1.6,
    fontWeight: 400,
    align: 'left',
  }
  const painted = { ...target, ...applyTextFormat(sample) }
  assert.equal(painted.fontWeight, 700)
  assert.equal(painted.fontStyle, 'italic')
  assert.equal(painted.textDecoration, 'line-through')
  assert.equal(painted.highlight, '#fde047')
  assert.equal(painted.fontSize, 4)
  assert.equal(painted.align, 'right')
  assert.equal(painted.letterSpacing, undefined)
  assert.equal(painted.lineHeight, undefined)
  assert.equal(painted.text, 'Đích')
  const cleared = { ...painted, ...clearTextFormatting(painted) }
  for (const key of ['textStroke', 'textShadow', 'textGradient', 'textArc']) {
    assert.deepEqual(painted[key], src[key])
    assert.equal(cleared[key], undefined)
  }
}

{
  const page = sanitizeSlide({
    title: 'Ánh sáng',
    textStyles: {
      title: { fontFamily: 'playfair-display', textArc: 190, textStroke: { width: 2, color: '#123456' } },
      subtitle: { textGradient: { from: 'url(bad)', to: '#000000', angle: 50 } },
    },
  }, 'title')
  assert.deepEqual(page.textStyles, {
    title: { fontFamily: 'Playfair Display', textArc: 180, textStroke: { width: 2, color: '#123456' } },
    subtitle: {},
  })
  const title = slideFromAi(page, normalizeTheme(deck().theme)).elements.find(el => el.id === 'title')
  assert.equal(title.textArc, 180)
  assert.equal(title.fontFamily, 'Playfair Display')
}

// --- điều kiện hiện chân trang & xuất PPTX có gạch ngang, tô sáng, liên kết, chân trang
{
  const footer = { slideNumber: true, text: 'Trường THPT A', skipTitle: true }
  assert.equal(shouldShowSlideFooter(footer, { layout: 'title' }, 0), false)
  assert.equal(shouldShowSlideFooter(footer, { layout: 'bullets' }, 0), false)
  assert.equal(shouldShowSlideFooter(footer, { layout: 'title' }, 1), false)
  assert.equal(shouldShowSlideFooter(footer, { layout: 'bullets' }, 1), true)

  const sampleDeck = {
    id: 'd-fmt',
    title: 'Định dạng',
    theme,
    footer,
    slides: [
      {
        id: 's1',
        layout: 'title',
        background: '#ffffff',
        elements: [{ id: 't1', type: 'text', x: 10, y: 40, w: 80, h: 12, text: 'Tiêu đề bài học' }],
      },
      {
        id: 's2',
        layout: 'bullets',
        background: '#ffffff',
        elements: [
          {
            id: 't2',
            type: 'text',
            x: 10,
            y: 20,
            w: 80,
            h: 20,
            text: 'Chữ gạch ngang tô sáng',
            textDecoration: 'line-through',
            fontFamily: 'Oswald, Arial',
            textStroke: { width: 2, color: '#223344' },
            textShadow: { x: 3, y: 4, blur: 0, color: '#445566' },
            textGradient: { from: '#203040', to: '#405060', angle: 90 },
            highlight: '#fef08a',
            href: 'https://vi.wikipedia.org/',
          },
        ],
      },
    ],
    createdAt: '',
    updatedAt: '',
  }
  const ab = await buildDeckPptx(sampleDeck)
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(ab)
  const s1Xml = await zip.file('ppt/slides/slide1.xml').async('string')
  const s2Xml = await zip.file('ppt/slides/slide2.xml').async('string')
  const s2Rels = await zip.file('ppt/slides/_rels/slide2.xml.rels').async('string')
  assert.ok(!s1Xml.includes('Trường THPT A'), 'skipTitle phải ẩn chân trang ở slide đầu')
  assert.match(s2Xml, /<a:rPr\b[^>]*>(?:(?!<\/a:rPr>)[\s\S])*?<a:outerShdw blurRad="0" dist="45720"/, 'bóng nằm ở run chữ PPTX')
  assert.match(s2Xml, /<a:ln w="\d+"><a:solidFill><a:srgbClr val="223344"/, 'viền chữ PPTX')
  assert.match(s2Xml, /<a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="203040">.*?<a:gs pos="100000"><a:srgbClr val="405060">/, 'hai màu gradient của chữ PPTX')
  assert.match(s2Xml, /<a:latin typeface="Oswald"/, 'giữ tên phông PPTX')
  assert.ok(s2Xml.includes('strike="sngStrike"'), 'PPTX phải có gạch ngang strike')
  assert.ok(s2Xml.includes('<a:highlight><a:srgbClr val="FEF08A"/></a:highlight>'), 'PPTX phải có highlight FEF08A')
  assert.ok(s2Xml.includes('<a:hlinkClick'), 'PPTX phải gắn hlinkClick')
  assert.ok(s2Rels.includes('https://vi.wikipedia.org/'), 'PPTX rels phải chứa URL')
  assert.ok(s2Xml.includes('Trường THPT A') && s2Xml.includes('>2<'), 'PPTX slide 2 phải có chân trang và số trang')
}

console.log('test-slide-edit: parse/phông/theme/màu/tông/xoá/dời/HTML/applyDeckDesign/format pass')
