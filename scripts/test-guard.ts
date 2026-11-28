/** Test lớp chặn lạm dụng API (server/guard.ts): Origin lạ, hạn mức khách theo IP, máy dev không bị chặn.
 * Ngoài Vercel guard lấy IP từ socket (bỏ qua x-forwarded-for vì giả được), nên mỗi ca đặt remoteAddress riêng. */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { guard } from '../server/guard.ts'
process.env.NODE_ENV ??= 'development' // giả lập `vite` dev: isLocal chỉ miễn trừ loopback khi NODE_ENV=development

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
// Strix lần 3 mục 7: tự host sau reverse proxy (NODE_ENV=production) thì loopback KHÔNG được miễn
{
  process.env.NODE_ENV = 'production'
  let okCount = 0
  for (let i = 0; i < 25; i++) if (await guard(mock({ ...host }, '::1').req, mock({ ...host }, '::1').res, 'llm')) okCount++
  check(`NODE_ENV=production: loopback bị giới hạn như khách (qua ${okCount}/25)`, okCount === 20)
  process.env.ALLOW_LOCAL_BYPASS = '1'
  check('ALLOW_LOCAL_BYPASS=1 bật lại miễn trừ', await guard(mock({ ...host }, '::1').req, mock({ ...host }, '::1').res, 'llm'))
  delete process.env.ALLOW_LOCAL_BYPASS
  process.env.NODE_ENV = 'development'
}
{
  const m = mock({ ...host, authorization: 'Bearer token-sai' }, '198.51.100.5')
  check('token sai: coi như khách, vẫn qua lượt đầu', await guard(m.req, m.res, 'image'))
}

/** JWT giả có `sub` (chữ ký không kiểm ở đây — Supabase giả quyết định hợp lệ hay không) */
const jwtExpiry = Math.floor(Date.now() / 1000) + 3600
const jwt = (sub: string) => `h.${Buffer.from(JSON.stringify({ sub, exp: jwtExpiry })).toString('base64url')}.s`

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
  // Strix lần 4: ngân sách khoá theo mã băm token, không theo `sub` chưa kiểm chữ ký
  for (let i = 0; i < 20; i++) await userFromToken(reqWith(`Bearer ${jwt('victim-x')}`, '198.51.100.21'))
  check(`cùng một token giả gửi 20 lần → chỉ hỏi Supabase 1 lần (kết quả sai được nhớ; hỏi ${calls})`, calls === 1)
  for (let i = 0; i < 40; i++) await userFromToken(reqWith(`Bearer ${jwt('real-9')}.x${i}`.replace(/\.x(\d+)$/, 'x$1'), '198.51.100.23'))
  const victim = await checkToken(reqWith(`Bearer ${jwt('real-9')}`, '198.51.100.24'))
  check('40 token giả mang sub của người khác → người thật vẫn được nhận ra (không 503)', victim.userId === 'real-9' && !victim.busy)
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

