/**
 * Chống lạm dụng điểm AI (/api/llm), chạy trong tiến trình với fetch giả (không gọi mạng thật):
 *  1. client gửi maxTokens rất lớn → bị cắt về trần, và không vượt số token còn lại;
 *  2. client gửi tên model lạ → không chuyển lên gateway;
 *  3. biên nhận hoàn điểm chỉ hoàn khi gọi lại ĐÚNG yêu cầu cũ (giữ kết quả đắt rồi "gọi lại" bằng câu rẻ thì không hoàn),
 *     kể cả đổi mức suy luận / nhiệt độ, và chỉ hoàn khi lượt gọi lại thành công;
 *  4. hạn mức tính cả token gửi lên (prompt dài không lách được số dư); lượt trả rỗng vẫn bị tính.
 *   npx tsx scripts/test-ai-abuse.ts
 */
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'

const SB = 'http://sb.test'
const USER = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'

process.env.VITE_SUPABASE_URL = SB
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'
process.env.AI_RECEIPT_SECRET = 'test-secret'
process.env.LLM_API_KEY = 'dummy'
process.env.OPENCODE_FALLBACK = '1'
process.env.LLM_MODEL = 'app-model'
process.env.AI_WELCOME_POINTS = '120'
// các ca kiểm trừ điểm / lạm dụng dùng yêu cầu không task; việc bắt buộc task được kiểm ở test-ai-stream.ts
process.env.AI_ALLOW_TASKLESS = '1'
process.env.AI_MONTHLY_TOKENS = '0'
for (const k of ['VERCEL', 'DEEPSEEK_API_KEY', 'GLM_API_KEY', 'GLM_BASE_URL', 'GLM_MODEL', 'FOSTA_API_KEY', 'ANYROUTER_API_KEY', 'NIGHTROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'LLM_FALLBACK_MODEL']) delete process.env[k]

// DB giả: số dư điểm + token đã dùng tháng này + biên nhận đã hoàn
const db = { credits: 120_000, used: 0, refunds: new Set<string>() }
const holds = new Map<string, { amount: number; receipt: string | null; refund: number }>()
const settled = new Map<string, { used: number; balance: number }>()
let loseSettlementResponse = false
let pauseUpstream: (() => Promise<void>) | undefined
let nextUsage = 30_000
let emptyReply = false
// số lượt rỗng đã ghi trong ai_calls 24 giờ qua (server chỉ đếm tối đa 3)
let emptyToday = 0
let upstreamDown = false
const upstream: Array<{ model: string; max_tokens: number; messages?: unknown[] }> = []
const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 })

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const body = init.body ? JSON.parse(String(init.body)) : {}
  if (url.includes('/chat/completions')) {
    upstream.push({ model: body.model, max_tokens: body.max_tokens, messages: body.messages })
    const pause = pauseUpstream
    pauseUpstream = undefined
    await pause?.()
    if (upstreamDown) return new Response('{}', { status: 400 })
    if (emptyReply) return ok({ model: body.model, choices: [{ finish_reason: 'length', message: { content: '' } }], usage: { total_tokens: nextUsage } })
    return ok({ model: body.model, choices: [{ finish_reason: 'stop', message: { content: 'nội dung' } }], usage: { total_tokens: nextUsage } })
  }
  if (url.endsWith('/auth/v1/user')) return ok({ id: USER })
  if (url.includes('/rest/v1/ai_calls') && !init.method) return ok(Array.from({ length: Math.min(emptyToday, 3) }, (_, i) => ({ id: i })))
  if (url.includes('/rest/v1/ai_quota_overrides')) return ok([])
  if (url.includes('/rest/v1/ai_usage')) return ok([{ tokens: db.used }])
  if (url.includes('/rest/v1/ai_credits')) return ok([{ balance: db.credits }])
  if (url.includes('/rpc/reserve_ai_request')) {
    const active = [...holds.values()]
    if (body.p_receipt && (db.refunds.has(body.p_receipt) || active.some((hold) => hold.receipt === body.p_receipt))) return ok('receipt_unavailable')
    const amount = Math.max(0, body.p_amount - body.p_receipt_tokens)
    if (db.used + amount + active.reduce((sum, hold) => sum + hold.amount, 0) > body.p_base + db.credits) return ok('quota_exceeded')
    holds.set(body.p_id, { amount, receipt: body.p_receipt, refund: body.p_receipt_tokens })
    return ok('reserved')
  }
  if (url.includes('/rpc/finish_ai_request')) {
    const previous = settled.get(body.p_id)
    if (previous) return ok(previous)
    const hold = holds.get(body.p_id)
    holds.delete(body.p_id)
    if (!hold || !body.p_tokens) return ok(null)
    if (hold.receipt && body.p_refund_cap > 0) {
      db.refunds.add(hold.receipt)
      db.credits += Math.min(hold.refund, body.p_refund_cap, body.p_tokens)
    }
    db.used += body.p_tokens
    const pay = Math.min(db.used, db.credits)
    db.used -= pay
    db.credits -= pay
    const result = { used: db.used, balance: db.credits }
    settled.set(body.p_id, result)
    if (loseSettlementResponse) {
      loseSettlementResponse = false
      throw new Error('Mất phản hồi sau khi DB ghi sổ')
    }
    return ok(result)
  }
  return ok([])
}) as typeof fetch

