/** Test lớp chặn lạm dụng API (server/guard.ts): Origin lạ, hạn mức khách theo IP, máy dev không bị chặn.
 * Ngoài Vercel guard lấy IP từ socket (bỏ qua x-forwarded-for vì giả được), nên mỗi ca đặt remoteAddress riêng. */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { guard } from '../server/guard.ts'

let pass = 0
let fail = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✅' : '❌'} ${name}`)
  ok ? pass++ : fail++
}

function mock(headers: Record<string, string>, remote = '203.0.113.9') {
  const req = { method: 'POST', headers, socket: { remoteAddress: remote } } as unknown as IncomingMessage
  const out = { status: 0 }
  const res = {
    headersSent: false,
    writeHead(code: number) {
      out.status = code
      return this
    },
    setHeader() {},
    end() {},
  } as unknown as ServerResponse
  return { req, res, out }
}

const host = { host: 'de-ro-lac.vercel.app' }

{
  const m = mock({ ...host, origin: 'https://evil.example' }, '198.51.100.1')
  check('Origin trang lạ bị chặn 403', !(await guard(m.req, m.res, 'llm')) && m.out.status === 403)
}
{
  const m = mock({ ...host, origin: 'https://de-ro-lac.vercel.app' }, '198.51.100.2')
  check('Origin cùng trang được qua', await guard(m.req, m.res, 'llm'))
}
{
  let okCount = 0
  let last = 0
  for (let i = 0; i < 25; i++) {
    const m = mock({ ...host }, '198.51.100.3')
    if (await guard(m.req, m.res, 'llm')) okCount++
    else last = m.out.status
  }
  check(`khách cùng IP: 20 lượt qua rồi 429 (qua ${okCount}, lỗi ${last})`, okCount === 20 && last === 429)
}
{
  const m = mock({ ...host }, '198.51.100.4')
  check('IP khác vẫn có lượt riêng', await guard(m.req, m.res, 'llm'))
}
{
  let ok = true
  for (let i = 0; i < 50; i++) {
    const m = mock({ ...host }, '127.0.0.1')
    ok &&= await guard(m.req, m.res, 'llm')
  }
  check('máy dev (localhost) không bị giới hạn', ok)
}
{
  const m = mock({ ...host, authorization: 'Bearer token-sai' }, '198.51.100.5')
  check('token sai: coi như khách, vẫn qua lượt đầu', await guard(m.req, m.res, 'image'))
}

// Strix vuln-0002: token rác không làm máy chủ hỏi Supabase; mỗi IP chỉ hỏi được giới hạn số lần
{
  process.env.VITE_SUPABASE_URL = 'http://sb.test'
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
  let calls = 0
  const realFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    calls++
    return new Response('{}', { status: 401 })
  }) as typeof fetch
  const { userFromToken } = await import('../server/guard.ts')
  const reqWith = (auth: string, ip: string) => ({ headers: { authorization: auth }, socket: { remoteAddress: ip } }) as unknown as IncomingMessage
  await userFromToken(reqWith(`Bearer ${'a'.repeat(8000)}`, '198.51.100.20'))
  await userFromToken(reqWith('Bearer khong-phai-jwt', '198.51.100.20'))
  check('token quá dài / không phải JWT → không hỏi Supabase', calls === 0)
  for (let i = 0; i < 100; i++) await userFromToken(reqWith(`Bearer h.tok${i}.s`, '198.51.100.21'))
  check(`một IP gửi 100 token khác nhau → chỉ hỏi Supabase tối đa 60 lần (hỏi ${calls})`, calls === 60)
  globalThis.fetch = realFetch
}

// Strix vuln-0001: tài liệu riêng (doc/) chỉ chủ tệp tải được; ảnh (img/) vẫn công khai
{
  process.env.R2_ACCOUNT_ID = 'acc'
  process.env.R2_ACCESS_KEY_ID = 'id'
  process.env.R2_SECRET_ACCESS_KEY = 'secret'
  process.env.R2_BUCKET = 'b'
  const KEY = 'doc/' + 'a'.repeat(40) + '.pdf'
  const realFetch = globalThis.fetch
  let r2Reads = 0
  globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input)
    if (url.includes('/rest/v1/user_documents')) {
      // RLS giả: chỉ token của chủ tệp thấy dòng
      const owner = String((init.headers as Record<string, string>).Authorization) === 'Bearer h.owner.s'
      return new Response(JSON.stringify(owner ? [{ id: 1 }] : []), { status: 200 })
    }
    r2Reads++
    return new Response('PDF', { status: 200, headers: { 'content-type': 'application/pdf' } })
  }) as typeof fetch
  const { handleFileRequest } = await import('../server/r2.ts')
  const get = async (key: string, auth?: string) => {
    const req = { method: 'GET', url: `/${key}`, headers: auth ? { authorization: auth } : {} } as unknown as IncomingMessage
    const out = { status: 0, cache: '' }
    const res = {
      headersSent: false,
      setHeader() {},
      writeHead(c: number, h?: Record<string, string>) {
        out.status = c
        out.cache = h?.['Cache-Control'] ?? ''
        return this
      },
      end() {},
    } as unknown as ServerResponse
    await handleFileRequest(req, res)
    return out
  }
  check('khách (không token) tải tài liệu riêng → 404', (await get(KEY)).status === 404)
  check('người khác tải tài liệu riêng → 404', (await get(KEY, 'Bearer h.other.s')).status === 404)
  check('không phải chủ thì không đọc R2', r2Reads === 0)
  const own = await get(KEY, 'Bearer h.owner.s')
  check('chủ tệp tải được, không cho proxy giữ', own.status === 200 && own.cache.includes('private'))
  check('ảnh (img/) vẫn công khai', (await get('img/' + 'b'.repeat(40) + '.png')).status === 200)
  globalThis.fetch = realFetch
}

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
if (fail) process.exit(1)
