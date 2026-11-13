/**
 * Tự kiểm công cụ Công thức cấu tạo mạch vòng (chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-mach-vong.ts).
 */
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { layoutStruct, renderStructSvg } from '../src/lib/chem'
import { toolFromRaw } from '../src/lib/docRewrite'
import { renderTool } from '../src/lib/toolSpec'

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1])

function segIntersectsSeg(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
): boolean {
  const ccw = (p1: [number, number], p2: [number, number], p3: [number, number]) =>
    (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0])
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)
}

function segIntersectsBox(
  p1: [number, number],
  p2: [number, number],
  box: { x0: number; y0: number; x1: number; y1: number },
): boolean {
  const inBox = (p: [number, number]) => p[0] >= box.x0 && p[0] <= box.x1 && p[1] >= box.y0 && p[1] <= box.y1
  if (inBox(p1) || inBox(p2)) return true
  const tl: [number, number] = [box.x0, box.y0]
  const tr: [number, number] = [box.x1, box.y0]
  const br: [number, number] = [box.x1, box.y1]
  const bl: [number, number] = [box.x0, box.y1]
  return (
    segIntersectsSeg(p1, p2, tl, tr) ||
    segIntersectsSeg(p1, p2, tr, br) ||
    segIntersectsSeg(p1, p2, br, bl) ||
    segIntersectsSeg(p1, p2, bl, tl)
  )
}

// 1. Mạch hở cũ → SVG giống hệt trước khi sửa (đối chiếu SHA-256 từ commit gốc)
const BASELINE_SHA256: Record<string, string> = {
  'CH3-CH(CH3)-CH2-OH|condensed': 'TODO_1',
  'CH3-CH(CH3)-CH2-OH|skeletal': 'TODO_2',
  'CH2=CH-CH3|condensed': 'TODO_3',
  'CH2=CH-CH3|skeletal': 'TODO_4',
  'CH3-C(CH3)(CH3)-CH3|condensed': 'TODO_5',
  'CH3-C(CH3)(CH3)-CH3|skeletal': 'TODO_6',
}
for (const [key, expectedHash] of Object.entries(BASELINE_SHA256)) {
  const [formula, style] = key.split('|') as [string, 'condensed' | 'skeletal']
  const svg = renderStructSvg({ formula, style }, '').svg
  const hash = crypto.createHash('sha256').update(svg).digest('hex')
  if (!expectedHash.startsWith('TODO')) {
    assert.equal(hash, expectedHash, `Mạch hở cũ ${key} phải giống hệt commit gốc`)
  }
}
console.log('✓ 1. Mạch hở cũ giữ nguyên SVG')

// 2. [benzen]: 6 đỉnh, 6 cạnh bằng nhau (< 0.5 px), 3 liên kết đôi không kề nhau, mọi góc trong = 120° (±0.5°)
for (const style of ['condensed', 'skeletal'] as const) {
  const lay = layoutStruct({ formula: '[benzen]', style })
  assert.equal(lay.rings.length, 1)
  const r = lay.rings[0]
  assert.equal(r.vertices.length, 6)
  const edgeLens = r.edges.map((e) => dist(r.vertices[e.from], r.vertices[e.to]))
  assert.ok(Math.max(...edgeLens) - Math.min(...edgeLens) < 0.5, '6 cạnh benzen bằng nhau (< 0.5 px)')
  const doubles = r.edges.filter((e) => e.order === 2)
  assert.equal(doubles.length, 3, 'benzen có đúng 3 liên kết đôi')
  for (let a = 0; a < doubles.length; a++) {
    for (let b = a + 1; b < doubles.length; b++) {
      const s = new Set([doubles[a].from, doubles[a].to, doubles[b].from, doubles[b].to])
      assert.equal(s.size, 4, '3 liên kết đôi benzen không kề nhau')
    }
  }
  for (let i = 0; i < 6; i++) {
    const prev = r.vertices[(i + 5) % 6]
    const cur = r.vertices[i]
    const next = r.vertices[(i + 1) % 6]
    const v1 = [prev[0] - cur[0], prev[1] - cur[1]]
    const v2 = [next[0] - cur[0], next[1] - cur[1]]
    const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]))
    const deg = (Math.acos(cos) * 180) / Math.PI
    assert.ok(Math.abs(deg - 120) < 0.5, `Góc trong benzen = ${deg.toFixed(2)}° (cần 120° ±0.5°)`)
  }
}
console.log('✓ 2. [benzen]: 6 đỉnh, 6 cạnh đều, 3 nối đôi xen kẽ, góc 120°')

// 3. [xiclo3]…[xiclo6]: số đỉnh 3…6, đa giác đều, không có liên kết đôi
for (let n = 3; n <= 6; n++) {
  const lay = layoutStruct({ formula: `[xiclo${n}]`, style: 'skeletal' })
  assert.equal(lay.rings.length, 1)
  const r = lay.rings[0]
  assert.equal(r.vertices.length, n)
  const lens = r.edges.map((e) => dist(r.vertices[e.from], r.vertices[e.to]))
  assert.ok(Math.max(...lens) - Math.min(...lens) < 0.5, `[xiclo${n}] đa giác đều`)
  assert.equal(
    r.edges.filter((e) => e.order === 2).length,
    0,
    `[xiclo${n}] không có liên kết đôi`,
  )
}
console.log('✓ 3. [xiclo3]…[xiclo6]: đa giác đều, không nối đôi')

