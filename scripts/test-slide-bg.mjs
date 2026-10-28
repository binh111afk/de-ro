/**
 * Test nền slide riêng: chữ tối tự đổi sáng trên nền tối, dựng lại bố cục vẫn giữ nền, gradient xuất được ra SVG.
 * Chạy: npm run test:slide-bg
 */
import assert from 'node:assert/strict'
import { BACKGROUNDS, firstColor, gradientSvg, keepCustomBg, withBackground } from '../src/lib/slideBackground.ts'
import { composeLayout } from '../src/lib/slideLayouts.ts'
import { recomposeSlide } from '../src/lib/slideEdit.ts'
import { DECK_THEMES, contrastRatio, normalizeTheme } from '../src/lib/slideTheme.ts'

const theme = normalizeTheme(DECK_THEMES[0])
const slide = {
  id: 's',
  background: '#ffffff',
  layout: 'bullets',
  elements: composeLayout(theme, 'bullets', { title: 'Tiêu đề', bullets: ['Ý một', 'Ý hai'] }),
}

// mọi nền: tiêu đề/nhãn nằm thẳng trên nền slide phải đọc được (tương phản >= 3); chữ trên panel thì không đụng
for (const bg of BACKGROUNDS.map((b) => b.value)) {
  const out = withBackground(slide, bg, theme.fg)
  assert.equal(out.background, bg)
  assert.equal(out.customBg, true)
  const colors = bg.match(/#[0-9a-f]{6}/gi)
  for (const el of out.elements.filter((e) => e.id === 'title' || e.id === 'kicker')) {
    for (const c of colors) assert.ok(contrastRatio(el.textColor ?? theme.fg, c) >= 3, `${bg}: chữ "${el.text}" khó đọc`)
  }
}

// chữ nằm trên thẻ có màu riêng thì giữ nguyên (nền slide không ảnh hưởng), chỉ tiêu đề ngoài thẻ đổi sáng
const cards = {
  id: 'c',
  background: '#ffffff',
  layout: 'cards',
  elements: composeLayout(theme, 'cards', { title: 'Ba thẻ', items: ['Một: a', 'Hai: b', 'Ba: c'] }),
}
const darkCards = withBackground(cards, '#0f172a', theme.fg)
for (const el of darkCards.elements) {
  const before = cards.elements.find((e) => e.id === el.id)
  if (/^card-\d+(-heading)?$/.test(el.id)) assert.equal(el.textColor, before.textColor, `${el.id}: chữ trên thẻ phải giữ màu`)
}
assert.notEqual(darkCards.elements.find((e) => e.id === 'title').textColor, cards.elements.find((e) => e.id === 'title').textColor, 'tiêu đề ngoài thẻ đổi sáng')

// đổi chủ đề / dựng lại bố cục: nền riêng và chữ đọc được vẫn còn
const dark = withBackground(slide, '#0f172a', theme.fg)
const rebuilt = recomposeSlide(normalizeTheme(DECK_THEMES[1]), dark)
assert.equal(rebuilt.background, '#0f172a')
assert.equal(rebuilt.customBg, true)
assert.ok(rebuilt.elements.some((e) => e.type === 'text' && e.textColor !== undefined), 'chữ được đổi sang màu sáng')
assert.equal(keepCustomBg(slide, { ...slide, background: '#abcdef' }, theme.fg).background, '#abcdef', 'slide không có nền riêng thì không ép')

// gradient
assert.equal(firstColor('linear-gradient(135deg, #1e3a8a, #7c3aed)'), '#1e3a8a')
assert.match(gradientSvg('linear-gradient(135deg, #1e3a8a, #7c3aed)'), /<stop offset="1" stop-color="#7c3aed"\/>/)
assert.equal(gradientSvg('#ffffff'), null)
console.log('test-slide-bg: pass')

// ảnh nền: CSS phủ kín + lớp phủ cùng màu trung bình; chữ đọc theo màu trung bình; dựng lại bố cục vẫn giữ ảnh
import { slideBgStyle } from '../src/lib/slideBackground.ts'
assert.deepEqual(slideBgStyle({ background: '#ffffff' }), { background: '#ffffff' })
const photo = withBackground({ ...slide, bgImage: 'data:image/jpeg;base64,AAAA' }, '#101820', theme.fg)
const css = slideBgStyle(photo)
assert.match(css.backgroundImage, /linear-gradient\(#1018204d, #1018204d\), url\("data:image\/jpeg;base64,AAAA"\)/)
assert.equal(css.backgroundSize, 'cover')
assert.ok(contrastRatio(photo.elements.find((e) => e.id === 'title').textColor ?? theme.fg, '#101820') >= 3, 'tiêu đề đọc được trên ảnh tối')
assert.equal(recomposeSlide(normalizeTheme(DECK_THEMES[1]), photo).bgImage, 'data:image/jpeg;base64,AAAA', 'đổi chủ đề giữ ảnh nền')
console.log('test-slide-bg (ảnh nền): pass')
