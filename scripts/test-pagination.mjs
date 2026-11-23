/**
 * Test tính ngắt trang theo khối (computePagePlan).
 * Chạy: npm run test:pagination
 */
import assert from 'node:assert/strict'
import { computePagePlan, computeRichPagePlan } from '../src/examEditor/pagination.ts'

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

check('bảng nhiều dòng qua trang → đẩy cả dòng không vừa sang trang sau', () => {
  const p = computeRichPagePlan(
    [
      { kind: 'block', pos: 0, naturalTop: 0, height: 800 },
      {
        kind: 'table',
        pos: 10,
        naturalTop: 810,
        height: 300,
        rows: [
          { pos: 11, naturalTop: 810, height: 100, cells: [{ pos: 12, rowSpan: 1, children: [] }] },
          {
            pos: 30,
            naturalTop: 910,
            height: 100,
            cells: [
              { pos: 31, rowSpan: 1, children: [] },
              { pos: 40, rowSpan: 1, children: [] },
            ],
          },
          { pos: 50, naturalTop: 1010, height: 100, cells: [{ pos: 51, rowSpan: 1, children: [] }] },
        ],
      },
    ],
    CONTENT_H,
    STRIDE,
    MARGIN,
  )
  assert.equal(p.pages, 2)
  assert.equal(p.widgets.length, 2)
  assert.deepEqual(p.widgets[0], { pos: 32, height: STRIDE - 910, kind: 'row' })
  assert.deepEqual(p.widgets[1], { pos: 41, height: STRIDE - 910, kind: 'row' })
})

check('bảng có ô cao nhiều đoạn (>240px) → ngắt giữa các đoạn trong ô, không đẩy cả dòng', () => {
  const p = computeRichPagePlan(
    [
      {
        kind: 'table',
        pos: 0,
        naturalTop: 0,
        height: 1200,
        rows: [
          { pos: 1, naturalTop: 0, height: 800, cells: [{ pos: 2, rowSpan: 2, children: [] }] },
          {
            pos: 20,
            naturalTop: 800,
            height: 400,
            cells: [
              {
                pos: 21,
                rowSpan: 1,
                children: [
                  { kind: 'block', pos: 22, naturalTop: 804, height: 80 },
                  { kind: 'block', pos: 40, naturalTop: 888, height: 60 },
                  { kind: 'block', pos: 60, naturalTop: 952, height: 100 },
                  { kind: 'block', pos: 80, naturalTop: 1056, height: 140 },
                ],
              },
              {
                pos: 100,
                rowSpan: 1,
                children: [{ kind: 'block', pos: 101, naturalTop: 804, height: 30 }],
              },
            ],
          },
        ],
      },
    ],
    CONTENT_H,
    STRIDE,
    MARGIN,
  )
  assert.equal(p.pages, 2)
  assert.deepEqual(p.widgets, [{ pos: 60, height: STRIDE - 952, kind: 'block' }])
})

check('khối container dài (>1 trang) → ngắt giữa các phần tử con', () => {
  const p = computeRichPagePlan(
    [
      {
        kind: 'container',
        pos: 0,
        naturalTop: 0,
        height: 1200,
        children: [
          { kind: 'block', pos: 1, naturalTop: 0, height: 600 },
          { kind: 'block', pos: 10, naturalTop: 600, height: 600 },
        ],
      },
    ],
    CONTENT_H,
    STRIDE,
    MARGIN,
  )
  assert.equal(p.pages, 2)
  assert.deepEqual(p.widgets, [{ pos: 10, height: STRIDE - 600, kind: 'block' }])
})

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
