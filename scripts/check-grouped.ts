/**
 * Kiểm tra công cụ "Bảng ghép nhóm" (chạy: npx tsx scripts/check-grouped.ts).
 * Mẫu đối chiếu tay (kiểu SGK): chiều cao 40 học sinh, 5 nhóm.
 * Tính tay: n = 40; x̄ = 6490/40 = 162,25; trung vị = 160 + (6/14)·5 ≈ 162,14;
 * Q1 = 155 + (6/10)·5 = 158; Q3 = 165 + (2/8)·5 = 166,25; mốt = 160 + (4/10)·5 = 162;
 * R = 175 − 150 = 25; ΔQ = 8,25; s² = 1054250/40 − 162,25² = 31,1875 ≈ 31,19; s ≈ 5,58.
 */
import assert from 'node:assert/strict'
import { groupedStats, parseGroups, round2 } from '../src/lib/grouped'
import { renderTool, type GroupedSpec } from '../src/lib/toolSpec'

const SGK = '[150; 155): 4\n[155; 160): 10\n[160; 165): 14\n[165; 170): 8\n[170; 175]: 4'
const s = groupedStats(parseGroups(SGK))
assert.equal(s.n, 40, 'n')
assert.equal(s.mean, 162.25, 'x̄ = 162,25')
assert.equal(round2(s.median), '162,14', 'trung vị')
assert.equal(s.q1, 158, 'Q1 = 158')
assert.equal(s.q3, 166.25, 'Q3 = 166,25')
assert.equal(s.mode, 162, 'mốt = 162')
assert.equal(s.range, 25, 'khoảng biến thiên')
assert.equal(s.iqr, 8.25, 'khoảng tứ phân vị')
assert.equal(round2(s.variance), '31,19', 'phương sai')
assert.equal(round2(s.sd), '5,58', 'độ lệch chuẩn')
console.log('✓ Mẫu SGK: n=40, x̄=162,25, TV=162,14, Q1=158, Q3=166,25, Mo=162, R=25, ΔQ=8,25, s²=31,19, s=5,58')

// dấu phẩy thập phân kiểu Việt Nam + nhóm cuối đóng
const p = parseGroups('[1,5; 2): 8\n[2; 2,5]: 3')
assert.equal(p[0].lo, 1.5)
assert.equal(p[1].closed, true)
assert.equal(groupedStats(p).n, 11)

// sai cú pháp → lỗi nêu đúng dòng và gõ thế nào cho đúng
try {
  parseGroups('[150; 155): 4\ntùm lum')
  assert.fail('phải ném lỗi')
} catch (e) {
  assert.match(e instanceof Error ? e.message : String(e), /Dòng 2 "tùm lum": cần dạng \[150; 155\): 5/)
}
try {
  parseGroups('[155; 150): 4')
  assert.fail('phải ném lỗi đầu mút')
} catch (e) {
  assert.match(e instanceof Error ? e.message : String(e), /đầu phải lớn hơn đầu trái/)
}

// 3 kiểu hiển thị + đầy đủ tuỳ chọn, kể cả 10 nhóm
for (const view of ['htable', 'vtable', 'hist'] as const) {
  const spec: GroupedSpec = { groups: SGK, label: 'Chiều cao (cm)', freqLabel: 'Số học sinh', view, polygon: view === 'hist', extras: 'mid,cum,rel,total' }
  const img = renderTool({ kind: 'grouped', spec })
  assert.ok(img.svg.includes('<svg'), view)
  if (view === 'htable') assert.ok(img.svg.includes('>Tần số tương đối (%)<') && img.svg.includes('>Tổng<'), 'htable có hàng phụ + Tổng')
  if (view === 'vtable') assert.ok(img.svg.includes('>Giá trị đại diện<'), 'vtable có cột giá trị đại diện')
  if (view === 'hist' && spec.polygon) assert.ok(img.svg.includes('stroke-width="1.6"'), 'hist có đa giác tần số')
}
const muoiNhom = Array.from({ length: 10 }, (_, i) => `[${150 + i * 5}; ${155 + i * 5}): ${i + 1}`).join('\n')
const img10 = renderTool({
  kind: 'grouped',
  spec: { groups: muoiNhom, label: 'Điểm (đ)', freqLabel: 'Số bạn', view: 'htable', polygon: false, extras: 'mid,cum,rel,total' },
})
assert.ok(img10.width >= 700 && img10.svg.includes('[190; 195)'), '10 nhóm: khung đủ rộng, không cắt chữ')
console.log('✓ Bảng ghép nhóm: 3 kiểu hiển thị + tuỳ chọn + 10 nhóm không tràn khung')
