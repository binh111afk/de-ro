/**
 * Kiểm tra công cụ "Đồ thị dao động" (chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-osc.ts).
 */
import assert from 'node:assert/strict'
import {
  OSC_DEFAULT,
  oscCurveParams,
  oscEquation,
  oscParams,
  parseOscExpr,
  type OscSpec,
  type OscStartX0,
} from '../src/lib/oscillation'
import { readToolDoc, renderTool } from '../src/lib/toolSpec'
import { toolFromRaw } from '../src/lib/docRewrite'

const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`)

// 1. oscParams đúng cho mọi lựa chọn x₀ / chiều
const CASES: Array<{ x0: OscStartX0; dir: 'up' | 'down'; expectedPhi: number }> = [
  { x0: 'A', dir: 'up', expectedPhi: 0 },
  { x0: 'A', dir: 'down', expectedPhi: 0 },
  { x0: '-A', dir: 'up', expectedPhi: Math.PI },
  { x0: '-A', dir: 'down', expectedPhi: Math.PI },
  { x0: '0', dir: 'down', expectedPhi: Math.PI / 2 },
  { x0: '0', dir: 'up', expectedPhi: -Math.PI / 2 },
  { x0: 'A/2', dir: 'down', expectedPhi: Math.PI / 3 },
  { x0: 'A/2', dir: 'up', expectedPhi: -Math.PI / 3 },
  { x0: '-A/2', dir: 'down', expectedPhi: (2 * Math.PI) / 3 },
  { x0: '-A/2', dir: 'up', expectedPhi: -(2 * Math.PI) / 3 },
  { x0: 'A√2/2', dir: 'down', expectedPhi: Math.PI / 4 },
  { x0: 'A√2/2', dir: 'up', expectedPhi: -Math.PI / 4 },
  { x0: '-A√2/2', dir: 'down', expectedPhi: (3 * Math.PI) / 4 },
  { x0: '-A√2/2', dir: 'up', expectedPhi: -(3 * Math.PI) / 4 },
  { x0: 'A√3/2', dir: 'down', expectedPhi: Math.PI / 6 },
  { x0: 'A√3/2', dir: 'up', expectedPhi: -Math.PI / 6 },
  { x0: '-A√3/2', dir: 'down', expectedPhi: (5 * Math.PI) / 6 },
  { x0: '-A√3/2', dir: 'up', expectedPhi: -(5 * Math.PI) / 6 },
]

for (const c of CASES) {
  const p = oscParams({ ...OSC_DEFAULT, start: { by: 'state', x0: c.x0, dir: c.dir } })
  near(p.A, 8)
  near(p.omega, Math.PI)
  near(p.phi, c.expectedPhi)
  // Kiểm tra dấu vận tốc v(0) = -ωA·sin(φ) khi không ở biên
  if (c.x0 !== 'A' && c.x0 !== '-A') {
    const v0 = -p.omega * p.A * Math.sin(p.phi)
    assert.ok(c.dir === 'up' ? v0 > 0 : v0 < 0, `${c.x0} ${c.dir}: v0=${v0}`)
  }
}
console.log('✓ oscParams đúng cho đủ 18 tổ hợp (x₀, chiều)')

// 2. Period theo T, f, ω và nhập φ trực tiếp
near(oscParams({ ...OSC_DEFAULT, period: { by: 'f', value: 0.5 } }).omega, Math.PI)
near(oscParams({ ...OSC_DEFAULT, period: { by: 'omega', value: 4 * Math.PI } }).omega, 4 * Math.PI)
near(oscParams({ ...OSC_DEFAULT, start: { by: 'phi', phiPi: -1 / 3 } }).phi, -Math.PI / 3)
near(parseOscExpr('2π'), 2 * Math.PI)
near(parseOscExpr('-1/3'), -1 / 3)
near(parseOscExpr('2,5', false), 2.5)
console.log('✓ Period (T / f / ω), nhập pha φ và parseOscExpr')

// 3. Hình mẫu: A = 8, T = 2, VTCB chiều âm, tEnd = 2,5, lưới T/8
assert.equal(oscEquation(OSC_DEFAULT), 'x = 8cos(πt + π/2) (cm)')
const sampleImg = renderTool({ kind: 'osc', spec: OSC_DEFAULT })
assert.ok(sampleImg.svg.includes('<svg'), 'SVG hợp lệ')
assert.ok(sampleImg.svg.includes('>8<') && sampleImg.svg.includes('>4<') && sampleImg.svg.includes('>−4<') && sampleImg.svg.includes('>−8<'), 'Nhãn trục dọc 8, 4, −4, −8')
assert.ok(sampleImg.svg.includes('>O<') && sampleImg.svg.includes('>2<') && sampleImg.svg.includes('>2,5<'), 'Nhãn O và trục ngang')
assert.ok(sampleImg.svg.includes('stroke-dasharray="3 3"'), 'Có lưới ô nét đứt')
assert.deepEqual(readToolDoc(sampleImg.svg), { kind: 'osc', spec: OSC_DEFAULT }, 'Round-trip readToolDoc')

// Kiểm tra đường cong chính đi qua đúng các điểm: (0;0), đáy (0,5;-8), (1;0), đỉnh (1,5;8), (2;0), đáy (2,5;-8)
const curvePathMatch = sampleImg.svg.match(/<path d="(M[^"]+)" fill="none" stroke="#111" stroke-width="2"/)
assert.ok(curvePathMatch, 'Tìm thấy path đường cong chính')
const pts = [...curvePathMatch[1].matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
assert.ok(pts.length >= 120, `Đủ dày điểm (${pts.length})`)
const [xStart, yStart] = pts[0]
const [xEnd, yEnd] = pts[pts.length - 1]
// left = 62, right = 394, top = 42, y0 = 151, bottom = 260
near(xStart, 62, 0.2)
near(yStart, 151, 0.2)
near(xEnd, 394, 0.2)
near(yEnd, 260, 0.2)
// Kiểm tra đáy t=0.5 (x = 62 + 0.5/2.5 * 332 = 128.4, y = 260) và đỉnh t=1.5 (x = 261.2, y = 42) và t=2.0 (x = 327.6, y = 151)
assert.ok(pts.some(([px, py]) => Math.abs(px - 128.4) < 0.2 && Math.abs(py - 260) < 0.2), 'Đi qua đúng đáy (0,5; −8)')
assert.ok(pts.some(([px, py]) => Math.abs(px - 261.2) < 0.2 && Math.abs(py - 42) < 0.2), 'Đi qua đúng đỉnh (1,5; 8)')
assert.ok(pts.some(([px, py]) => Math.abs(px - 327.6) < 0.2 && Math.abs(py - 151) < 0.2), 'Đi qua đúng điểm cắt 0 tại t = 2,0')
// Sau t = 0 đi xuống (py tăng trong SVG)
assert.ok(pts[1][1] > pts[0][1], 'Lúc t = 0 bắt đầu đi xuống')
console.log('✓ Hình mẫu: đúng phương trình, các điểm (0;0), đáy 0,5s, đỉnh 1,5s, cắt 0 tại 2s')

// 4. Đồ thị v, a và chế độ 2 đường (x nét liền, v nét đứt), ticks symbol
const vCurve = oscCurveParams({ ...OSC_DEFAULT, qty: 'v' })
near(vCurve.amp, 8 * Math.PI)
near(vCurve.phi, Math.PI)
const aCurve = oscCurveParams({ ...OSC_DEFAULT, qty: 'a' })
near(aCurve.amp, 8 * Math.PI * Math.PI)
near(aCurve.phi, -Math.PI / 2)

const vImg = renderTool({ kind: 'osc', spec: { ...OSC_DEFAULT, qty: 'v', yName: 'v (cm/s)', ticks: 'symbol' } })
assert.ok(vImg.svg.includes('>ωA<') && vImg.svg.includes('>T/4<') && vImg.svg.includes('>T/2<') && vImg.svg.includes('>T<'), 'Nhãn kí hiệu v: ωA, T/4, T/2, T')
const vValImg = renderTool({ kind: 'osc', spec: { ...OSC_DEFAULT, qty: 'v', yName: 'v (cm/s)' } })
assert.ok(vValImg.svg.includes('>25,13<') && vValImg.svg.includes('>−25,13<'), 'Biên độ v làm tròn 2 chữ số (25,13)')

const twoImg = renderTool({
  kind: 'osc',
  spec: { ...OSC_DEFAULT, second: { qty: 'v', dashed: true } },
})
assert.ok(twoImg.svg.includes('stroke-dasharray="6 4"'), 'Đường thứ hai nét đứt')
assert.ok(twoImg.svg.includes('>x<') && twoImg.svg.includes('>v<'), 'Chú thích 2 đường x, v')
console.log('✓ Đồ thị v, a, nhãn kí hiệu và chế độ 2 đường so pha')

// 5. toolFromRaw cho AI
const aiDoc = toolFromRaw({
  kind: 'osc',
  qty: 'x',
  A: 6,
  period: { by: 'omega', value: '2pi' },
  start: { by: 'state', x0: 'A/2', dir: 'up' },
  tEnd: 1.5,
  grid: 'T/4',
  ticks: 'value',
})
assert.equal(aiDoc.kind, 'osc')
if (aiDoc.kind === 'osc') {
  near(oscParams(aiDoc.spec).phi, -Math.PI / 3)
  near(oscParams(aiDoc.spec).omega, 2 * Math.PI)
}
console.log('✓ toolFromRaw hỗ trợ kind: osc')

// 6. Báo lỗi đầu vào không hợp lệ
const bad = (patch: Partial<OscSpec>, re: RegExp) =>
  assert.throws(() => renderTool({ kind: 'osc', spec: { ...OSC_DEFAULT, ...patch } }), re)
bad({ A: 0 }, /Biên độ A/)
bad({ A: -4 }, /Biên độ A/)
bad({ period: { by: 'T', value: 0 } }, /Chu kì T/)
bad({ period: { by: 'f', value: -1 } }, /Tần số f/)
bad({ period: { by: 'omega', value: 0 } }, /Tần số góc ω/)
bad({ tEnd: 0 }, /Thời gian vẽ/)
bad({ tEnd: 21 }, /tối đa 10 chu kì/)
console.log('✓ Kiểm tra báo lỗi A ≤ 0, T/f/ω ≤ 0, tEnd ≤ 0, tEnd > 10T')
