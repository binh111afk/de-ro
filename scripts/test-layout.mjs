/**
 * Test chọn số cột phương án (port thuật toán choiceLayout).
 * Chạy: npx tsx scripts/test-layout.mjs
 */
import assert from 'node:assert/strict'
import { chooseColumns } from '../src/examEditor/choiceLayout.ts'

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

const AVAIL = 642
const GAP = 19

check('4 phương án ngắn → 4 cột', () => {
  assert.equal(chooseColumns([100, 110, 90, 120], AVAIL, GAP), 4)
})

check('4 phương án dài → 2 cột', () => {
  assert.equal(chooseColumns([240, 250, 230, 245], AVAIL, GAP), 2)
})

check('4 phương án rất dài → 1 cột', () => {
  assert.equal(chooseColumns([400, 410, 390, 405], AVAIL, GAP), 1)
})

check('3 phương án vừa → 3 cột', () => {
  assert.equal(chooseColumns([180, 175, 190], AVAIL, GAP), 3)
})

check('3 phương án dài → 1 cột (không chia hết cho 2)', () => {
  assert.equal(chooseColumns([300, 310, 305], AVAIL, GAP), 1)
})

check('5 phương án không chia đều được → 1 cột', () => {
  assert.equal(chooseColumns([80, 80, 80, 80, 80], AVAIL, GAP), 1)
})

check('không vượt quá 4 cột', () => {
  assert.equal(chooseColumns(Array(8).fill(60), AVAIL, GAP), 4)
})

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
