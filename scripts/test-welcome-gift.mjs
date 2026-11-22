import assert from 'node:assert/strict'
import { shouldShowWelcomeGift, welcomeGiftCount, WELCOME_GIFT_COUNT_MS } from '../src/lib/welcomeGift.ts'

const now = Date.parse('2026-11-22T12:00:00Z')
const eligible = { userId: 'user-a', createdAt: '2026-11-15T12:00:00Z', now, points: 80, unlimited: false, seen: false }
const allowed = (overrides) => shouldShowWelcomeGift({ ...eligible, ...overrides })

assert.equal(allowed(), true, 'Đúng bảy ngày vẫn đủ điều kiện')
assert.equal(allowed({ createdAt: new Date(now).toISOString() }), true)
assert.equal(allowed({ now: now + 1 }), false, 'Quá bảy ngày một mili giây')
assert.equal(allowed({ createdAt: new Date(now + 1).toISOString() }), false)
assert.equal(allowed({ createdAt: undefined }), false)
assert.equal(allowed({ createdAt: 'không hợp lệ' }), false)
assert.equal(allowed({ userId: undefined }), false)
assert.equal(allowed({ seen: true }), false)
assert.equal(allowed({ userId: 'user-b', seen: false }), true)
assert.equal(allowed({ unlimited: true }), false)
for (const points of [0, -1, NaN, Infinity]) assert.equal(allowed({ points }), false)
assert.equal(allowed({ points: 1 }), true)

const duration = WELCOME_GIFT_COUNT_MS
assert.equal(welcomeGiftCount(80, -1), 0)
assert.equal(welcomeGiftCount(80, 0), 0)
assert.equal(welcomeGiftCount(80, duration / 2), 70, 'Nửa thời gian đạt 87,5% theo ease-out cubic')
assert.equal(welcomeGiftCount(80, duration - 1), 79)
assert.equal(welcomeGiftCount(80, duration), 80)
assert.equal(welcomeGiftCount(80, duration + 1), 80)
assert.equal(welcomeGiftCount(1, duration), 1)

let previous = 0
for (let elapsed = 0; elapsed <= duration; elapsed += 1) {
  const count = welcomeGiftCount(137, elapsed)
  assert.ok(Number.isInteger(count) && count >= previous && count <= 137)
  previous = count
}
console.log('Quà chào mừng: các ca điều kiện hiển thị và đếm điểm đều đạt.')
