import assert from 'node:assert/strict'
import { shouldShowWelcomeGift, welcomeGiftCount, WELCOME_GIFT_COUNT_MS, WELCOME_GIFT_SINCE } from '../src/lib/welcomeGift.ts'

const now = Date.parse('2026-11-29T12:00:00Z')
const eligible = { userId: 'user-a', createdAt: '2026-11-22T12:00:00Z', now, points: 80, welcome: 80, unlimited: false, seen: false }
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
assert.equal(allowed({ points: 57 }), false, 'Đã dùng một phần quà thì không hiện')
assert.equal(allowed({ points: 79 }), false)
assert.equal(allowed({ points: 120 }), true, 'Có nạp thêm mà quà còn nguyên vẫn hiện')
assert.equal(allowed({ welcome: 0 }), false, 'Admin đặt 0 điểm thì không có quà')
assert.equal(allowed({ welcome: 100, points: 80 }), false, 'Quà hiện hành là 100 mà chỉ còn 80')
assert.equal(allowed({ welcome: 50, points: 50 }), true)

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

assert.equal(allowed({ createdAt: new Date(WELCOME_GIFT_SINCE).toISOString(), now: WELCOME_GIFT_SINCE + 1000 }), true, 'Tạo đúng mốc phát hành vẫn hiện')
assert.equal(allowed({ createdAt: new Date(WELCOME_GIFT_SINCE - 1).toISOString(), now: WELCOME_GIFT_SINCE + 1000 }), false, 'Đăng ký trước mốc phát hành thì không hiện')
assert.equal(allowed({ createdAt: '2026-11-19T01:00:00Z', now: Date.parse('2026-11-22T12:00:00Z') }), false, 'Người đăng ký 19/11 không hiện')
