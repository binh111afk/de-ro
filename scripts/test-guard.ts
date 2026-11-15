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

/** JWT giả có `sub` (chữ ký không kiểm ở đây — Supabase giả quyết định hợp lệ hay không) */
const jwt = (sub: string) => `h.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.s`

// Strix vuln-0002 + bản vá lại: token rác không làm máy chủ hỏi Supabase; đếm lượt hỏi theo tài khoản
// (sub) và một mức chung rộng cho IP; hết lượt / Supabase lỗi → "bận" (503), không biến thành khách
{
  process.env.VITE_SUPABASE_URL = 'http://sb.test'
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
  let calls = 0
  let down = false
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (_u: string | URL, init: RequestInit = {}) => {
    calls++
    if (down) return new Response('{}', { status: 503 })
    const auth = String((init.headers as Record<string, string>).Authorization)
    const sub = JSON.parse(Buffer.from(auth.split('.')[1], 'base64url').toString()).sub as string
    return sub.startsWith('real-') ? new Response(JSON.stringify({ id: sub }), { status: 200 }) : new Response('{}', { status: 401 })
  }) as typeof fetch
  const { userFromToken, checkToken, guard: g } = await import('../server/guard.ts')
  const reqWith = (auth: string, ip: string) => ({ headers: { authorization: auth }, socket: { remoteAddress: ip } }) as unknown as IncomingMessage
  await userFromToken(reqWith(`Bearer ${'a'.repeat(8000)}`, '198.51.100.20'))
  await userFromToken(reqWith('Bearer khong-phai-jwt', '198.51.100.20'))
  await userFromToken(reqWith('Bearer h.e30.s', '198.51.100.20')) // JWT không có sub
  check('token quá dài / không phải JWT / thiếu sub → không hỏi Supabase', calls === 0)
  calls = 0
  for (let i = 0; i < 100; i++) await userFromToken(reqWith(`Bearer ${jwt('victim-x')}.${i}`.replace(/\.(\d+)$/, '$1'), '198.51.100.21'))
  check(`100 token giả cùng một sub → chỉ hỏi Supabase 30 lần (hỏi ${calls})`, calls === 30)
  // người thật cùng IP vẫn đăng nhập được dù kẻ kia đã spam
  const real = await checkToken(reqWith(`Bearer ${jwt('real-1')}`, '198.51.100.21'))
  check('người dùng thật cùng IP vẫn được nhận ra sau khi có người spam', real.userId === 'real-1' && !real.busy)
  // Supabase lỗi tạm: báo bận (503), không coi là khách, không nhớ kết quả
  down = true
  const m = mock({ ...host, authorization: `Bearer ${jwt('real-2')}` }, '198.51.100.22')
  const passed = await g(m.req, m.res, 'llm')
  check('Supabase lỗi tạm → guard trả 503 thử lại, không phải khách', !passed && m.out.status === 503)
  down = false
  const again = await checkToken(reqWith(`Bearer ${jwt('real-2')}`, '198.51.100.22'))
  check('lỗi tạm không bị nhớ: lần sau nhận ra người dùng', again.userId === 'real-2')
  globalThis.fetch = realFetch
}

// Strix vuln-0001 + bản vá lại: tài liệu riêng (doc/) chỉ chủ tệp tải được — chủ lấy từ metadata R2
// (server ghi lúc tải lên), không từ cột `url` người dùng tự ghi; tệp cũ: dòng user_documents sớm nhất
{
  process.env.R2_ACCOUNT_ID = 'acc'
  process.env.R2_ACCESS_KEY_ID = 'id'
  process.env.R2_SECRET_ACCESS_KEY = 'secret'
  process.env.R2_BUCKET = 'b'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc'
  const KEY = 'doc/' + 'a'.repeat(40) + '.pdf'
  const OLD = 'doc/' + 'c'.repeat(40) + '.pdf'
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input)
    if (url.includes('/auth/v1/user')) {
      const auth = String((init.headers as Record<string, string>).Authorization)
      const sub = JSON.parse(Buffer.from(auth.split('.')[1], 'base64url').toString()).sub as string
      return new Response(JSON.stringify({ id: sub }), { status: 200 })
    }
    if (url.includes('/rest/v1/user_documents')) {
      // tệp cũ: chủ thật thêm dòng trước, kẻ gian tự thêm dòng trỏ vào tệp sau → dòng sớm nhất là chủ thật
      return new Response(JSON.stringify([{ user_id: 'owner' }]), { status: 200 })
    }
    const meta: Record<string, string> = url.includes(KEY) ? { 'x-amz-meta-owner': 'owner' } : {}
    return new Response('PDF', { status: 200, headers: { 'content-type': 'application/pdf', ...meta } })
  }) as typeof fetch
  const { handleFileRequest } = await import('../server/r2.ts')
  const get = async (key: string, auth?: string) => {
    const req = { method: 'GET', url: `/${key}`, headers: auth ? { authorization: auth } : {}, socket: { remoteAddress: '203.0.113.50' } } as unknown as IncomingMessage
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
  check('người khác tải tài liệu riêng → 404', (await get(KEY, `Bearer ${jwt('other')}`)).status === 404)
  const own = await get(KEY, `Bearer ${jwt('owner')}`)
  check('chủ tệp tải được, không cho proxy giữ', own.status === 200 && own.cache.includes('private'))
  check('tệp cũ (chưa có metadata): kẻ tự thêm dòng trỏ vào vẫn bị 404', (await get(OLD, `Bearer ${jwt('other')}`)).status === 404)
  check('tệp cũ: chủ (dòng sớm nhất) tải được', (await get(OLD, `Bearer ${jwt('owner')}`)).status === 200)
  check('ảnh (img/) vẫn công khai', (await get('img/' + 'b'.repeat(40) + '.png')).status === 200)
  globalThis.fetch = realFetch
}

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
if (fail) process.exit(1)
