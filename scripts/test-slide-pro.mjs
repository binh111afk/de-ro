// Chế độ Chuyên nghiệp: tương phản chữ–nền của mọi bộ màu, và cắt chữ không dừng giữa từ.
import { PRO_THEMES, contrastRatio, mixHex } from '../src/lib/slideTheme.ts'
import { cutAtWord } from '../src/lib/slideAi.ts'

let bad = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' ' + detail}`)
  if (!ok) bad++
}

for (const t of PRO_THEMES) {
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

if (bad) {
  console.error(`\n${bad} kiểm tra hỏng`)
  process.exit(1)
}
console.log('\nTất cả đều qua')
