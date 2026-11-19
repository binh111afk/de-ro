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
const month = () => new Date().toISOString().slice(0, 7)

process.env.VITE_SUPABASE_URL = SB
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'
process.env.AI_RECEIPT_SECRET = 'test-secret'
process.env.LLM_API_KEY = 'dummy'
process.env.LLM_MODEL = 'app-model'
process.env.AI_WELCOME_POINTS = '120'
// các ca kiểm trừ điểm / lạm dụng dùng yêu cầu không task; việc bắt buộc task được kiểm ở test-ai-stream.ts
process.env.AI_ALLOW_TASKLESS = '1'
process.env.AI_MONTHLY_TOKENS = '0'
for (const k of ['VERCEL', 'DEEPSEEK_API_KEY', 'FOSTA_API_KEY', 'ANYROUTER_API_KEY', 'NIGHTROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'LLM_FALLBACK_MODEL']) delete process.env[k]

// DB giả: số dư điểm + token đã dùng tháng này + biên nhận đã hoàn
const db = { credits: 120_000, used: 0, refunds: new Set<string>() }
let nextUsage = 30_000
let emptyReply = false
let upstreamDown = false
const upstream: Array<{ model: string; max_tokens: number; messages?: unknown[] }> = []
const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 })

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const body = init.body ? JSON.parse(String(init.body)) : {}
  if (url.includes('/chat/completions')) {
    upstream.push({ model: body.model, max_tokens: body.max_tokens, messages: body.messages })
    if (upstreamDown) return new Response('{}', { status: 400 })
    if (emptyReply) return ok({ model: body.model, choices: [{ finish_reason: 'length', message: { content: '' } }], usage: { total_tokens: nextUsage } })
    return ok({ model: body.model, choices: [{ finish_reason: 'stop', message: { content: 'nội dung' } }], usage: { total_tokens: nextUsage } })
  }
  if (url.endsWith('/auth/v1/user')) return ok({ id: USER })
  if (url.includes('/rest/v1/ai_quota_overrides')) return ok([])
  if (url.includes('/rest/v1/ai_usage')) return ok([{ tokens: db.used }])
  if (url.includes('/rest/v1/ai_credits')) return ok([{ balance: db.credits }])
  if (url.includes('/rpc/reserve_ai_quota')) return ok(true)
  if (url.includes('/rpc/release_ai_quota')) return ok(null)
  if (url.includes('/rpc/add_ai_usage')) {
    db.used += body.p_tokens
    return ok(db.used)
  }
  if (url.includes('/rpc/consume_ai_credits')) {
    const pay = Math.min(Math.max(db.used - body.p_base, 0), db.credits)
    db.used -= pay
    db.credits -= pay
    return ok([{ used: db.used, balance: db.credits }])
  }
  if (url.includes('/rpc/refund_ai_usage')) {
    if (db.refunds.has(body.p_receipt)) return ok(null)
    db.refunds.add(body.p_receipt)
    db.credits += body.p_tokens
    return ok(db.credits)
  }
  return ok([])
}) as typeof fetch

const { handleLlmRequest } = await import('../server/llmProxy.ts')

async function hit(payload: unknown, headers: Record<string, string> = {}) {
  const req = Readable.from([Buffer.from(JSON.stringify(payload))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    url: '/api/llm',
    headers: { host: 'localhost', origin: 'http://localhost', authorization: `Bearer h.${Buffer.from(JSON.stringify({ sub: USER })).toString('base64url')}.s`, 'content-type': 'application/json', ...headers },
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

// 4. không vượt số token còn lại
db.credits = 3_000
db.used = 0
upstream.length = 0
nextUsage = 100
await hit({ messages: msgs('ít điểm'), maxTokens: 32_000 })
check('còn 3.000 token → trần lượt này ≤ 3.000', upstream[0]?.max_tokens <= 3_000, upstream[0])

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

// 8. model trả rỗng vẫn tốn token → bị tính
emptyReply = true
nextUsage = 5_000
const before8 = db.credits
upstream.length = 0
await hit({ messages: msgs('soạn đề 8'), maxTokens: 32_000 })
emptyReply = false
// mỗi lượt gọi model trả rỗng (kể cả lượt tự thử lại) đều bị tính
check('model trả rỗng (đã tốn token) → vẫn trừ điểm mỗi lượt gọi', upstream.length > 0 && db.credits === before8 - 5_000 * upstream.length, { before8, now: db.credits, calls: upstream.length })

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
