/**
 * Test hàm tính điểm và bảng giá trong src/lib/pricing.ts.
 * Chạy: npm run test:pricing (hoặc npx tsx scripts/test-pricing.mjs)
 */
import assert from 'node:assert/strict'
import {
  MAX_VND,
  MIN_VND,
  PACKS,
  PRICING_PUBLIC,
  USAGE,
  basePoints,
  boughtPacks,
  clampVnd,
  packPoints,
  usesFor,
  vndFor,
} from '../src/lib/pricing.ts'

assert.equal(PRICING_PUBLIC, false, 'PRICING_PUBLIC mặc định phải là false')
assert.equal(PACKS.length, 5, 'phải có đủ 5 gói')
assert.equal(PACKS[0].vnd, 2_000)
assert.equal(PACKS[0].bonus, 0, 'gói 2.000đ không có thưởng')

// 5 gói: lần đầu và lần sau
const expectedPacks = [
  { vnd: 2_000, first: 50, next: 50 },
  { vnd: 5_000, first: 131, next: 125 },
  { vnd: 10_000, first: 275, next: 250 },
  { vnd: 20_000, first: 575, next: 500 },
  { vnd: 50_000, first: 1500, next: 1250 },
]
for (const exp of expectedPacks) {
  const pack = PACKS.find((p) => p.vnd === exp.vnd)
  assert.ok(pack, `thiếu gói ${exp.vnd}`)
  assert.equal(packPoints(pack, true), exp.first, `gói ${exp.vnd} lần đầu`)
  assert.equal(packPoints(pack, false), exp.next, `gói ${exp.vnd} lần sau`)
}

// clampVnd
assert.equal(clampVnd(1_000), MIN_VND)
assert.equal(clampVnd(1_999), MIN_VND)
assert.equal(clampVnd(2_000), 2_000)
assert.equal(clampVnd(2_500), 3_000)
assert.equal(clampVnd(100_000), MAX_VND)
assert.equal(clampVnd(100_001), MAX_VND)

// basePoints
assert.equal(basePoints(7_000), 175)

// vndFor
assert.equal(vndFor(250), 10_000)
assert.equal(vndFor(1), 2_000)
assert.equal(vndFor(251), 11_000)
assert.equal(vndFor(basePoints(MAX_VND) + 500), MAX_VND)

const maxPts = basePoints(MAX_VND)
for (let p = 1; p <= maxPts; p++) {
  const vnd = vndFor(p)
  assert.equal(vnd % 1000, 0, `vndFor(${p}) phải là bội số 1.000đ`)
  assert.ok(vnd >= MIN_VND && vnd <= MAX_VND, `vndFor(${p}) ngoài khoảng`)
  assert.ok(basePoints(vnd) >= p, `basePoints(vndFor(${p})) = ${basePoints(vnd)} < ${p}`)
}

// usesFor
const uses = usesFor(275)
assert.equal(uses.length, USAGE.length)
assert.equal(uses.find((u) => u.id === 'exam')?.count, 9)
assert.equal(uses.find((u) => u.id === 'slide')?.count, 6)
assert.equal(uses.find((u) => u.id === 'ask')?.count, 27)
assert.equal(uses.find((u) => u.id === 'edit')?.count, 55)

// boughtPacks
assert.deepEqual(await boughtPacks(), [])

console.log('test:pricing OK')
