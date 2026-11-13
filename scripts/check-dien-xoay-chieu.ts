/**
 * Kiểm tra mở rộng công cụ osc: Điện xoay chiều (mode: 'ac') và Sóng dừng (mode: 'standing').
 * Chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-dien-xoay-chieu.ts
 */
import assert from 'node:assert/strict'
import {
  AC_DEFAULT,
  OSC_DEFAULT,
  STANDING_DEFAULT,
  acEquation,
  standingInfo,
  type OscSpec,
} from '../src/lib/oscillation'
import { readToolDoc, renderTool } from '../src/lib/toolSpec'
import { toolFromRaw } from '../src/lib/docRewrite'

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`)

// 1. Tương thích ngược: spec cũ không có mode giống hệt mode: 'osc'
const imgLegacy = renderTool({ kind: 'osc', spec: OSC_DEFAULT })
const imgExplicit = renderTool({ kind: 'osc', spec: { ...OSC_DEFAULT, mode: 'osc' } })
assert.ok(imgLegacy.svg.includes('>8<') && imgLegacy.svg.includes('>−8<'), 'Spec cũ vẫn vẽ bình thường')
assert.equal(
  imgLegacy.svg.replace(/<desc>[^<]*<\/desc>/, ''),
  imgExplicit.svg.replace(/<desc>[^<]*<\/desc>/, ''),
  'Spec không có mode vẽ giống hệt mode: osc',
)
console.log('✓ Spec cũ không có mode vẽ giống hệt')

// 2. Điện xoay chiều (mode: 'ac')
const acSpec: OscSpec = {
  ...OSC_DEFAULT,
  mode: 'ac',
  ac: {
    ...AC_DEFAULT,
    U0: 220 * Math.SQRT2,
    I0: 2,
    period: { by: 'f', value: 50 },
    phiUPi: 0,
    phiIPi: -1 / 3,
    tEnd: 0.03,
    showPhaseDiff: true,
    phaseDiffLabel: 'dt',
  },
}
const eq = acEquation(acSpec)
assert.equal(eq.u, 'u = 220√2cos(100πt) (V)')
assert.equal(eq.i, 'i = 2cos(100πt − π/3) (A)')

const acImg = renderTool({ kind: 'osc', spec: acSpec })
assert.ok(acImg.svg.includes('u (V)') || acImg.svg.includes('>u</tspan>'), 'Có trục u (V)')
assert.ok(acImg.svg.includes('>i</tspan>'), 'Có trục i (A)')
assert.ok(acImg.svg.includes('Δt'), 'Có nhãn độ lệch pha Δt')
assert.deepEqual(readToolDoc(acImg.svg), { kind: 'osc', spec: acSpec }, 'Round-trip readToolDoc cho AC')

const uPathMatch = acImg.svg.match(/<path data-curve="u" d="(M[^"]+)"/)
const iPathMatch = acImg.svg.match(/<path data-curve="i" d="(M[^"]+)"/)
assert.ok(uPathMatch && iPathMatch, 'Tìm thấy path u và i')
const parsePts = (d: string) => [...d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
const uPts = parsePts(uPathMatch[1])
const iPts = parsePts(iPathMatch[1])
const minUy = Math.min(...uPts.map((p) => p[1]))
const minIy = Math.min(...iPts.map((p) => p[1]))
const firstPeakU = uPts.find((p) => Math.abs(p[1] - minUy) < 0.05)!
const firstPeakI = iPts.find((p) => Math.abs(p[1] - minIy) < 0.05)!
// W = 460, left = 62, right = 398 => plotWidth = 336, tEnd = 0.03
const expectedDx = ((1 / 300) / 0.03) * (398 - 62)
const actualDx = firstPeakI[0] - firstPeakU[0]
assert.ok(Math.abs(actualDx - expectedDx) < 1, `Độ lệch đỉnh Δx = ${actualDx} px (kì vọng ${expectedDx} px, sai số < 1 px)`)
console.log(`✓ AC: ${eq.u}; ${eq.i}; Δx = ${actualDx.toFixed(2)} px (kì vọng ${expectedDx.toFixed(2)} px)`)

// 3. Sóng dừng (mode: 'standing')
// 3a. Hai đầu cố định: ℓ=60, k=3 -> λ=40, 4 nút ở 0, 20, 40, 60
const stFixedSpec: OscSpec = {
  ...OSC_DEFAULT,
  mode: 'standing',
  standing: { ...STANDING_DEFAULT, length: 60, k: 3, ends: 'fixed-fixed' },
}
const stFixedInfo = standingInfo(stFixedSpec.standing!)
near(stFixedInfo.lambda, 40)
assert.deepEqual(stFixedInfo.nodes, [0, 20, 40, 60])
const stFixedImg = renderTool({ kind: 'osc', spec: stFixedSpec })
const fixedNodes = [...stFixedImg.svg.matchAll(/data-node="([^"]+)"/g)].map((m) => Number(m[1]))
assert.deepEqual(fixedNodes, [0, 20, 40, 60], 'SVG có đúng 4 nút ở 0, 20, 40, 60')
assert.ok(stFixedImg.svg.includes('λ/2'), 'Có kích thước λ/2')
assert.deepEqual(readToolDoc(stFixedImg.svg), { kind: 'osc', spec: stFixedSpec }, 'Round-trip readToolDoc cho sóng dừng')

// 3b. Một đầu tự do: ℓ=50, k=3 -> λ=40, 3 nút ở 0, 20, 40, đầu x=50 là bụng
const stFreeSpec: OscSpec = {
  ...OSC_DEFAULT,
  mode: 'standing',
  standing: { ...STANDING_DEFAULT, length: 50, k: 3, ends: 'fixed-free' },
}
const stFreeInfo = standingInfo(stFreeSpec.standing!)
near(stFreeInfo.lambda, 40)
assert.deepEqual(stFreeInfo.nodes, [0, 20, 40])
const stFreeImg = renderTool({ kind: 'osc', spec: stFreeSpec })
const freeNodes = [...stFreeImg.svg.matchAll(/data-node="([^"]+)"/g)].map((m) => Number(m[1]))
const freeAntinodes = [...stFreeImg.svg.matchAll(/data-antinode="([^"]+)"/g)].map((m) => Number(m[1]))
assert.deepEqual(freeNodes, [0, 20, 40], 'SVG có đúng 3 nút ở 0, 20, 40')
assert.ok(freeAntinodes.includes(50), 'Đầu tự do x=50 là bụng')
console.log('✓ Sóng dừng: hai đầu cố định (λ=40, 4 nút) và một đầu tự do (λ=40, 3 nút, đầu x=50 là bụng)')

// 4. toolFromRaw đọc JSON ví dụ cho cả 2 mode và renderTool không lỗi
const rawAc = {
  kind: 'osc',
  mode: 'ac',
  ac: { U0: 311.13, I0: 2, period: { by: 'f', value: 50 }, phiUPi: 0, phiIPi: -0.3333, tEnd: 0.03, grid: 'T/8', ticks: 'value', showPhaseDiff: true },
}
const docAc = toolFromRaw(rawAc)
assert.equal(docAc.kind, 'osc')
if (docAc.kind === 'osc') {
  assert.equal(docAc.spec.mode, 'ac')
  assert.ok(renderTool(docAc).svg.includes('<svg'))
}

const rawSt = {
  kind: 'osc',
  mode: 'standing',
  standing: { length: 60, k: 3, ends: 'fixed-fixed', A: 4, showNodes: true, showAntinodes: true, showDim: true },
}
const docSt = toolFromRaw(rawSt)
assert.equal(docSt.kind, 'osc')
if (docSt.kind === 'osc') {
  assert.equal(docSt.spec.mode, 'standing')
  assert.ok(renderTool(docSt).svg.includes('<svg'))
}
console.log('✓ toolFromRaw + renderTool hoạt động cho cả mode ac và standing')
