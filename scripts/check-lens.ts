/**
 * Kiểm tra công cụ "Thấu kính" (chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-lens.ts).
 */
import assert from 'node:assert/strict'
import { calcLens, computeLensGeometry, LENS_DEFAULT, type LensRay, type LensSpec } from '../src/lib/lens'
import { parseToolJson, readToolDoc, renderTool, type ToolDoc } from '../src/lib/toolSpec'
import { toolFromRaw } from '../src/lib/docRewrite'

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`)

function distPointToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const len = Math.hypot(x2 - x1, y2 - y1)
  assert.ok(len > 1e-6, 'Đoạn tia phải có độ dài > 0')
  return Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / len
}

/** Kiểm tra bằng số: từ SVG thật, 3 tia ló (hoặc đường kéo dài) phải đi qua B′ với sai số < 0,5 px. */
function assertThreeRaysMeetAtBPrime(spec: LensSpec, label: string) {
  const g = computeLensGeometry(spec)
  assert.ok(g.BPrime && g.drawnImage, `${label}: phải có ảnh B′ được vẽ`)
  const bx = g.BPrime.x
  const by = g.BPrime.y

  const img = renderTool({ kind: 'lens', spec })
  const rayMatches = [
    ...img.svg.matchAll(/<path data-ray="(parallel|center|focal)" data-kind="(real|virtual)" d="M(-?[\d.]+) (-?[\d.]+)L(-?[\d.]+) (-?[\d.]+)"/g),
  ]
  assert.ok(rayMatches.length >= 3, `${label}: SVG thiếu các tia sáng`)

  const raysToCheck: LensRay[] = ['parallel', 'center', 'focal']
  for (const rayName of raysToCheck) {
    const segs = rayMatches.filter((m) => m[1] === rayName)
    assert.ok(segs.length > 0, `${label}: thiếu tia ${rayName}`)
    // Tia ló (hoặc đường kéo dài ảo) đi qua B′: ít nhất 1 đoạn của tia có đường thẳng qua B′ < 0,5 px
    const minDist = Math.min(
      ...segs.map((m) => distPointToLine(bx, by, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]))),
    )
    assert.ok(minDist < 0.5, `${label} — tia ${rayName} lệch B′: ${minDist.toFixed(3)} px (>= 0,5 px)`)
  }
}

// 1. Hội tụ f = 10, d = 30 -> d' = 15, k = -0,5
{
  const spec: LensSpec = { ...LENS_DEFAULT, type: 'converging', f: 10, d: 30 }
  const c = calcLens(spec)
  assert.equal(c.atInfinity, false)
  near(c.dPrime!, 15)
  near(c.k!, -0.5)
  assert.equal(c.isReal, true)
  assert.equal(c.upright, false)
  assert.ok(c.summary.includes('Ảnh thật') && c.summary.includes('ngược chiều') && c.summary.includes('0,5'))
  assertThreeRaysMeetAtBPrime(spec, 'Hội tụ f=10, d=30')
  console.log('✓ Hội tụ f = 10, d = 30 → d′ = 15, k = −0,5, 3 tia cắt nhau tại B′ (< 0,5 px)')
}

// 2. Hội tụ f = 10, d = 15 -> d' = 30, k = -2
{
  const spec: LensSpec = { ...LENS_DEFAULT, type: 'converging', f: 10, d: 15 }
  const c = calcLens(spec)
  near(c.dPrime!, 30)
  near(c.k!, -2)
  assert.equal(c.isReal, true)
  assert.equal(c.upright, false)
  assert.ok(c.summary.includes('Ảnh thật') && c.summary.includes('ngược chiều') && c.summary.includes('lớn gấp 2'))
  assertThreeRaysMeetAtBPrime(spec, 'Hội tụ f=10, d=15')
  console.log('✓ Hội tụ f = 10, d = 15 → d′ = 30, k = −2, 3 tia cắt nhau tại B′ (< 0,5 px)')
}

// 3. Hội tụ f = 10, d = 5 -> d' = -10, ảnh ảo cùng chiều lớn gấp 2, vẽ kéo dài nét đứt
{
  const spec: LensSpec = { ...LENS_DEFAULT, type: 'converging', f: 10, d: 5 }
  const c = calcLens(spec)
  near(c.dPrime!, -10)
  near(c.k!, 2)
  assert.equal(c.isReal, false)
  assert.equal(c.upright, true)
  assert.ok(c.summary.includes('Ảnh ảo') && c.summary.includes('cùng chiều') && c.summary.includes('lớn gấp 2'))
  const img = renderTool({ kind: 'lens', spec })
  assert.ok(img.svg.includes('data-kind="virtual"') && img.svg.includes('stroke-dasharray="4 3"'), 'Phải vẽ đường kéo dài nét đứt')
  assertThreeRaysMeetAtBPrime(spec, 'Hội tụ f=10, d=5')
  console.log('✓ Hội tụ f = 10, d = 5 → d′ = −10, ảnh ảo cùng chiều lớn gấp 2, nét đứt, 3 tia gặp tại B′')
}

// 4. Hội tụ d = f -> không ảnh, ghi vô cực, không lỗi chia 0
{
  const spec: LensSpec = { ...LENS_DEFAULT, type: 'converging', f: 10, d: 10 }
  const c = calcLens(spec)
  assert.equal(c.atInfinity, true)
  assert.equal(c.dPrime, null)
  assert.equal(c.k, null)
  const img = renderTool({ kind: 'lens', spec })
  assert.ok(img.svg.includes('ảnh ở vô cực'), 'Phải ghi "ảnh ở vô cực"')
  // Hai tia song song và qua O phải có cùng hướng (song song)
  const g = computeLensGeometry(spec)
  const outP = g.segments.find((s) => s.ray === 'parallel' && s.from.x === g.xO)
  const outC = g.segments.find((s) => s.ray === 'center' && s.from.x === g.xO)
  assert.ok(outP && outC)
  const slopeP = (outP.to.y - outP.from.y) / (outP.to.x - outP.from.x)
  const slopeC = (outC.to.y - outC.from.y) / (outC.to.x - outC.from.x)
  near(slopeP, slopeC, 1e-6)
  console.log('✓ Hội tụ d = f → ảnh ở vô cực, tia ló song song, không chia cho 0')
}

// 5. Phân kì f = 10, d = 20 -> d' ≈ -6,67, ảnh ảo cùng chiều nhỏ hơn
{
  const spec: LensSpec = { ...LENS_DEFAULT, type: 'diverging', f: 10, d: 20 }
  const c = calcLens(spec)
  near(c.dPrime!, -20 / 3, 1e-6)
  near(c.k!, 1 / 3, 1e-6)
  assert.equal(c.isReal, false)
  assert.equal(c.upright, true)
  assert.ok(c.summary.includes('Ảnh ảo') && c.summary.includes('cùng chiều') && c.summary.includes('0,33'))
  const img = renderTool({ kind: 'lens', spec })
  assert.ok(img.svg.includes('stroke-dasharray="4 3"'), 'Ảnh ảo phân kì phải có nét đứt')
  assertThreeRaysMeetAtBPrime(spec, 'Phân kì f=10, d=20')
  console.log('✓ Phân kì f = 10, d = 20 → d′ ≈ −6,67, ảnh ảo cùng chiều nhỏ hơn, 3 tia gặp tại B′')
}

// 6. Các trường hợp bổ sung: objectSide right, |d'| > 6f, show2F, showValues, hideImage, đổi tên, round-trip
{
  // Đặt vật bên phải
  assertThreeRaysMeetAtBPrime({ ...LENS_DEFAULT, type: 'converging', f: 10, d: 25, objectSide: 'right' }, 'Vật bên phải hội tụ')
  assertThreeRaysMeetAtBPrime({ ...LENS_DEFAULT, type: 'diverging', f: 10, d: 15, objectSide: 'right' }, 'Vật bên phải phân kì')

  // |d'| > 6f -> cắt tia ở mép và ghi "ảnh ở xa"
  const farImg = renderTool({ kind: 'lens', spec: { ...LENS_DEFAULT, type: 'converging', f: 10, d: 11 } })
  assert.ok(farImg.svg.includes('ảnh ở xa'), 'Phải ghi "ảnh ở xa" khi |d′| > 6f')

  // 2F, số liệu, đổi tên
  const fullImg = renderTool({
    kind: 'lens',
    spec: {
      ...LENS_DEFAULT,
      show2F: true,
      showValues: true,
      names: { A: 'M', B: 'N', APrime: 'M′', BPrime: 'N′', O: 'O', F: 'F', FPrime: 'F′' },
    },
  })
  assert.ok(fullImg.svg.includes('>2F<') && fullImg.svg.includes('>2F′<'), 'Hiện 2F, 2F′')
  assert.ok(fullImg.svg.includes('f = 10 cm') && fullImg.svg.includes('d = 30 cm') && fullImg.svg.includes('d′ = 15 cm'), 'Hiện kích thước f, d, d′')
  assert.ok(fullImg.svg.includes('>M<') && fullImg.svg.includes('>N<') && fullImg.svg.includes('>M′<') && fullImg.svg.includes('>N′<'), 'Đổi tên A, B, A′, B′')

  // Chế độ ẩn ảnh
  const hideImg = renderTool({ kind: 'lens', spec: { ...LENS_DEFAULT, hideImage: true } })
  assert.ok(!hideImg.svg.includes('data-ray='), 'Ẩn ảnh không vẽ tia ló tạo ảnh')
  assert.ok(!hideImg.svg.includes('>A′<') && !hideImg.svg.includes('>B′<'), 'Ẩn ảnh không vẽ tên A′, B′')

  // Round-trip spec <-> ảnh (cả <desc> trong SVG và JSON attr `plot`)
  const doc: ToolDoc = {
    kind: 'lens',
    spec: {
      type: 'diverging',
      f: 12.5,
      d: 25,
      h: 3,
      rays: ['parallel', 'center'],
      show2F: true,
      showValues: true,
      names: { A: 'A', B: 'B', APrime: 'A′', BPrime: 'B′', O: 'O', F: 'F', FPrime: 'F′' },
      objectSide: 'left',
      hideImage: false,
    },
  }
  const rendered = renderTool(doc)
  assert.deepEqual(readToolDoc(rendered.svg), doc, 'Round-trip readToolDoc từ SVG')
  assert.deepEqual(parseToolJson(JSON.stringify(doc)), doc, 'Round-trip parseToolJson từ JSON attr plot')

  // toolFromRaw cho AI
  const aiDoc = toolFromRaw({
    kind: 'lens',
    type: 'diverging',
    f: 15,
    d: 30,
    show2F: true,
  })
  assert.equal(aiDoc.kind, 'lens')
  console.log('✓ Vật bên phải, ảnh ở xa (|d′| > 6f), 2F, kích thước, ẩn ảnh, đổi tên, round-trip và toolFromRaw')
}

// 7. Báo lỗi đầu vào không hợp lệ
assert.throws(() => renderTool({ kind: 'lens', spec: { ...LENS_DEFAULT, f: 0 } }), /Tiêu cự f/)
assert.throws(() => renderTool({ kind: 'lens', spec: { ...LENS_DEFAULT, d: -5 } }), /Khoảng cách vật d/)
assert.throws(() => renderTool({ kind: 'lens', spec: { ...LENS_DEFAULT, h: 0 } }), /Chiều cao vật h/)
console.log('✓ Báo lỗi đầu vào f ≤ 0, d ≤ 0, h ≤ 0')
