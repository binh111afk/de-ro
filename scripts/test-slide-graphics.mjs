/**
 * Test kho đồ hoạ vector (chặng 2):
 *  - registry 232 icon, id duy nhất, SVG hợp lệ (2 path, không chữ, không nền)
 *  - search theo tiếng Việt có dấu/không dấu
 *  - graphicMarkup đổi màu nét + phủ kín hộp
 *  - catalog gửi model có đủ id
 *  - layout title/bullets dùng graphic, đọc lại được bằng contentFromSlide
 *  - sanitizeSlide nhận id hợp lệ và bỏ id lạ
 * Chạy: npm run test:slide-graphics
 */
import assert from 'node:assert/strict'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'
import { SLIDE_LAYOUTS, composeLayout, contentFromSlide } from '../src/lib/slideLayouts.ts'
import {
  GRAPHIC_IDS,
  SLIDE_GRAPHICS,
  graphicById,
  graphicCatalogText,
  graphicMarkup,
  isGraphicId,
  searchGraphics,
} from '../src/lib/slideGraphics.ts'
import { sanitizeSlide, pageSystemPrompt } from '../src/lib/slideAi.ts'

let passed = 0
const check = (name, fn) => {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    console.error(`  ✗ ${name}`)
    throw err
  }
}

console.log('\n[1] registry')

check('232 icon, id duy nhất', () => {
  assert.equal(SLIDE_GRAPHICS.length, 232)
  assert.equal(GRAPHIC_IDS.size, 232)
})

check('mỗi icon: 2 path, nét gốc #22333B, không chữ/nền/ảnh ngoài', () => {
  for (const graphic of SLIDE_GRAPHICS) {
    assert.ok(graphic.svg.startsWith('<svg'), graphic.id)
    assert.equal((graphic.svg.match(/<path/g) ?? []).length, 2, graphic.id)
    assert.ok(graphic.svg.includes('#22333B'), graphic.id)
    assert.ok(!graphic.svg.includes('<text'), graphic.id)
    assert.ok(!graphic.svg.includes('<rect'), graphic.id)
    assert.ok(!graphic.svg.includes('<image'), graphic.id)
    assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(graphic.svg), graphic.id)
    assert.ok(graphic.svg.includes('viewBox="'), graphic.id)
  }
})

check('78 ornament: tra được, nét đổi màu được, không vào catalog/AI', () => {
  const ids = ['orn-ke-song', 'orn-nguyet-que', 'orn-the-so-5', 'orn-nen-song']
  for (const id of ids) {
    assert.ok(graphicById(id), id)
    assert.equal(isGraphicId(id), false, id)
    assert.ok(graphicMarkup(id, '#ff0000').includes('#ff0000'), id)
  }
  assert.ok(!graphicCatalogText().includes('orn-'))
  assert.ok(!searchGraphics('hoa trang tri duong ke song').some((g) => g.id.startsWith('orn-')))
})

check('id hợp lệ / id lạ', () => {
  assert.equal(isGraphicId('math-eke'), true)
  assert.equal(isGraphicId('math-khong-ton-tai'), false)
  assert.equal(isGraphicId(undefined), false)
})

console.log('\n[2] search')

check('tìm theo tên có dấu', () => {
  const ids = searchGraphics('đường tròn').map((g) => g.id)
  assert.ok(ids.includes('math-duong-tron'))
})

check('tìm không dấu', () => {
  const ids = searchGraphics('thuoc ke').map((g) => g.id)
  assert.ok(ids.includes('math-thuoc-ke'))
})

check('tìm theo keyword môn học', () => {
  const ids = searchGraphics('hoa hoc').map((g) => g.id)
  assert.ok(ids.includes('sci-ong-nghiem'))
})

check('chuỗi rỗng không trả kết quả', () => {
  assert.deepEqual(searchGraphics(''), [])
})

console.log('\n[3] render / catalog')

check('graphicMarkup đổi màu nét và phủ kín hộp', () => {
  const svg = graphicMarkup('math-eke', '#FFFFFF')
  assert.ok(svg.includes('stroke="#FFFFFF"'))
  assert.ok(!svg.includes('#22333B'))
  assert.ok(svg.includes('width="100%"'))
  assert.ok(svg.includes('preserveAspectRatio'))
})

check('id lạ → chuỗi rỗng', () => {
  assert.equal(graphicMarkup('khong-co'), '')
})

check('catalog có đủ 232 id, gom theo nhóm', () => {
  const text = graphicCatalogText()
  for (const id of GRAPHIC_IDS) assert.ok(text.includes(`${id}=`), id)
  assert.ok(text.includes('math: '))
  assert.ok(text.includes('class: '))
})

console.log('\n[4] layout + AI')