const { handleLlmRequest } = await import('../server/llmProxy.ts')

async function hit(payload: unknown, headers: Record<string, string> = {}) {
  const req = Readable.from([Buffer.from(JSON.stringify(payload))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    url: '/api/llm',
    headers: { host: 'localhost', origin: 'http://localhost', authorization: `Bearer h.${Buffer.from(JSON.stringify({ sub: USER, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.s`, 'content-type': 'application/json', ...headers },
    socket: { remoteAddress: '203.0.113.9' },
  })
  const out = { status: 0, body: '' }
  const res = {
    headersSent: false,
    setHeader() {},
    getHeader() {},
    writeHead(c: number) {
      out.status = c
      return this
    },
    end(b?: string) {
      out.body = b ?? ''
    },
  } as unknown as ServerResponse
  await handleLlmRequest(req, res)
  return { status: out.status, data: out.body ? (JSON.parse(out.body) as { receipt?: string; error?: string }) : {} }
}

let fail = 0
const check = (name: string, cond: boolean, info?: unknown) => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` — ${JSON.stringify(info)}`}`)
  if (!cond) fail++
}

const msgs = (t: string) => [{ role: 'user', content: t }]

// 1. maxTokens khổng lồ → cắt về 32.000
const r1 = await hit({ messages: msgs('soạn đề'), maxTokens: 250_000, model: 'gpt-9-premium-ultra-expensive' })
check('lượt thường vẫn chạy', r1.status === 200, r1)
check('maxTokens 250.000 bị cắt về ≤ 32.000', upstream[0]?.max_tokens <= 32_000, upstream[0])
check('model lạ không được chuyển lên gateway', upstream[0]?.model === 'app-model', upstream[0])

// Thử lại RPC khi DB đã ghi sổ nhưng kết nối mất phản hồi.
const beforeLost = db.credits
nextUsage = 300
loseSettlementResponse = true
const recovered = await hit({ messages: msgs('kiểm tra ghi sổ'), maxTokens: 400 })
check('mất phản hồi DB: ghi usage đúng một lần và vẫn trả kết quả', recovered.status === 200 && db.credits === beforeLost - 300)

// 2. "gọi lại" bằng câu rẻ, khác yêu cầu cũ → KHÔNG hoàn
const beforeCheap = db.credits
nextUsage = 2
await hit({ messages: msgs('x'), maxTokens: 256 }, { 'x-ai-retry-of': r1.data.receipt ?? '' })
check('gọi lại bằng câu rẻ khác → không hoàn điểm', db.credits === beforeCheap - 2, { before: beforeCheap, after: db.credits })

// 3. gọi lại ĐÚNG yêu cầu cũ → được hoàn (kết quả hỏng thật)
nextUsage = 30_000
const r3 = await hit({ messages: msgs('soạn đề 2'), maxTokens: 32_000 })
const afterBad = db.credits
await hit({ messages: msgs('soạn đề 2'), maxTokens: 32_000 }, { 'x-ai-retry-of': r3.data.receipt ?? '' })
check('gọi lại đúng yêu cầu cũ → hoàn lượt hỏng, chỉ trả lượt mới', db.credits === afterBad, { afterBad, now: db.credits })

// Biên nhận đã hoàn không bù số dư nữa.
db.credits = 0
upstream.length = 0
const duplicate = await hit({ messages: msgs('soạn đề 2'), maxTokens: 32_000 }, { 'x-ai-retry-of': r3.data.receipt ?? '' })
check('biên nhận đã dùng không nới hạn mức khi số dư bằng 0', duplicate.status === 429 && upstream.length === 0)

// 4. không vượt số token còn lại
db.credits = 3_000
db.used = 0
upstream.length = 0
nextUsage = 100
process.env.DEEPSEEK_API_KEY = 'ds'
await hit({ messages: msgs('ít điểm'), maxTokens: 32_000 })
delete process.env.DEEPSEEK_API_KEY
check('còn 3.000 token → trần lượt này ≤ 3.000', upstream[0]?.max_tokens <= 3_000, upstream[0])

// Lượt model mạnh giữ nguyên tổng mức trả theo hệ số hoặc rơi về model thường nếu thiếu.
db.credits = 3_000
db.used = 0
upstream.length = 0
process.env.DEEPSEEK_API_KEY = 'ds'
process.env.DEEPSEEK_STRONG_MODEL = 'strong-model'
process.env.STRONG_POINT_FACTOR = '3'
await hit({ messages: msgs('ít điểm'), maxTokens: 32_000, strong: true })
check('model mạnh tính hệ số trước khi đặt trần', upstream[0]?.model === 'strong-model' && upstream[0].max_tokens < 1000, upstream[0])
delete process.env.DEEPSEEK_API_KEY
delete process.env.DEEPSEEK_STRONG_MODEL
delete process.env.STRONG_POINT_FACTOR

// Hai lượt thực sự chồng nhau: lượt đầu giữ chỗ trong lúc đợi provider.
db.credits = 3_000
db.used = 0
nextUsage = 600
upstream.length = 0
const started = Promise.withResolvers<void>()
const resume = Promise.withResolvers<void>()
pauseUpstream = () => {
  started.resolve()
  return resume.promise
}
const inFlight = hit({ messages: msgs('lượt đang giữ chỗ'), maxTokens: 2_500 })
await Promise.race([started.promise, inFlight])
try {
  const concurrent = await hit({ messages: msgs('lượt kế bên'), maxTokens: 2_500 })
  check('lượt song song thiếu chỗ → 429 trước khi gọi provider', concurrent.status === 429 && upstream.length === 1)
} finally {
  resume.resolve()
}
check('lượt đang giữ chỗ hoàn thành và trừ đúng usage', (await inFlight).status === 200 && db.credits === 2_400)

// 5. prompt rất dài với số dư ít → chặn trước khi gọi model (trước đây 1 token số dư gọi được ~87.000 token)
db.credits = 1_000
db.used = 0
upstream.length = 0
const r5 = await hit({ messages: msgs('x'.repeat(60_000)), maxTokens: 256 })
check('số dư 1.000 + prompt ~20.000 token → 429, không gọi model', r5.status === 429 && upstream.length === 0, { r5, calls: upstream.length })
db.credits = 8_000
const r5c = await hit({ messages: msgs('x'.repeat(60_000)), maxTokens: 256 })
check('còn 8 điểm, yêu cầu cần ~20 điểm → báo rõ cần bao nhiêu, không nói "đã hết điểm"', r5c.status === 429 && /cần khoảng 21 điểm.*còn 8 điểm/.test(r5c.data.error ?? ''), r5c)
const r5b = await hit({ messages: msgs('x'.repeat(700_000)), maxTokens: 256 })
check('prompt quá dài (> 200k token ước) → 413', r5b.status === 413, r5b)

// 6. gọi lại đổi mức suy luận (yếu tố quyết định giá) → không hoàn
db.credits = 120_000
nextUsage = 30_000
const r6 = await hit({ messages: msgs('soạn đề 6'), maxTokens: 32_000, reasoningEffort: 'low' })
const after6 = db.credits
nextUsage = 1000
await hit({ messages: msgs('soạn đề 6'), maxTokens: 32_000, reasoningEffort: 'max' }, { 'x-ai-retry-of': r6.data.receipt ?? '' })
check('gọi lại cùng messages nhưng đổi reasoningEffort → không hoàn', db.credits === after6 - 1000, { after6, now: db.credits })

// 7. lượt gọi lại hỏng (model lỗi) → không hoàn; biên nhận vẫn dùng được cho lần gọi lại thành công sau
nextUsage = 30_000
const r7 = await hit({ messages: msgs('soạn đề 7'), maxTokens: 32_000 })
const after7 = db.credits
upstreamDown = true
const r7b = await hit({ messages: msgs('soạn đề 7'), maxTokens: 32_000 }, { 'x-ai-retry-of': r7.data.receipt ?? '' })
upstreamDown = false
check('lượt gọi lại thất bại → không hoàn điểm', r7b.status === 502 && db.credits === after7, { status: r7b.status, after7, now: db.credits })

// 8. model trả rỗng (người dùng không nhận được gì) → không tính điểm
emptyReply = true
nextUsage = 5_000
const before8 = db.credits
upstream.length = 0
await hit({ messages: msgs('soạn đề 8'), maxTokens: 32_000 })
emptyReply = false
// lượt gọi model trả rỗng (kể cả lượt tự thử lại) không trừ điểm người dùng
check('model trả rỗng → không trừ điểm', upstream.length > 0 && db.credits === before8, { before8, now: db.credits, calls: upstream.length })

// 8b. đã đủ trần miễn điểm (3 lượt rỗng / 24 giờ) → các lượt rỗng tiếp theo tính điểm như cũ
emptyToday = 3
emptyReply = true
nextUsage = 5_000
const before8b = db.credits
upstream.length = 0
await hit({ messages: msgs('soạn đề 8b'), maxTokens: 32_000 })
emptyReply = false
check('đủ trần 3 lượt rỗng / ngày → trừ điểm mỗi lượt gọi', upstream.length > 0 && db.credits === before8b - 5_000 * upstream.length, { before8b, now: db.credits, calls: upstream.length })

// 8c. mới 2 lượt rỗng → còn được miễn
emptyToday = 2
emptyReply = true
const before8c = db.credits
await hit({ messages: msgs('soạn đề 8c'), maxTokens: 32_000 })
emptyReply = false
emptyToday = 0
check('mới 2 lượt rỗng / ngày → vẫn miễn điểm', db.credits === before8c, { before8c, now: db.credits })

// 9. model rỗng "" không được coi là lựa chọn
upstream.length = 0
nextUsage = 10
await hit({ messages: msgs('m'), model: '' })
check('model "" → dùng model chính', upstream[0]?.model === 'app-model', upstream[0])

// 10. giấu prompt dài trong trường khác `content` (name) → bị bỏ, không chuyển lên model
db.credits = 1_000
db.used = 0
upstream.length = 0
const r10 = await hit({ messages: [{ role: 'user', content: 'hi', name: 'x'.repeat(60_000) }], maxTokens: 256 })
check('trường name bị bỏ trước khi gửi model', !JSON.stringify(upstream[0]?.messages ?? []).includes('xxxx'), { r10: r10.status })

if (fail) {
  console.error(`${fail} lỗi`)
  process.exit(1)
}
console.log('test-ai-abuse: OK')