// Strix vuln-0001 + lần 3 mục 2: tài liệu riêng (doc/) chỉ chủ tệp tải được — chủ CHỈ lấy từ metadata R2
// (server ghi lúc tải lên). Không còn fallback hỏi user_documents: tệp thiếu metadata thì không ai đọc được.
// Lần 3 mục 3: hạn mức giữ chỗ nguyên tử qua RPC trước khi ghi R2, fail-closed; xoá qua server (xoá cả R2);
// ảnh cũng bắt đăng nhập; đường đọc tệp có giới hạn lượt theo IP.
{
  process.env.R2_ACCOUNT_ID = 'acc'
  process.env.R2_ACCESS_KEY_ID = 'id'
  process.env.R2_SECRET_ACCESS_KEY = 'secret'
  process.env.R2_BUCKET = 'b'
  process.env.VITE_SUPABASE_URL = 'http://sb.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc'
  const KEY = 'doc/' + 'a'.repeat(40) + '.pdf'
  const OLD = 'doc/' + 'c'.repeat(40) + '.pdf'
  const DOC_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
  const calls: string[] = []
  const mode = { rpc: 'ok' as 'ok' | 'quota' | 'down', put: true }
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input)
    const method = init.method ?? 'GET'
    // kiểm tài khoản bị khoá (mọi API): ở đây không ai bị khoá; không ghi vào calls để khỏi lệch thứ tự
    if (url.includes('/auth/v1/admin/users/')) return new Response('{}', { status: 200 })
    calls.push(`${method} ${url}`)
    if (url.includes('/auth/v1/user')) {
      const auth = String((init.headers as Record<string, string>).Authorization)
      const sub = JSON.parse(Buffer.from(auth.split('.')[1], 'base64url').toString()).sub as string
      return new Response(JSON.stringify({ id: sub }), { status: 200 })
    }
    if (url.includes('/rest/v1/rpc/reserve_')) {
      if (mode.rpc === 'quota') return new Response(JSON.stringify({ message: 'QUOTA:Tệp vượt dung lượng còn lại (0.5 MB).' }), { status: 400 })
      if (mode.rpc === 'down') return new Response('{}', { status: 500 })
      return new Response(JSON.stringify(url.includes('document') ? { id: DOC_ID } : true), { status: 200 })
    }
    if (url.includes('/rest/v1/user_documents')) {
      if (method === 'DELETE') return new Response(null, { status: 204 })
      // dòng tài liệu DOC_ID của 'owner' trỏ vào KEY; người khác hỏi thì không có dòng nào
      if (url.includes('neq.')) return new Response('[]', { status: 200 })
      return new Response(JSON.stringify(url.includes('owner_id=eq.owner') ? [{ id: DOC_ID, url: `/api/files/${KEY}` }] : []), { status: 200 })
    }
    if (url.includes('/rest/v1/')) return new Response(null, { status: 204 })
    // R2
    if (method === 'PUT') return new Response(null, { status: mode.put ? 200 : 500 })
    if (method === 'DELETE') return new Response(null, { status: 204 })
    const meta: Record<string, string> = url.includes(KEY) ? { 'x-amz-meta-owner': 'owner' } : {}
    return new Response(method === 'HEAD' ? null : 'PDF', { status: 200, headers: { 'content-type': 'application/pdf', ...meta } })
  }) as typeof fetch
  const { handleFileRequest, handleUploadRequest } = await import('../server/r2.ts')
  const get = async (key: string, auth?: string, ip = '203.0.113.50') => {
    const req = { method: 'GET', url: `/${key}`, headers: auth ? { authorization: auth } : {}, socket: { remoteAddress: ip } } as unknown as IncomingMessage
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
  calls.length = 0
  check('tệp cũ (chưa có metadata): kẻ gian → 404', (await get(OLD, `Bearer ${jwt('other')}`)).status === 404)
  check('tệp cũ chưa backfill: cả chủ cũng 404 (không còn đoán chủ qua user_documents)', (await get(OLD, `Bearer ${jwt('owner')}`)).status === 404)
  check('đọc tệp không còn hỏi user_documents', !calls.some((c) => c.includes('user_documents')))
  check('ảnh (img/) vẫn công khai', (await get('img/' + 'b'.repeat(40) + '.png')).status === 200)
  let limited = 0
  for (let i = 0; i < 610; i++) if ((await get('img/' + 'b'.repeat(40) + '.png', undefined, '203.0.113.77')).status === 429) limited++
  check(`đọc tệp: quá 600 lượt / 10 phút cùng IP → 429 (${limited} lượt bị chặn)`, limited === 10)

  let ip = 1
  const call = async (method: string, opts: { auth?: string; body?: unknown; url?: string }) => {
    const buf = Buffer.from(opts.body === undefined ? '' : JSON.stringify(opts.body))
    const req = Object.assign((async function* () { if (buf.length) yield buf })(), {
      method,
      url: opts.url ?? '/',
      headers: { host: 'de-ro-lac.vercel.app', origin: 'https://de-ro-lac.vercel.app', ...(opts.auth ? { authorization: opts.auth } : {}) },
      socket: { remoteAddress: `192.0.2.${ip++}` },
    }) as unknown as IncomingMessage
    const out = { status: 0, body: '' }
    const res = {
      headersSent: false,
      setHeader() {},
      writeHead(c: number) {
        out.status = c
        return this
      },
      end(b?: string) {
        out.body = b ?? ''
      },
    } as unknown as ServerResponse
    await handleUploadRequest(req, res)
    return out
  }
  const png = { dataUrl: 'data:image/png;base64,' + Buffer.from('png-bytes').toString('base64') }
  const pdf = { dataUrl: 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 x').toString('base64'), name: 'a.pdf' }
  check('khách tải ảnh lên → 401', (await call('POST', { body: png })).status === 401)
  calls.length = 0
  const up = await call('POST', { auth: `Bearer ${jwt('owner')}`, body: pdf })
  const rpcAt = calls.findIndex((c) => c.includes('rpc/reserve_user_document'))
  const putAt = calls.findIndex((c) => c.startsWith('PUT https://acc.r2'))
  check('tải tài liệu: giữ chỗ hạn mức (RPC) TRƯỚC khi ghi R2', up.status === 200 && rpcAt >= 0 && putAt > rpcAt)
  check('ảnh của người đã đăng nhập: tính hạn mức qua reserve_user_image', (await call('POST', { auth: `Bearer ${jwt('owner')}`, body: png })).status === 200 && calls.some((c) => c.includes('rpc/reserve_user_image')))
  mode.rpc = 'quota'
  calls.length = 0
  const over = await call('POST', { auth: `Bearer ${jwt('owner')}`, body: pdf })
  check('vượt hạn mức → 413, không ghi R2', over.status === 413 && over.body.includes('dung lượng') && !calls.some((c) => c.startsWith('PUT https://acc.r2')))
  mode.rpc = 'down'
  calls.length = 0
  check('RPC hạn mức lỗi → 503, không ghi R2 (fail-closed)', (await call('POST', { auth: `Bearer ${jwt('owner')}`, body: pdf })).status === 503 && !calls.some((c) => c.startsWith('PUT https://acc.r2')))
  mode.rpc = 'ok'
  mode.put = false
  calls.length = 0
  check('ghi R2 lỗi → 502 và xoá dòng vừa giữ chỗ', (await call('POST', { auth: `Bearer ${jwt('owner')}`, body: pdf })).status === 502 && calls.some((c) => c.startsWith(`DELETE http://sb.test/rest/v1/user_documents?id=eq.${DOC_ID}`)))
  mode.put = true

  calls.length = 0
  const del = await call('DELETE', { auth: `Bearer ${jwt('owner')}`, url: `/api/upload?id=${DOC_ID}` })
  check('chủ xoá tài liệu: xoá cả tệp R2 lẫn dòng danh sách', del.status === 200 && calls.some((c) => c === `DELETE https://acc.r2.cloudflarestorage.com/b/${KEY}`) && calls.some((c) => c.startsWith('DELETE http://sb.test/rest/v1/user_documents')))
  calls.length = 0
  const delOther = await call('DELETE', { auth: `Bearer ${jwt('other')}`, url: `/api/upload?id=${DOC_ID}` })
  check('người khác xoá tài liệu → 404, không đụng R2', delOther.status === 404 && !calls.some((c) => c.startsWith('DELETE https://acc.r2')))
  check('khách xoá → 401', (await call('DELETE', { url: `/api/upload?id=${DOC_ID}` })).status === 401)
  globalThis.fetch = realFetch
}

// Strix lần 3 mục 1: đề "chỉ làm một lần" — bắt đăng nhập, khoá nguyên tử (exam_attempt_locks) trước khi chấm,
// lỗi khoá → từ chối (fail-closed), lưu bài lỗi → nhả khoá. Không còn tra theo device_id.
{
  process.env.VITE_SUPABASE_URL = 'http://sb.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc'
  const EXAM = '11111111-2222-3333-4444-555555555555'
  const online = {
    title: 'Đề một lần',
    settings: { oneAttempt: true },
    sections: [{ id: 's', title: 'I', questions: [{ id: 'q1', type: 'trac-nghiem', prompt: 'x', options: ['a', 'b'], answer: 'A', points: 1 }] }],
  }
  const locks = new Set<string>()
  let lockDown = false
  let saveDown = false
  const seen: string[] = []
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input)
    if (url.includes('/auth/v1/admin/users/')) return new Response('{}', { status: 200 })
    seen.push(`${init.method ?? 'GET'} ${url}`)
    if (url.includes('/auth/v1/user')) {
      const auth = String((init.headers as Record<string, string>).Authorization)
      const sub = JSON.parse(Buffer.from(auth.split('.')[1], 'base64url').toString()).sub as string
      return new Response(JSON.stringify({ id: sub }), { status: 200 })
    }
    if (url.includes('/rest/v1/community_exams')) return new Response(JSON.stringify([{ doc: { online }, listed: false }]), { status: 200 })
    if (url.includes('/rest/v1/exam_attempt_locks')) {
      if (init.method === 'DELETE') {
        locks.delete(new URL(url).searchParams.get('user_id')!.replace(/^eq\./, ''))
        return new Response(null, { status: 204 })
      }
      if (lockDown) return new Response('{}', { status: 500 })
      const { user_id } = JSON.parse(String(init.body)) as { user_id: string }
      if (locks.has(user_id)) return new Response(JSON.stringify({ code: '23505' }), { status: 409 })
      locks.add(user_id)
      return new Response(null, { status: 201 })
    }
    if (url.includes('/rest/v1/exam_attempts')) return new Response(null, { status: saveDown ? 500 : 201 })
    return new Response('{}', { status: 404 })
  }) as typeof fetch
  const { handleAttemptRequest } = await import('../server/attempt.ts')
  let ip = 60
  const submit = async (auth: string | null, deviceId = 'device-abcdef') => {
    const body = Buffer.from(JSON.stringify({ examId: EXAM, name: 'Hs', answers: { q1: 'A' }, deviceId }))
    const req = Object.assign((async function* () { yield body })(), {
      method: 'POST',
      headers: { host: 'de-ro-lac.vercel.app', origin: 'https://de-ro-lac.vercel.app', ...(auth ? { authorization: auth } : {}) },
      socket: { remoteAddress: `198.51.100.${ip++}` },
    }) as unknown as IncomingMessage
    const out = { status: 0, body: '' }
    const res = {
      headersSent: false,
      setHeader() {},
      writeHead(c: number) {
        out.status = c
        return this
      },
      end(b?: string) {
        out.body = b ?? ''
      },
    } as unknown as ServerResponse
    await handleAttemptRequest(req, res)
    return out
  }
  const anon = await submit(null)
  check('đề một lần: khách (không token) nộp → 401 cần đăng nhập', anon.status === 401 && anon.body.includes('loginRequired'))
  check('đề một lần: lượt đầu của tài khoản → 200', (await submit(`Bearer ${jwt('stu-1')}`)).status === 200)
  check('đề một lần: cùng tài khoản đổi mã thiết bị → 409', (await submit(`Bearer ${jwt('stu-1')}`, 'thiet-bi-khac-))(')).status === 409)
  const par = await Promise.all([submit(`Bearer ${jwt('stu-2')}`), submit(`Bearer ${jwt('stu-2')}`), submit(`Bearer ${jwt('stu-2')}`)])
  check('đề một lần: 3 lượt song song cùng tài khoản → đúng 1 lượt qua', par.filter((r) => r.status === 200).length === 1)
  lockDown = true
  check('đề một lần: bảng khoá lỗi → 503, không chấm (fail-closed)', (await submit(`Bearer ${jwt('stu-3')}`)).status === 503)
  lockDown = false
  saveDown = true
  check('đề một lần: lưu bài lỗi → 502', (await submit(`Bearer ${jwt('stu-4')}`)).status === 502)
  saveDown = false
  check('lưu bài lỗi thì nhả khoá: nộp lại được', (await submit(`Bearer ${jwt('stu-4')}`)).status === 200)
  check('không còn tra exam_attempts theo device_id', !seen.some((s) => s.includes('device_id')))
  globalThis.fetch = realFetch
}

