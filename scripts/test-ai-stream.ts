/**
 * /api/llm chế độ stream (SSE), chạy trong tiến trình với fetch giả (không gọi mạng thật):
 *  1. stream thành công: client nhận think/delta rồi done; trừ đúng usage thật nhà cung cấp báo ở cuối luồng;
 *  2. client đóng kết nối giữa chừng: server vẫn đọc hết upstream và trừ đủ điểm;
 *  3. upstream đứt giữa chừng: trừ theo phần đã nhận (không phải mức trần), báo lỗi qua sự kiện `error`;
 *  4. model chính đứt giữa chừng → model dự phòng: có sự kiện `retry`, trừ phần hỏng + lượt dự phòng;
 *  5. upstream lỗi trước khi có chữ: vẫn trả JSON như cũ (chưa mở luồng);
 *  6. không xin stream: trả JSON như cũ.
 *   npx tsx scripts/test-ai-stream.ts
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
process.env.LLM_MODEL = 'app-model'
process.env.AI_WELCOME_POINTS = '120'
process.env.AI_MONTHLY_TOKENS = '0'
for (const k of ['VERCEL', 'DEEPSEEK_API_KEY', 'FOSTA_API_KEY', 'ANYROUTER_API_KEY', 'NIGHTROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'LLM_FALLBACK_MODEL']) delete process.env[k]

const db = { credits: 120_000, used: 0 }
/** cách upstream trả lời lượt kế tiếp, theo thứ tự gọi */
type Mode = 'ok' | 'break' | 'fail'
let plan: Mode[] = []
const calls: Array<{ model: string; stream: boolean }> = []
const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 })
const enc = new TextEncoder()
const chunk = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`)

function sse(mode: Mode, model: string): Response {
  const parts = [
    chunk({ model, choices: [{ delta: { reasoning_content: 'nghĩ '.repeat(50) } }] }),
    chunk({ model, choices: [{ delta: { content: '{"blocks":[{"type":"question","text":"1+1"}' } }] }),
    chunk({ model, choices: [{ delta: { content: ',{"type":"question","text":"2+2"}]}' } }] }),
  ]
  let i = 0
  const body = new ReadableStream<Uint8Array>({
    pull(ctrl) {
      if (mode === 'break' && i === 2) return ctrl.error(new TypeError('socket hang up'))
      if (i < parts.length) return ctrl.enqueue(parts[i++])
      ctrl.enqueue(chunk({ model, choices: [{ finish_reason: 'stop', delta: {} }] }))
      ctrl.enqueue(chunk({ model, choices: [], usage: { total_tokens: 5_000, prompt_tokens: 1_000, completion_tokens: 4_000 } }))
      ctrl.enqueue(enc.encode('data: [DONE]\n\n'))
      ctrl.close()
    },
  })
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
}

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const body = init.body ? JSON.parse(String(init.body)) : {}
  if (url.includes('/chat/completions')) {
    calls.push({ model: body.model, stream: !!body.stream })
    const mode = plan.shift() ?? 'ok'
    if (mode === 'fail') return new Response('{}', { status: 400 })
    if (body.stream) return sse(mode, body.model)
    return ok({ model: body.model, choices: [{ finish_reason: 'stop', message: { content: 'nội dung' } }], usage: { total_tokens: 5_000 } })
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
  return ok([])
}) as typeof fetch

const { handleLlmRequest } = await import('../server/llmProxy.ts')

interface Out {
  status: number
  type: string
  events: Array<Record<string, unknown>>
  json: Record<string, unknown> | null
}

/** `closeAfter`: client đóng kết nối sau N lần ghi (mô phỏng đóng tab) */
async function hit(payload: Record<string, unknown>, closeAfter = Infinity): Promise<Out> {
  const req = Readable.from([Buffer.from(JSON.stringify(payload))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    url: '/api/llm',
    headers: { host: 'localhost', origin: 'http://localhost', authorization: `Bearer h.${Buffer.from(JSON.stringify({ sub: USER })).toString('base64url')}.s`, 'content-type': 'application/json' },
    socket: { remoteAddress: '203.0.113.9' },
  })
  const out: Out = { status: 0, type: '', events: [], json: null }
  let raw = ''
  let writes = 0
  const res = {
    headersSent: false,
    writableEnded: false,
    destroyed: false,
    setHeader() {},
    getHeader() {},
    flushHeaders() {},
    writeHead(c: number, h?: Record<string, string>) {
      out.status = c
      out.type = h?.['Content-Type'] ?? ''
      this.headersSent = true
      return this
    },
    write(s: string) {
      if (this.destroyed) throw new Error('write after close')
      raw += s
      if (++writes >= closeAfter) this.destroyed = true
      return true
    },
    end(b?: string) {
      this.writableEnded = true
      if (b) raw += b
    },
  }
  await handleLlmRequest(req, res as unknown as ServerResponse)
  if (out.type.includes('event-stream')) {
    out.events = raw.split('\n\n').filter((b) => b.startsWith('data:')).map((b) => JSON.parse(b.slice(5)))
  } else if (raw) out.json = JSON.parse(raw)
  return out
}

let fail = 0
const check = (name: string, cond: boolean, info?: unknown) => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` — ${JSON.stringify(info)}`}`)
  if (!cond) fail++
}
const msgs = (t: string) => [{ role: 'user', content: t }]
const spentBy = async (fn: () => Promise<Out>) => {
  const before = db.credits
  const r = await fn()
  return { r, spent: before - db.credits }
}

