/** /api/exam mở đề bằng mã link ngắn: tra đúng đề, mã sai bị đếm và chặn. Chạy: npm run test:exam-code */
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'

process.env.SUPABASE_URL = 'https://db.test'
process.env.VITE_SUPABASE_URL = 'https://db.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'

const ID = '00000000-0000-4000-8000-000000000001'
const asked: string[] = []
globalThis.fetch = (async (u: string | URL) => {
  const url = String(u)
  asked.push(url)
  if (url.includes('code=eq.k7m3qx')) return Response.json([{ id: ID }])
  if (url.includes('code=eq.')) return Response.json([])
  if (url.includes(`id=eq.${ID}`)) return Response.json([{ listed: true, doc: { id: 'd', blocks: [] } }])
  return Response.json([])
}) as typeof fetch

const { handleExamRequest } = await import('../server/exam.ts')

async function call(body: unknown) {
  const req = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    method: 'POST',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  }) as unknown as IncomingMessage
  let status = 0
  let text = ''
  const res = {
    set statusCode(v: number) { status = v },
    get statusCode() { return status },
    setHeader() {},
    writeHead(v: number) { status = v; return this },
    end(v?: string) { text = v ?? '' },
  } as unknown as ServerResponse
  await handleExamRequest(req, res)
  return { status, data: text ? (JSON.parse(text) as { id?: string; error?: string }) : {} }
}

const ok = await call({ code: 'K7M3QX' })
assert.equal(ok.status, 200)
assert.equal(ok.data.id, ID)

// mã sai dạng không được đi tới DB (không chèn được bộ lọc khác vào câu truy vấn)
const before = asked.length
for (const code of ['abc', 'k7m3q0', 'k7m3qx&status=neq.x', 123]) assert.equal((await call({ code })).status, 404)
assert.equal(asked.length, before)

// gõ sai quá 30 lần thì chặn, kể cả mã đúng
for (let i = 0; i < 26; i++) assert.equal((await call({ code: 'zzzzzz' })).status, 404)
assert.equal((await call({ code: 'zzzzzz' })).status, 429)
assert.equal((await call({ code: 'k7m3qx' })).status, 429)
// link cũ theo id không bị ảnh hưởng
assert.equal((await call({ id: ID })).status, 200)

console.log('test-exam-code: OK')