// Strix lần 4 (1/7): ZIP khai số mục trong EOCD ít hơn thật / chèn dữ liệu đầu tệp → từ chối trước khi giải nén
{
  const JSZip = (await import('jszip')).default
  const { assertSafeZip } = await import('../server/extract.ts')
  const z = new JSZip()
  for (let i = 0; i < 5; i++) z.file(`word/p${i}.xml`, '<a/>'.repeat(100))
  const honest = await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const rejects = (b: Buffer) => {
    try {
      assertSafeZip(b)
      return false
    } catch {
      return true
    }
  }
  check('ZIP thật (5 mục) qua kiểm tra', !rejects(honest))
  const eocd = honest.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const under = Buffer.from(honest)
  under.writeUInt16LE(1, eocd + 8)
  under.writeUInt16LE(1, eocd + 10)
  check('EOCD khai 1 mục nhưng có 5 → từ chối', rejects(under))
  const zero = Buffer.from(honest)
  zero.writeUInt16LE(0, eocd + 8)
  zero.writeUInt16LE(0, eocd + 10)
  check('EOCD khai 0 mục → từ chối', rejects(zero))
  check('chèn byte rác đầu tệp (JSZip sẽ dời offset) → từ chối', rejects(Buffer.concat([Buffer.alloc(64, 7), honest])))
  const tail = Buffer.concat([honest, Buffer.alloc(10)])
  check('thừa byte sau EOCD → từ chối', rejects(tail))
}

