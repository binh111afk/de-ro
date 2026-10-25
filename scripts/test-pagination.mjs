/**
 * Test tính ngắt trang theo khối (computePagePlan).
 * Chạy: npm run test:pagination
 */
import assert from 'node:assert/strict'
import { computePagePlan } from '../src/examEditor/pagination.ts'

let pass = 0
let fail = 0
const check = (name, fn) => {
  try {
    fn()
    pass++
    console.log('✅', name)
  } catch (err) {
    fail++
    console.log('❌', name, '-', err.message)
  }
}

const CONTENT_H = 971 // A4 1123 − 2×76
const STRIDE = 1147 // PAGE_H + PAGE_GAP
const MARGIN = 76

const plan = (heights, spaces = heights.map(() => 0)) =>
  computePagePlan(heights, spaces, CONTENT_H, STRIDE, MARGIN)

check('vừa một trang → không có spacer, 1 tờ', () => {
  const p = plan([300, 300, 300], [0, 10, 10])
  assert.equal(p.gaps.size, 0)
  assert.equal(p.pages, 1)
})

check('khối không đủ chỗ → đẩy sang đầu trang sau', () => {
  const p = plan([500, 500], [0, 10])
  assert.equal(p.gaps.get(1), STRIDE - 510)
  assert.equal(p.pages, 2)
})

check('khối cao hơn cả trang → để tràn, vẫn đủ số tờ', () => {
  const p = plan([1500])
  assert.equal(p.gaps.size, 0)
  assert.equal(p.pages, 2)
})

check('ba khối lớn → ngắt đúng hai lần, 3 tờ', () => {
  const p = plan([900, 900, 900], [0, 10, 10])
  assert.equal(p.gaps.size, 2)
  assert.equal(p.pages, 3)
  assert.equal(p.gaps.get(2), 2294 - 2057)
})

check('khối đầu có margin-top → vẫn đặt đúng đầu trang sau', () => {
  const p = plan([500, 500], [5, 10])
  // y của khối 2 = 5 (margin đầu) + 500 + 10 = 515 → spacer = 1147 − 515
  assert.equal(p.gaps.get(1), STRIDE - 515)
  assert.equal(p.pages, 2)
})

check('không có khối → 1 tờ', () => {
  const p = plan([])
  assert.equal(p.pages, 1)
  assert.equal(p.gaps.size, 0)
})

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