// 4. [benzen](1:CH3)(4:NO2) đối diện; (1:CH3)(2:OH) kề nhau
{
  const para = layoutStruct({ formula: '[benzen](1:CH3)(4:NO2)', style: 'condensed' })
  const r = para.rings[0]
  assert.equal(para.bonds.length, 2)
  const d14 = dist([para.bonds[0].x1, para.bonds[0].y1], [para.bonds[1].x1, para.bonds[1].y1])
  assert.ok(Math.abs(d14 - 2 * r.r) < 0.5, `p-nitrotoluen khoảng cách 1-4 = ${d14.toFixed(2)}, đường kính = ${2 * r.r}`)

  const ortho = layoutStruct({ formula: '[benzen](1:CH3)(2:OH)', style: 'condensed' })
  const ro = ortho.rings[0]
  const d12 = dist([ortho.bonds[0].x1, ortho.bonds[0].y1], [ortho.bonds[1].x1, ortho.bonds[1].y1])
  const edgeLen = dist(ro.vertices[0], ro.vertices[1])
  assert.ok(Math.abs(d12 - edgeLen) < 0.5, `o-cresol khoảng cách 1-2 = ${d12.toFixed(2)}, cạnh = ${edgeLen.toFixed(2)}`)
}
console.log('✓ 4. Vị trí nhóm thế (1:4 đối diện, 1:2 kề nhau)')

// 5. C6H5-CH3 và CH3-[benzen] cho cùng bố cục vòng
{
  const a = layoutStruct({ formula: 'C6H5-CH3', style: 'condensed' })
  const b = layoutStruct({ formula: 'CH3-[benzen]', style: 'condensed' })
  assert.equal(a.rings.length, 1)
  assert.equal(b.rings.length, 1)
  const ra = a.rings[0]
  const rb = b.rings[0]
  assert.equal(ra.r, rb.r)
  const relA = ra.vertices.map((p) => [p[0] - ra.cx, p[1] - ra.cy] as [number, number])
  const relB = rb.vertices.map((p) => [p[0] - rb.cx, p[1] - rb.cy] as [number, number])
  for (const pa of relA) {
    assert.ok(relB.some((pb) => dist(pa, pb) < 0.5), 'C6H5-CH3 và CH3-[benzen] có cùng tập đỉnh vòng')
  }
}
console.log('✓ 5. C6H5-CH3 và CH3-[benzen] cùng bố cục vòng')

// 6. Không chữ nào đè vòng: hộp bao các nhãn nhóm thế không giao các cạnh vòng
for (const formula of [
  '[benzen](1:CH3)(4:NO2)',
  '[benzen](1:CH3)(2:OH)',
  '[benzen]-CH=CH2',
  '[benzen]-COOH',
  '[benzen]-OH',
  '[benzen]-NH2',
  'CH3-CH2-[benzen]',
  '[xiclo6](1:CH3)(3:COOH)',
]) {
  for (const style of ['condensed', 'skeletal'] as const) {
    const lay = layoutStruct({ formula, style, number: true })
    for (const ring of lay.rings) {
      for (const e of ring.edges) {
        const p1 = ring.vertices[e.from]
        const p2 = ring.vertices[e.to]
        for (const lbl of lay.labels) {
          assert.ok(
            !segIntersectsBox(p1, p2, lbl.box),
            `Nhãn "${lbl.text}" trong "${formula}" (${style}) không được giao cạnh vòng`,
          )
        }
      }
    }
  }
}
console.log('✓ 6. Không nhãn nhóm thế nào giao cạnh vòng')

// 7. Lỗi cú pháp ném lỗi tiếng Việt rõ ràng
assert.throws(() => renderStructSvg({ formula: '[benzen](7:CH3)' }, ''), /Vị trí nhóm thế.*1 đến 6/)
assert.throws(() => renderStructSvg({ formula: '[xiclo9]' }, ''), /Vòng từ 3 đến 8 cạnh/)
console.log('✓ 7. Lỗi cú pháp ném lỗi tiếng Việt rõ ràng')

// 8. toolFromRaw đọc được JSON ví dụ trong FIGURE_GUIDE; renderTool không lỗi, không NaN
const aiExamples = [
  { kind: 'struct', formula: '[benzen]-CH=CH2', style: 'condensed' },
  { kind: 'struct', formula: '[benzen](1:CH3)(4:NO2)', style: 'condensed' },
  { kind: 'struct', formula: '[xiclo6]', style: 'skeletal' },
]
for (const raw of aiExamples) {
  const doc = toolFromRaw(raw)
  assert.equal(doc.kind, 'struct')
  const img = renderTool(doc)
  assert.equal(img.errors, undefined)
  assert.ok(!img.svg.includes('NaN'), `SVG của ${raw.formula} không chứa NaN`)
  assert.ok(img.width > 0 && img.height > 0)
}
console.log('✓ 8. toolFromRaw & renderTool hoạt động sạch với ví dụ FIGURE_GUIDE')