// Strix lần 4 (2/7): đề link giấu đáp án — nộp bài không trả gì theo từng câu (máy dò đáp án); chỉ điểm + số câu đúng
{
  process.env.VITE_SUPABASE_URL = 'http://sb.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc'
  const EXAM = '99999999-2222-3333-4444-555555555555'
  // cùng đề nhưng giáo viên bật "cho học sinh xem điểm"
  const EXAM_SCORE = '99999999-2222-3333-4444-666666666666'
  const online = {
    title: 'Đề giấu đáp án',
    settings: {},
    sections: [{ id: 's', title: 'I', questions: [
      { id: 'q1', type: 'trac-nghiem', prompt: 'x', options: ['a', 'b', 'c', 'd'], answer: 'B', explanation: 'vì B', points: 1 },
      { id: 'q2', type: 'trac-nghiem', prompt: 'y', options: ['a', 'b', 'c', 'd'], answer: 'C', explanation: 'vì C', points: 1 },
    ] }],
  }
  let listed = false
  let anonCount = 0
  let deviceCount = 0
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input)
    if (url.includes('/rest/v1/community_exams')) {
      const doc = url.includes(EXAM_SCORE) ? { online: { ...online, settings: { showScore: true } } } : { online }
      return new Response(JSON.stringify([{ doc, listed }]), { status: 200 })
    }
    if (url.includes('/rest/v1/exam_attempts')) {
      // đếm bài đã nộp (trần số bài mỗi đề, Strix 7)
      if (init.method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-range': `*/${url.includes('device_id=') ? deviceCount : anonCount}` } })
      return new Response(null, { status: 201 })
    }
    return new Response('{}', { status: 404 })
  }) as typeof fetch
  const { handleAttemptRequest } = await import('../server/attempt.ts')
  const submit = async (answers: Record<string, string>, ipLast: number, examId = EXAM, deviceId?: string) => {
    const body = Buffer.from(JSON.stringify({ examId, name: 'Hs', answers, deviceId }))
    const req = Object.assign((async function* () { yield body })(), {
      method: 'POST',
      headers: { host: 'de-ro-lac.vercel.app', origin: 'https://de-ro-lac.vercel.app' },
      socket: { remoteAddress: `198.51.100.${ipLast}` },
    }) as unknown as IncomingMessage
    const out = { status: 0, body: '' }
    const res = {
      headersSent: false,
      setHeader() {},
      writeHead(c: number) {
        out.status = c
        return this
      },
      end(b?: string) {
        out.body = b ?? ''
      },
    } as unknown as ServerResponse
    await handleAttemptRequest(req, res)
    return { status: out.status, data: JSON.parse(out.body || '{}') as { score?: number; correct?: number; hidden?: boolean; submitted?: boolean; key?: Record<string, unknown> } }
  }
  // Strix lần 5: điểm tổng cũng là máy dò (mỗi lượt làm 1 câu) → đề giấu đáp án chỉ báo đã nộp
  const r = await submit({ q1: 'B', q2: 'A' }, 150)
  check('đề giấu đáp án: nộp xong chỉ báo đã nộp', r.status === 200 && r.data.hidden === true && r.data.submitted === true)
  check('đề giấu đáp án: không trả điểm, số câu đúng, đáp án hay giải thích', r.data.score === undefined && r.data.correct === undefined && r.data.key === undefined && !JSON.stringify(r.data).includes('vì B'))
  const probeA = await submit({ q1: 'B' }, 152)
  const probeB = await submit({ q1: 'A' }, 153)
  check('dò từng câu: trả lời đúng hay sai đều nhận phản hồi giống hệt', JSON.stringify(probeA.data) === JSON.stringify(probeB.data))
  const shown = await submit({ q1: 'B', q2: 'A' }, 154, EXAM_SCORE)
  check('giáo viên bật "cho xem điểm": trả điểm + số câu đúng, vẫn không trả đáp án', shown.data.score === 1 && shown.data.correct === 1 && JSON.stringify(shown.data.key) === '{}' && !JSON.stringify(shown.data).includes('vì B'))
  // nộp dồn dập cùng đề từ một IP: quá 60 lượt / 10 phút → 429
  let blocked = 0
  for (let i = 0; i < 70; i++) if ((await submit({ q1: 'A' }, 151)).status === 429) blocked++
  check(`nộp một đề quá 60 lượt / 10 phút cùng IP → 429 (${blocked} lượt bị chặn)`, blocked === 10)
  // Strix 7: trần số bài nộp không đăng nhập mỗi đề / mỗi thiết bị (không thì bơm "học sinh" giả vô hạn)
  anonCount = 400
  check('đề đã có 400 bài nộp không đăng nhập → 429', (await submit({ q1: 'B' }, 160)).status === 429)
  anonCount = 10
  deviceCount = 20
  check('một thiết bị đã nộp 20 lượt → 429', (await submit({ q1: 'B' }, 161, EXAM, 'thiet-bi-01')).status === 429)
  deviceCount = 19
  check('thiết bị dưới trần → nộp được', (await submit({ q1: 'B' }, 162, EXAM, 'thiet-bi-01')).status === 200)
  globalThis.fetch = realFetch
  void listed
  listed = true
}

