/**
 * Rút gọn lịch sử chat gửi kèm mỗi lượt gọi AI (src/lib/aiHistory.ts).
 *   npm run test:ai-history
 */
import assert from 'node:assert/strict'
import { compactHistory, HISTORY_LIMITS } from '../src/lib/aiHistory.ts'
import type { LlmMessage } from '../src/lib/llm.ts'

const chars = (m: LlmMessage[]) => m.reduce((n, x) => n + x.content.length, 0)
const make = (n: number, size: number): LlmMessage[] =>
  Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `${i % 2 === 0 ? 'Yêu cầu' : 'Trả lời'} số ${i}: ` + 'chữ '.repeat(size) }))

// 1) hội thoại ngắn: giữ nguyên
const short = make(4, 20)
assert.equal(compactHistory(short), short)

// 2) ít tin nhưng dài: không có lượt cũ để gộp → giữ nguyên
const fewLong = make(HISTORY_LIMITS.keepRecent, 800)
assert.equal(compactHistory(fewLong), fewLong)

// 3) dài: gộp lượt cũ, giữ nguyên lượt gần nhất, nhỏ đi nhiều
const long = make(40, 300)
const out = compactHistory(long)
assert.ok(chars(out) < chars(long) / 4, `đã giảm: ${chars(long)} → ${chars(out)}`)
assert.equal(out.length, HISTORY_LIMITS.keepRecent)
const tailSrc = long.slice(-HISTORY_LIMITS.keepRecent)
assert.equal(out.at(-1)!.content.slice(0, 30), tailSrc.at(-1)!.content.slice(0, 30))
assert.ok(out[0].content.startsWith('Tóm tắt các lượt trước'))
assert.ok(out[0].content.includes('Giáo viên:'))
assert.ok(out[0].content.includes('đã lược bỏ'), 'nhiều lượt cũ thì có nhắc đã lược bỏ')

// 4) không có hai tin cùng vai liền nhau ngay sau chỗ gộp
for (let i = 1; i < out.length; i++) assert.notEqual(out[i].role, out[i - 1].role)

// 5) tin gần nhất quá dài thì cắt
const huge = [...make(10, 50), { role: 'assistant' as const, content: 'x'.repeat(10_000) }]
const hugeOut = compactHistory(huge)
assert.ok(hugeOut.at(-1)!.content.length < HISTORY_LIMITS.recentClip + 40)
assert.ok(hugeOut.at(-1)!.content.endsWith('[đã rút gọn]'))

// 6) xác định: cùng đầu vào cho cùng đầu ra (giữ được cache prompt của nhà cung cấp)
assert.deepEqual(compactHistory(long), compactHistory(long))

// 7) lượt cũ nhất giữ lại khi còn chỗ (ngắn, ít lượt cũ)
const mid = make(10, 120)
const midOut = compactHistory(mid)
assert.ok(midOut[0].content.includes('Yêu cầu số 0'))
assert.ok(!midOut[0].content.includes('đã lược bỏ'))

console.log('test-ai-history: ok')

// nhãn loại việc của lượt gọi AI (server/ops.ts)
const { aiKind } = await import('../server/ops.ts')
assert.equal(aiKind('soan-de', { intent: 'chat' }), 'question')
assert.equal(aiKind('soan-de', { intent: 'doc' }), 'task-doc')
assert.equal(aiKind('slide-chat', { variant: 'plan' }), 'task-slide')
assert.equal(aiKind('slide-chat', { variant: 'chat' }), 'question')
assert.equal(aiKind('slide-lo', {}), 'task-slide')
assert.equal(aiKind('slide-sua', {}), 'edit-slide')
assert.equal(aiKind('bang-ve', {}), 'board')
assert.equal(aiKind('tim-web'), 'web-search')
assert.equal(aiKind('ten-la'), 'other')
assert.equal(aiKind(undefined), 'untagged')
console.log('test-ai-history (aiKind): ok')
