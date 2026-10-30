/** Kiểm `summarize` (lib/attempts.ts): gộp theo người, điểm cao nhất, xếp hạng, mức điểm. Chạy: `npm run test:attempts`. */
import assert from 'node:assert/strict'
import { isRemoteExamId, summarize, type Attempt } from '@/lib/attempts'

let n = 0
const at = (name: string, score: number, sec: number, user: string | null = null, max = 10): Attempt => ({
  id: String(++n), exam_id: 'e', user_id: user, student_name: name, score, max_score: max, duration_seconds: sec, created_at: `2026-10-30T10:${String(60 - n).padStart(2, '0')}:00Z`,
})

// mới nhất trước: An làm 3 lần (6 → 9 → 7), Bình 9 điểm nhanh hơn An, Chi 4,5, Dũng tài khoản làm 2 lần
const s = summarize([at('An ', 7, 300), at('Bình', 9, 200), at('An', 9, 400), at('Chi', 4.5, 100), at('Dũng', 8, 500, 'u1'), at('Dung', 5, 100, 'u1'), at('An', 6, 250)])
assert.equal(s.attempts, 7)
assert.equal(s.students.length, 4, 'An (kể cả có dấu cách thừa) gộp một người; tài khoản u1 gộp dù đổi tên')
assert.deepEqual(s.top.map((x) => x.name), ['Bình', 'An', 'Dũng'], 'bằng điểm thì ai nhanh hơn xếp trên')
assert.equal(s.students.find((x) => x.name.startsWith('An'))!.attempts, 3)
assert.equal(s.top[1].best, 9)
assert.equal(s.top[1].seconds, 400)
assert.equal(s.students.find((x) => x.name === 'Dũng')!.name, 'Dũng', 'tên lấy từ lần mới nhất')
assert.deepEqual(s.bands, [1, 0, 0, 3], 'Chi <5; Bình, An, Dũng ≥8')
assert.equal(Math.round(s.avg * 100) / 100, Math.round(((9 + 9 + 8 + 4.5) / 4) * 100) / 100)

// thang khác 10 được quy về thang 10
assert.equal(summarize([at('Em', 15, 60, null, 20)]).avg, 7.5)
assert.deepEqual(summarize([]).top, [])
assert.equal(summarize([]).avg, 0)

assert.ok(isRemoteExamId('0b7e1c24-5f6a-4c0e-9a3d-1f2e3d4c5b6a'))
assert.ok(!isRemoteExamId('p0k7s6wa') && !isRemoteExamId(undefined))
console.log('test:attempts ok')