// Strix lần 4 (3,5/7): token kiểm chữ ký ES256 tại server (JWKS) — token giả bị loại ngay, không hỏi Supabase,
// không đốt hạn mức của ai; tài khoản bị khoá → 403 ở MỌI API (không chỉ admin)
{
  const { generateKeyPairSync, sign } = await import('node:crypto')
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const KID = 'kid-test-1'
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'ES256', use: 'sig' }
  process.env.VITE_SUPABASE_URL = 'http://sb4.test'
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc'
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const es256 = (claims: Record<string, unknown>, kid = KID, key = privateKey) => {
    const head = b64({ alg: 'ES256', kid, typ: 'JWT' })
    const body = b64({ iss: 'http://sb4.test/auth/v1', aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, ...claims })
    const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
    return `${head}.${body}.${sig}`
  }
  const banned = new Set(['ban-1'])
  let banDown = false
  let userCalls = 0
  let jwksCalls = 0
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: string | URL) => {
    const url = String(input)
    if (url.endsWith('/auth/v1/.well-known/jwks.json')) {
      jwksCalls++
      return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 })
    }
    if (url.includes('/auth/v1/admin/users/')) {
      if (banDown) return new Response('{}', { status: 500 })
      const id = decodeURIComponent(url.split('/').pop()!)
      return new Response(JSON.stringify({ id, banned_until: banned.has(id) ? '2999-01-01T00:00:00Z' : null }), { status: 200 })
    }
    if (url.includes('/auth/v1/user')) {
      userCalls++
      return new Response('{}', { status: 401 })
    }
    return new Response('{}', { status: 404 })
  }) as typeof fetch
  const { checkToken, guard: g, _resetJwks, _resetBanCache } = await import('../server/guard.ts')
  _resetJwks()
  _resetBanCache()
  const reqWith = (auth: string, ip: string) => ({ headers: { authorization: auth }, socket: { remoteAddress: ip } }) as unknown as IncomingMessage
  const good = await checkToken(reqWith(`Bearer ${es256({ sub: 'u-good' })}`, '198.51.100.160'))
  check('token ES256 hợp lệ → nhận ra người dùng, không hỏi /auth/v1/user', good.userId === 'u-good' && userCalls === 0)
  const { privateKey: evil } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const forged = await checkToken(reqWith(`Bearer ${es256({ sub: 'u-good' }, KID, evil)}`, '198.51.100.161'))
  check('token ký bằng khoá khác (giả) → khách, không hỏi Supabase', forged.userId === null && !forged.busy && userCalls === 0)
  const expired = await checkToken(reqWith(`Bearer ${es256({ sub: 'u-x', exp: Math.floor(Date.now() / 1000) - 10 })}`, '198.51.100.162'))
  check('token hết hạn → khách', expired.userId === null && !expired.busy)
  const realNow = Date.now
  const exp = Math.floor(realNow() / 1000) + 60
  const shortAuth = es256({ sub: 'u-short', exp })
  const short = () => reqWith(`Bearer ${shortAuth}`, '198.51.100.162')
  check('token còn hạn được chấp nhận và đưa vào cache', (await checkToken(short())).userId === 'u-short')
  try {
    Date.now = () => exp * 1000
    check('token đã cache bị chặn ngay lúc hết hạn', (await checkToken(short())).userId === null)
  } finally {
    Date.now = realNow
  }
  const wrongIss = await checkToken(reqWith(`Bearer ${es256({ sub: 'u-x', iss: 'http://khac/auth/v1' })}`, '198.51.100.162'))
  check('token của project khác (sai issuer) → khách', wrongIss.userId === null)
  // 1000 token giả mang sub nạn nhân, cùng IP với nạn nhân → nạn nhân vẫn vào được, Supabase không bị hỏi lần nào
  for (let i = 0; i < 1000; i++) await checkToken(reqWith(`Bearer ${es256({ sub: 'u-victim', n: i }, KID, evil)}`, '198.51.100.163'))
  const victim = await checkToken(reqWith(`Bearer ${es256({ sub: 'u-victim' })}`, '198.51.100.163'))
  check(`1000 token giả mang sub nạn nhân cùng IP → nạn nhân vẫn vào (hỏi Supabase ${userCalls} lần)`, victim.userId === 'u-victim' && !victim.busy && userCalls === 0)
  check(`kid lạ không ép tải JWKS liên tục (tải ${jwksCalls} lần)`, jwksCalls <= 2)
  // tài khoản bị khoá
  const m = mock({ ...host, authorization: `Bearer ${es256({ sub: 'ban-1' })}` }, '198.51.100.164')
  const passed = await g(m.req, m.res, 'llm')
  check('tài khoản bị khoá gọi /api/llm → 403', !passed && m.out.status === 403)
  const bc = await checkToken(reqWith(`Bearer ${es256({ sub: 'ban-1', n: 2 })}`, '198.51.100.164'))
  check('tài khoản bị khoá: checkToken trả banned, không có userId', bc.userId === null && bc.banned === true)
  banDown = true
  const m2 = mock({ ...host, authorization: `Bearer ${es256({ sub: 'u-new' })}` }, '198.51.100.165')
  const p2 = await g(m2.req, m2.res, 'upload')
  check('không hỏi được trạng thái khoá → 503 (fail-closed, không coi là chưa khoá)', !p2 && m2.out.status === 503)
  banDown = false
  globalThis.fetch = realFetch
}

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
if (fail) process.exit(1)