const theme = DECK_THEMES[0]
const content = {
  title: 'Hệ thức lượng trong tam giác vuông',
  bullets: ['Định lý Pythagore', 'Tỉ số lượng giác', 'Hệ thức cạnh và đường cao'],
  graphic: 'math-tam-giac',
}

check('layout title gắn graphic vào panel bìa', () => {
  const els = composeLayout(theme, 'title', content)
  const graphic = els.find((el) => el.type === 'graphic')
  assert.ok(graphic)
  assert.equal(graphic.graphicId, 'math-tam-giac')
})

check('layout bullets thay icon neo bằng graphic', () => {
  const els = composeLayout(theme, 'bullets', content)
  const graphic = els.find((el) => el.type === 'graphic')
  assert.ok(graphic)
  assert.equal(graphic.id, 'bullet-graphic')
  assert.ok(!els.some((el) => el.id === 'bullet-anchor-icon'))
})

check('layout ảnh dùng graphic thay ảnh, không còn khung ảnh trống', () => {
  const els = composeLayout(theme, 'image-left', content)
  const graphic = els.find((el) => el.type === 'graphic' && !el.graphicId?.startsWith('orn-'))
  assert.ok(graphic)
  assert.equal(graphic.id, 'image-1')
  assert.ok(!els.some((el) => el.type === 'image'))
})

check('id lạ bị bỏ, layout vẫn dựng bình thường', () => {
  const els = composeLayout(theme, 'title', { ...content, graphic: 'khong-co' })
  assert.ok(!els.some((el) => el.type === 'graphic' && !el.graphicId?.startsWith('orn-')))
  assert.ok(els.some((el) => el.id === 'hero-icon'))
})

check('contentFromSlide đọc lại graphic khi đổi layout', () => {
  const els = composeLayout(theme, 'bullets', content)
  const slide = {
    id: 's1',
    background: '#fff',
    elements: els,
  }
  assert.equal(contentFromSlide(slide).graphic, 'math-tam-giac')
})

check('sanitizeSlide nhận graphic hợp lệ, bỏ id lạ', () => {
  const good = sanitizeSlide({ title: 'A', graphic: 'sci-ten-lua' }, 'title')
  assert.equal(good.graphic, 'sci-ten-lua')
  const bad = sanitizeSlide({ title: 'A', graphic: 'khong-co' }, 'title')
  assert.equal(bad.graphic, undefined)
})

check('prompt title/bullets có catalog, layout khác thì không', () => {
  const plan = {
    title: 'Deck',
    theme: 'sang',
    slides: [{ title: 'A', layout: 'title' }],
  }
  const titlePrompt = pageSystemPrompt(plan, plan.slides[0], 0)
  assert.ok(titlePrompt.includes('ĐỒ HOẠ CÓ SẴN'))
  assert.ok(titlePrompt.includes('math-eke='))
  const quizPlan = { ...plan, slides: [{ title: 'B', layout: 'quiz' }] }
  assert.ok(!pageSystemPrompt(quizPlan, quizPlan.slides[0], 0).includes('ĐỒ HOẠ CÓ SẴN'))
})

check('prompt layout ảnh khuyên dùng graphic thay vẽ ảnh', () => {
  const plan = {
    title: 'Deck',
    theme: 'sang',
    slides: [{ title: 'A', layout: 'image-right' }],
  }
  const prompt = pageSystemPrompt(plan, plan.slides[0], 0)
  assert.ok(prompt.includes('ĐỒ HOẠ CÓ SẴN'))
  assert.ok(prompt.includes('45–90 giây') && prompt.includes('ĐỂ TRỐNG "image"'))
})

check('19 layout vẫn dựng được với graphic', () => {
  for (const layout of SLIDE_LAYOUTS) {
    const els = composeLayout(theme, layout.id, { ...content, graphic: 'math-eke' })
    assert.ok(Array.isArray(els), layout.id)
  }
})

check('catalog theo môn: chỉ gửi nhóm hợp với môn, đủ icon mới', () => {
  const full = graphicCatalogText()
  const cs = graphicCatalogText(['cs', 'prog'])
  assert.ok(cs.includes('prog-python=Python') && cs.includes('cs-laptop='))
  assert.ok(!cs.includes('bio: ') && !cs.includes('math: '), 'không lẫn nhóm môn khác')
  assert.ok(cs.length < full.length / 4, 'nhỏ hơn nhiều so với catalog đầy đủ')
  for (const group of ['cs', 'prog', 'eng', 'geo', 'his', 'lit', 'bio', 'chem', 'phys', 'art', 'pe', 'life']) {
    assert.ok(full.includes(`${group}: `), `thiếu nhóm ${group}`)
  }
})

console.log(`\n${passed} nhóm test pass.`)
