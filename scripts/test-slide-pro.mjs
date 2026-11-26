// Chế độ Chuyên nghiệp: tương phản chữ–nền của mọi bộ màu, và cắt chữ không dừng giữa từ.
import { existsSync } from 'node:fs'
import { PRO_THEMES, contrastRatio, mixHex } from '../src/lib/slideTheme.ts'
import { PRO_LAYOUT_IDS, composeLayout, contentFromSlide, withPlaceholders } from '../src/lib/slideLayouts.ts'
import { PACK_COLORS } from '../src/lib/slidePacks.ts'
import { cutAtWord } from '../src/lib/slideAi.ts'

let bad = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' ' + detail}`)
  if (!ok) bad++
}

for (const t of PRO_THEMES) {
  // bộ phong cách có màu cố định, không dùng nền mực
  if (t.pack) {
    const c = PACK_COLORS[t.pack]
    for (const [label, color, min] of [['chữ chính', c.fg, 7], ['chữ nhấn', c.ink, 4.5], ['chữ phụ', c.muted, 4.5]]) {
      const ratio = contrastRatio(color, c.surface)
      check(`${t.id}: ${label} trên giấy ≥ ${min}`, ratio >= min, `(${ratio.toFixed(2)})`)
    }
    continue
  }
  const ink = t.ink ?? '#161513'
  const accentOnInk = mixHex(t.accent, t.bg, 0.42)
  const mutedOnInk = mixHex(t.bg, ink, 0.32)
  const rows = [
    ['chữ chính trên giấy', contrastRatio(t.fg, t.bg), 7],
    ['chữ phụ trên giấy', contrastRatio(t.muted, t.bg), 4.5],
    ['màu nhấn trên giấy', contrastRatio(t.accent, t.bg), 4.5],
    ['chữ giấy trên nền mực', contrastRatio(t.bg, ink), 7],
    ['màu nhấn trên nền mực', contrastRatio(accentOnInk, ink), 4.5],
    ['chữ phụ trên nền mực', contrastRatio(mutedOnInk, ink), 4.5],
  ]
  for (const [label, ratio, min] of rows) check(`${t.id}: ${label} ≥ ${min}`, ratio >= min, `(${ratio.toFixed(2)})`)
}

const long = 'Bà ngoại lập tức đưa cháu vào phòng tranh của Nadar để xem triển lãm đầu tiên của nhóm hoạ sĩ'
for (const max of [20, 40, 60, 90]) {
  const out = cutAtWord(long, max)
  check(`cutAtWord ${max}: không quá ${max} ký tự`, out.length <= max, `(${out.length})`)
  const body = out.replace(/…$/, '')
  check(`cutAtWord ${max}: kết thúc ở hết từ`, out === long || long.startsWith(body) && /\s|$/.test(long.slice(body.length, body.length + 1)), `"${out}"`)
}
check('cutAtWord: câu ngắn giữ nguyên', cutAtWord('Ngắn gọn', 50) === 'Ngắn gọn')
check('cutAtWord: một từ quá dài vẫn cắt được', cutAtWord('a'.repeat(100), 30).length === 30)

for (const t of PRO_THEMES.filter((x) => x.pack)) {
  for (const id of [...PRO_LAYOUT_IDS, 'bullets']) {
    const content = withPlaceholders(id, { image: id === 'bignum' ? '/x.png' : undefined, stats: id === 'rules' ? [{ value: '1945', label: 'Mốc' }, { value: '1954', label: 'Mốc' }] : undefined })
    const els = composeLayout(t, id, content)
    const back = contentFromSlide({ id: 's', background: '', elements: els, layout: id })
    check(`${t.id} ${id}: dựng được`, els.length > 0 && els.every((e) => [e.x, e.y, e.w, e.h].every(Number.isFinite)))
    if (content.title && els.some((e) => e.id === 'title')) check(`${t.id} ${id}: giữ tiêu đề`, back.title === content.title, `(${back.title})`)
    if (id === 'bullets' || id === 'bars' || id === 'photo-compare') {
      const key = id === 'photo-compare' ? 'image2' : id
      check(`${t.id} ${id}: giữ ${key}`, !content[key] || JSON.stringify(back[key]) === JSON.stringify(content[key]), `(${JSON.stringify(back[key])})`)
    }
    if (content.image) check(`${t.id} ${id}: giữ ảnh`, back.image === content.image, `(${back.image})`)
    for (const e of els) if (e.src?.startsWith('/slide-packs/')) check(`${t.id} ${id}: có file ${e.src}`, existsSync(new URL('../public' + e.src, import.meta.url)))
  }
}

if (bad) {
  console.error(`\n${bad} kiểm tra hỏng`)
  process.exit(1)
}
console.log('\nTất cả đều qua')
