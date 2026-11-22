import assert from 'node:assert/strict'
import { presenceReturnStats } from '../server/presenceReturnStats.js'

const firstDay = { visits: 3, active_days: 1, first_day: '2026-12-20' }
const midnightVN = Date.parse('2026-12-22T17:00:00Z')

assert.deepEqual(presenceReturnStats(firstDay, Date.parse('2026-12-20T01:00:00Z')), {
  visits: 3, returnDays: 0, returnRate: 0,
})
assert.deepEqual(presenceReturnStats({ ...firstDay, visits: 6, active_days: 4 }, midnightVN), {
  visits: 6, returnDays: 3, returnRate: 1,
})

const oneReturn = { ...firstDay, active_days: 2 }
assert.equal(presenceReturnStats(oneReturn, midnightVN - 1).returnRate, 1 / 2)
assert.equal(presenceReturnStats(oneReturn, midnightVN).returnRate, 1 / 3)
assert.equal(presenceReturnStats({ ...firstDay, active_days: 9 }, midnightVN).returnRate, 1)
assert.deepEqual(presenceReturnStats({ ...firstDay, active_days: 0 }, midnightVN), {
  visits: 3, returnDays: 0, returnRate: 0,
})
assert.deepEqual(presenceReturnStats(undefined, midnightVN), {
  visits: 0, returnDays: 0, returnRate: null,
})
assert.equal(presenceReturnStats({ ...firstDay, first_day: null }, midnightVN).returnRate, null)

console.log('OK: thống kê quay lại và mốc đổi ngày giờ Việt Nam')
