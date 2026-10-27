/**
 * Test theme v2 của slide: chuẩn hoá theme cũ, tương phản chữ, tra theme theo id
 * và tính toàn vẹn của catalog (10 theme, 4 hoạ tiết, 4 theme theo môn).
 * Chạy: npm run test:slide-theme
 */
import assert from 'node:assert/strict'
import {
  DECK_THEMES,
  contrastRatio,
  normalizeTheme,
  readableTextOn,
  themeById,
} from '../src/lib/slideTheme.ts'

/* 1. Theme cũ (lưu từ trước chặng 21) được điền đủ token, giữ font đã lưu. */
const old = { bg: '#ffffff', fg: '#111827', accent: '#2563eb', fontHeading: 'Figtree', fontBody: 'Figtree' }
const normalized = normalizeTheme(old)
assert.equal(normalized.id, 'sang', 'nhận ra theme cũ theo bg')
assert.equal(normalized.surface, '#f3f6fb', 'lấy surface từ catalog cùng bg')
assert.equal(normalized.decor, 'none')
assert.equal(normalized.dark, false)
assert.equal(normalized.fonts.heading, 'Figtree', 'font người dùng đã lưu thắng catalog')
assert.ok(normalized.fonts.serif.includes('Times New Roman'))
const custom = normalizeTheme({ bg: '#123456', fg: '#ffffff', accent: '#ff0000', fontHeading: 'Arial', fontBody: 'Arial' })
assert.equal(custom.id, 'custom', 'theme lạ không bị gán nhầm id')
assert.match(custom.surface, /^#[0-9a-f]{6}$/, 'theme lạ vẫn suy ra surface')

/* 2. Màu chữ đọc được trên mọi nền của catalog đạt tương phản ≥ 4.5:1. */
assert.equal(readableTextOn('#ffffff'), '#111827')
assert.equal(readableTextOn('#0f172a'), '#ffffff')
for (const theme of DECK_THEMES) {
  const text = readableTextOn(theme.bg)
  assert.ok(
    contrastRatio(theme.bg, text) >= 4.5,
    `nền ${theme.bg} → chữ ${text} chỉ đạt ${contrastRatio(theme.bg, text).toFixed(2)}:1`,
  )
  assert.ok(
    contrastRatio(theme.bg, theme.fg) >= 4.5,
    `fg của ${theme.id} không đủ tương phản trên nền`,
  )
}

/* 3. themeById: đúng theme, id lạ rơi về theme đầu. */
assert.ok(themeById('van-su-dia').fonts.heading.includes('Times New Roman'))
assert.equal(themeById('ngoai-ngu-tin').decor, 'confetti')
assert.equal(themeById('khong-ton-tai').id, DECK_THEMES[0].id)

/* 4. Catalog: 10 theme duy nhất, đủ 4 hoạ tiết + 4 theme theo môn. */
assert.equal(DECK_THEMES.length, 10)
assert.equal(new Set(DECK_THEMES.map((t) => t.id)).size, 10, 'id theme không trùng')
assert.equal(new Set(DECK_THEMES.map((t) => t.bg.toLowerCase())).size, 10, 'bg theme không trùng')
assert.deepEqual(
  [...new Set(DECK_THEMES.map((t) => t.decor))].sort(),
  ['confetti', 'dots', 'glow', 'grain', 'grid', 'none', 'waves'],
  'đủ hoạ tiết + none',
)
assert.equal(DECK_THEMES.filter((t) => (t.tags?.length ?? 0) > 1).length, 4, '4 theme theo môn có tags')
assert.equal(themeById('do').shadow, 'hard', 'theme Đỏ dùng bóng khối kiểu poster')
assert.equal(themeById('do').radius, 0, 'theme Đỏ không bo góc')
assert.equal(themeById('giay-am').decor, 'grain', 'Giấy ấm có vân giấy')
assert.ok(themeById('sang').radius > 0)

console.log('✅ theme v2: normalize theme cũ, tương phản ≥ 4.5:1, themeById, catalog 10 theme')
console.log('\n4/4 pass, 0 fail')
