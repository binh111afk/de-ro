/**
 * Kiểm tra công cụ "Đồ thị chuyển thể" (chạy: npx tsx scripts/check-phase.ts).
 */
import assert from 'node:assert/strict'
import { PHASE_DEFAULT, parsePhasePoints, type PhaseSpec } from '../src/lib/phaseChange'
import { readToolDoc, renderTool } from '../src/lib/toolSpec'

// 1. Mẫu mặc định ("Nóng chảy nước đá") + round-trip readToolDoc
const defImg = renderTool({ kind: 'phase', spec: PHASE_DEFAULT })
assert.ok(defImg.svg.includes('<svg'), 'SVG hợp lệ')
assert.ok(defImg.svg.includes('>−20<'), 'O tại −20 có nhãn −20')
assert.ok(defImg.svg.includes('>O<'), 'có nhãn O')
assert.ok(defImg.svg.includes('>100<'), 'có vạch 100')
const roundTrip = readToolDoc(defImg.svg)
assert.deepEqual(roundTrip, { kind: 'phase', spec: PHASE_DEFAULT }, 'đọc lại đúng spec từ SVG')
console.log('✓ Mẫu mặc định + round-trip readToolDoc')

// 2. Mẫu đề: O tại -45, A, B, C, T_1, T_2, -8,83, 0, nét đứt, đi tiếp
const examSpec: PhaseSpec = {
  yName: 't (°C)',
  tName: 'T (phút)',
  points: '(0; -45)\nA: (15; -8,83)\nB: (27,4; -8,83)\nC: (60 = T_1; 0)\n(70 = T_2; 0)\n_(85; 16)',
  extend: false,
  dashed: true,
  dots: true,
}
const examImg = renderTool({ kind: 'phase', spec: examSpec })
for (const text of ['>−45<', '>−8,83<', '>0<', '>15<', '>27,4<', '>A<', '>B<', '>C<', '>O<']) {
  assert.ok(examImg.svg.includes(text), `thiếu nhãn ${text}`)
}
assert.ok(examImg.svg.includes('<tspan font-style="italic">T</tspan>₁'), 'hiện T₁ trên trục ngang')
assert.ok(examImg.svg.includes('<tspan font-style="italic">T</tspan>₂'), 'hiện T₂ trên trục ngang')
assert.equal(examImg.svg.match(/data-lbl="y:-8\.83"/g)?.length ?? 0, 1, 'vạch −8,83 chỉ ghi 1 lần')
assert.equal(examImg.svg.match(/data-lbl="y:0"/g)?.length ?? 0, 1, 'vạch 0 chỉ ghi 1 lần')
assert.ok(!examImg.svg.includes('>85<') && !examImg.svg.includes('>16<'), 'điểm kéo dài _ không ghi vạch trục')
assert.ok(examImg.svg.includes('stroke-dasharray="4 3"'), 'có nét đứt gióng')
assert.equal(examImg.svg.match(/<circle /g)?.length ?? 0, 3, 'chỉ chấm 3 điểm có tên A, B, C')

const noDotsImg = renderTool({ kind: 'phase', spec: { ...examSpec, dots: false, dashed: false } })
assert.equal(noDotsImg.svg.match(/<circle /g)?.length ?? 0, 0, 'dots=false không có chấm')
assert.ok(!noDotsImg.svg.includes('stroke-dasharray="4 3"'), 'dashed=false không có nét đứt')
console.log('✓ Mẫu đề (-45, A, B, C, T₁, T₂, −8,83, 0, dots/dashed)')

// 3. Kí hiệu trên trục dọc + cú pháp cách nhau bởi dấu cách + dấu trừ Unicode
const symYSpec: PhaseSpec = {
  yName: 't (°C)',
  tName: 'T (phút)',
  points: '(0; −45) A: (15; -8,83 = t_1) B: (27.4; -8.83) C: (60 = T_1; 0)',
  extend: true,
  dashed: true,
  dots: true,
}
const symYImg = renderTool({ kind: 'phase', spec: symYSpec })
assert.ok(symYImg.svg.includes('<tspan font-style="italic">t</tspan>₁'), 'kí hiệu t₁ trên trục dọc')
assert.ok(symYImg.svg.includes('>27,4<'), '27.4 đổi thành 27,4')
console.log('✓ Kí hiệu trục dọc t₁ + tách điểm bằng dấu cách')

// 4. Mẫu Đông đặc (yMin > 0 → O đặt tại 0)
const freezeSpec: PhaseSpec = {
  yName: 't (°C)',
  tName: 'T (phút)',
  points: '(0; 90)\nA: (4; 50)\nB: (12; 50)\n(18; 20)',
  extend: false,
  dashed: true,
  dots: true,
}
const freezeImg = renderTool({ kind: 'phase', spec: freezeSpec })
assert.ok(freezeImg.svg.includes('>20<') && freezeImg.svg.includes('>50<') && freezeImg.svg.includes('>90<'), 'đủ nhãn 20, 50, 90')
assert.equal(freezeImg.svg.match(/data-lbl="y:0"/g)?.length ?? 0, 0, 'yMin > 0 thì O đại diện 0, không ghi thêm 0')
console.log('✓ Mẫu Đông đặc (đường đi xuống, yMin > 0)')

// 5. Giãn nhãn trục dọc khi quá sát
const tightImg = renderTool({
  kind: 'phase',
  spec: { ...PHASE_DEFAULT, points: '(0; -100)\n(5; -2)\n(10; 0)\n(15; 100)', extend: false },
})
const yCoords = [...tightImg.svg.matchAll(/<text x="[^"]+" y="([^"]+)"[^>]*data-lbl="y:[^"]+"/g)].map((m) => Number(m[1]))
assert.equal(yCoords.length, 4, 'có đủ 4 nhãn trục dọc')
for (let i = 0; i < yCoords.length - 1; i++) {
  assert.ok(yCoords[i + 1] - yCoords[i] >= 13.5, `nhãn trục dọc không đè nhau (${yCoords[i]} vs ${yCoords[i + 1]})`)
}
console.log('✓ Giãn nhãn trục dọc không đè nhau:', yCoords)

// 6. Báo lỗi rõ: ít điểm, sai cú pháp, thời gian không tăng, trùng tên
assert.throws(() => parsePhasePoints('(0; -20)'), /ít nhất 2 điểm/)
assert.throws(() => parsePhasePoints('(0, -20) (4; 0)'), /Sai cú pháp/)
assert.throws(() => parsePhasePoints('(0; 0) (T_1; 20)'), /Thiếu giá trị số/)
assert.throws(() => parsePhasePoints('(-2; 0) (4; 20)'), /không được âm/)
assert.throws(() => parsePhasePoints('(10; 0) (5; 20)'), /tăng dần/)
assert.throws(() => parsePhasePoints('(10; 0) (10; 20)'), /tăng dần/)
assert.throws(() => parsePhasePoints('A: (0; 0) A: (5; 20)'), /Trùng tên điểm/)
console.log('✓ Báo lỗi rõ cho các ca sai')