// 1. thành công
{
  plan = ['ok']
  const { r, spent } = await spentBy(() => hit({ messages: msgs('soạn đề'), maxTokens: 8000, stream: true }))
  const types = r.events.map((e) => e.type)
  const done = r.events.find((e) => e.type === 'done')
  check('stream: mở SSE', r.status === 200 && r.type.includes('event-stream'), r)
  check('stream: có think trước delta, kết thúc bằng done', types[0] === 'think' && types.includes('delta') && types.at(-1) === 'done', types)
  check('stream: done mang đủ nội dung', String(done?.content).includes('"2+2"'), done)
  check('stream: gọi upstream với stream:true', calls.at(-1)?.stream === true, calls.at(-1))
  check('stream: trừ đúng usage thật (5.000 token)', spent === 5_000, spent)
}

// 2. client đóng tab sau lần ghi đầu → vẫn trừ đủ
{
  plan = ['ok']
  const { spent } = await spentBy(() => hit({ messages: msgs('soạn đề b'), maxTokens: 8000, stream: true }, 1))
  check('đóng tab giữa chừng: vẫn trừ đủ 5.000 token', spent === 5_000, spent)
}

// 3. upstream đứt giữa chừng → trừ theo phần đã nhận, sự kiện error
{
  plan = ['break']
  const { r, spent } = await spentBy(() => hit({ messages: msgs('soạn đề c'), maxTokens: 8000, stream: true }))
  const last = r.events.at(-1)
  check('đứt giữa chừng: kết thúc bằng sự kiện error', last?.type === 'error', r.events.map((e) => e.type))
  check('đứt giữa chừng: có trừ điểm phần đã sinh', spent > 0, spent)
  check('đứt giữa chừng: không trừ mức trần (≤ 2 × (prompt + phần nhận))', spent < 2 * 8_000, spent)
}

// 4. model chính đứt → model dự phòng (DeepSeek)
{
  process.env.DEEPSEEK_API_KEY = 'ds'
  process.env.DEEPSEEK_MODEL = 'deepseek-flash'
  plan = ['break', 'ok']
  const n0 = calls.length
  const { r, spent } = await spentBy(() => hit({ messages: msgs('soạn đề d'), maxTokens: 8000, stream: true }))
  const types = r.events.map((e) => e.type)
  check('dự phòng: có sự kiện retry', types.includes('retry'), types)
  check('dự phòng: kết thúc done bằng model dự phòng', r.events.at(-1)?.type === 'done' && r.events.at(-1)?.model === 'deepseek-flash', r.events.at(-1))
  check('dự phòng: đứt thì chuyển ngay sang dự phòng (2 lượt)', calls.length - n0 === 2, calls.slice(n0))
  check('dự phòng: trừ lượt dự phòng + phần hỏng', spent > 5_000, spent)
  delete process.env.DEEPSEEK_API_KEY
}

// 5. lỗi trước khi có chữ → JSON như cũ
{
  plan = ['fail', 'fail']
  const r = await hit({ messages: msgs('soạn đề e'), maxTokens: 8000, stream: true })
  check('lỗi trước khi có chữ: trả JSON 502, không mở luồng', r.status === 502 && !!r.json?.error && !r.type.includes('event-stream'), r)
}

// 6. không xin stream → JSON như cũ
{
  plan = ['ok']
  const r = await hit({ messages: msgs('soạn đề f'), maxTokens: 8000 })
  check('không stream: trả JSON như cũ', r.status === 200 && r.json?.content === 'nội dung' && calls.at(-1)?.stream === false, r)
}

console.log(fail ? `\n${fail} lỗi` : '\nTất cả đều qua')
process.exit(fail ? 1 : 0)
