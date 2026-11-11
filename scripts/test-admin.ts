/** Test API admin (server/admin.ts) với Supabase giả: không token / user thường / moderator gọi action admin phải bị chặn,
 * admin làm được, không tự khoá mình, xoá tài khoản phải gõ đúng email, thao tác ghi nhật ký. */
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'

process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const ADMIN = '11111111-1111-4111-8111-111111111111'
const MOD = '22222222-2222-4222-8222-222222222222'
const USER = '33333333-3333-4333-8333-333333333333'
const TOKENS: Record<string, string> = { tAdmin: ADMIN, tMod: MOD, tUser: USER }
const ROLES: Record<string, string> = { [ADMIN]: 'admin', [MOD]: 'moderator' }
const calls: string[] = []
let strikeReply: unknown = []
const bodies: string[] = []

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const method = init.method ?? 'GET'
  calls.push(`${method} ${url.replace('http://sb', '')}`)
  bodies.push(String(init.body ?? ''))
  const ok = (body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status: 200, headers })
  if (url.endsWith('/auth/v1/user')) {
    const tok = String((init.headers as Record<string, string>).Authorization ?? '').replace('Bearer ', '')
    return TOKENS[tok] ? ok({ id: TOKENS[tok] }) : new Response('{}', { status: 401 })
  }
  if (url.includes('/rest/v1/user_roles')) {
    const id = /user_id=eq\.([0-9a-f-]+)/.exec(url)?.[1] ?? ''
    return ok(ROLES[id] ? [{ role: ROLES[id] }] : [])
  }
  if (url.includes('/auth/v1/admin/users?')) return ok({ users: [{ id: USER, email: 'u@x.vn', created_at: '2026-11-01T00:00:00Z', user_metadata: { display_name: 'Cô Lan', avatar_url: 'https://x/a.jpg' } }] }, { 'x-total-count': '1' })
  if (url.includes('/rpc/admin_user_stats')) return ok([{ user_id: USER, docs: 3, decks: 1, tokens: 500, role: null }])
  if (url.includes(`/auth/v1/admin/users/${USER}`) && method === 'GET') return ok({ id: USER, email: 'u@x.vn', created_at: '' })
  if (url.includes('/auth/v1/admin/users/')) return ok({})
  if (url.includes('/rest/v1/user_documents')) return ok([])
  if (url.includes('/rpc/grant_ai_credits')) return ok(1500)
  if (url.includes('/rpc/record_security_strike')) return strikeReply === 'error' ? new Response('{}', { status: 500 }) : ok(strikeReply)
  if (url.includes('/rest/v1/admin_audit')) return new Response(null, { status: 201 })
  if (url.includes('/rest/v1/ai_provider_settings')) return method === 'GET' ? ok([]) : new Response(null, { status: 201 })
  if (url.includes('/rest/v1/app_settings') && method === 'GET') return ok([{ key: 'maintenance', value: { on: true, message: 'x' } }])
  if (url.includes('/rest/v1/app_settings')) return new Response(null, { status: 201 })
  if (url.includes('/rpc/admin_ai_stats')) return ok([{ day: '2026-11-10', model: 'm', provider: 'opencode', calls: 3, errors: 1, tokens: 900, cost: null, avg_ms: 1200 }])
  return ok([])
}) as typeof fetch

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')

async function hit(body: unknown, token?: string): Promise<{ status: number; data: Record<string, unknown> }> {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage
  Object.assign(req, { method: 'POST', headers: { host: 'x', ...(token ? { authorization: `Bearer ${token}` } : {}) }, socket: { remoteAddress: '127.0.0.1' } })
  const out = { status: 0, body: '' }
  const res = {
    writeHead(c: number) {
      out.status = c
      return this
    },
    end(b?: string) {
      out.body = b ?? ''
    },
  } as unknown as ServerResponse
  _resetRoleCache()
  await handleAdminRequest(req, res)
  return { status: out.status, data: out.body ? JSON.parse(out.body) : {} }
}

let fail = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✅' : '❌'} ${name}`)
  if (!ok) fail++
}

check('không token → 401', (await hit({ action: 'users.list' })).status === 401)
check('token sai → 401', (await hit({ action: 'users.list' }, 'bad')).status === 401)
check('user thường → 403', (await hit({ action: 'users.list' }, 'tUser')).status === 403)
check('user thường hỏi me → 403', (await hit({ action: 'me' }, 'tUser')).status === 403)
check('moderator gọi users.list → 403', (await hit({ action: 'users.list' }, 'tMod')).status === 403)
check('moderator gọi users.ban → 403', (await hit({ action: 'users.ban', userId: USER }, 'tMod')).status === 403)
const me = await hit({ action: 'me' }, 'tMod')
check('moderator hỏi me → 200, role moderator', me.status === 200 && me.data.role === 'moderator')
check('action lạ → 400', (await hit({ action: 'drop.all' }, 'tAdmin')).status === 400)

const list = await hit({ action: 'users.list', q: 'u@', page: 1 }, 'tAdmin')
const u = (list.data.users as Array<Record<string, unknown>>)?.[0]
check('admin users.list → 200, ghép số đề/token', list.status === 200 && u?.docs === 3 && u?.tokensThisMonth === 500 && list.data.total === 1)
check('users.list lấy tên hiển thị + ảnh đại diện', u?.name === 'Cô Lan' && u?.avatar === 'https://x/a.jpg')
check('users.list gửi filter email', calls.some((c) => c.includes('/auth/v1/admin/users?') && c.includes('filter=u%40')))

check('admin tự khoá mình → 400', (await hit({ action: 'users.ban', userId: ADMIN }, 'tAdmin')).status === 400)
check('khoá admin khác → 400', (await hit({ action: 'users.ban', userId: ADMIN }, 'tAdmin')).status === 400)
check('userId sai định dạng → 400', (await hit({ action: 'users.ban', userId: 'x' }, 'tAdmin')).status === 400)
calls.length = 0
check('admin khoá user → 200', (await hit({ action: 'users.ban', userId: USER, reason: 'spam' }, 'tAdmin')).status === 200)
check('khoá ghi ban_duration và nhật ký', calls.some((c) => c.startsWith(`PUT /auth/v1/admin/users/${USER}`)) && calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))

calls.length = 0
check('xoá sai email → 400', (await hit({ action: 'users.delete', userId: USER, confirmEmail: 'khac@x.vn' }, 'tAdmin')).status === 400)
check('xoá sai email không gọi DELETE', !calls.some((c) => c.startsWith('DELETE /auth/v1/admin/users')))
check('xoá đúng email → 200', (await hit({ action: 'users.delete', userId: USER, confirmEmail: 'U@x.vn' }, 'tAdmin')).status === 200)
check('hạn mức âm → 400', (await hit({ action: 'quota.set', userId: USER, monthlyTokens: -5 }, 'tAdmin')).status === 400)
check('hạn mức null (không giới hạn) → 200', (await hit({ action: 'quota.set', userId: USER, monthlyTokens: null }, 'tAdmin')).status === 200)
check('moderator cộng điểm → 403', (await hit({ action: 'credits.grant', userId: USER, tokens: 1000 }, 'tMod')).status === 403)
check('cộng điểm 0 → 400', (await hit({ action: 'credits.grant', userId: USER, tokens: 0 }, 'tAdmin')).status === 400)
const g = await hit({ action: 'credits.grant', userId: USER, tokens: 1000 }, 'tAdmin')
check('cộng điểm → 200, trả số dư cộng dồn', g.status === 200 && g.data.balance === 1500)


// giai đoạn 2
const sg = await hit({ action: 'settings.get' }, 'tMod')
check('moderator đọc cài đặt → 200', sg.status === 200 && (sg.data.maintenance as { on: boolean }).on === true && (sg.data.announcements as { items: unknown[] }).items.length === 0)
check('moderator bật bảo trì → 403', (await hit({ action: 'settings.set', key: 'maintenance', value: { on: true } }, 'tMod')).status === 403)
check('cài đặt lạ → 400', (await hit({ action: 'settings.set', key: 'drop', value: {} }, 'tAdmin')).status === 400)
const setAnn = async (items: unknown[]) => (await hit({ action: 'settings.set', key: 'announcements', value: { items } }, 'tAdmin')).status
const ann = (o: object) => ({ id: 'a1', on: true, title: 'Mới', ...o })
check('thông báo hợp lệ → 200', (await setAnn([ann({ tryPath: '/soan-de', image: '/api/files/img/' + 'a'.repeat(40) + '.png' })])) === 200)
check('thông báo trống → 400', (await setAnn([{ id: 'a1', on: true, title: ' ' }])) === 400)
check('ảnh ngoài kho → 400', (await setAnn([ann({ image: 'https://evil.test/a.png' })])) === 400)
check('Dùng thử trỏ ra ngoài → 400', (await setAnn([ann({ tryPath: '//evil.test' })])) === 400)
check('Dùng thử javascript: → 400', (await setAnn([ann({ tryPath: 'javascript:alert(1)' })])) === 400)
check('bật 6 thông báo → 400', (await setAnn(Array.from({ length: 6 }, (_, i) => ann({ id: 'a' + i })))) === 400)
check('until sai → 400', (await hit({ action: 'settings.set', key: 'maintenance', value: { on: true, until: 'abc' } }, 'tAdmin')).status === 400)
calls.length = 0
const ms = await hit({ action: 'settings.set', key: 'maintenance', value: { on: true, message: 'Nâng cấp', extra: 1 } }, 'tAdmin')
check('admin bật bảo trì → 200, bỏ trường lạ', ms.status === 200 && JSON.stringify(ms.data.value) === JSON.stringify({ on: true, message: 'Nâng cấp', until: null }))
check('bật bảo trì ghi nhật ký', calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))
const st = await hit({ action: 'ai.stats', days: 500 }, 'tAdmin')
check('ai.stats kẹp days ≤ 90, đổi tên cột', st.status === 200 && st.data.days === 90 && (st.data.rows as Array<{ avgMs: number }>)[0].avgMs === 1200)
check('moderator xem ai.stats → 403', (await hit({ action: 'ai.stats' }, 'tMod')).status === 403)
check('moderator chạy health → 403', (await hit({ action: 'health' }, 'tMod')).status === 403)
check('moderator xem health.targets → 403', (await hit({ action: 'health.targets' }, 'tMod')).status === 403)
{
  const save = async (o: object, tok = 'tAdmin') => hit({ action: 'ai.saveProvider', provider: 'mercury', ...o }, tok)
  const SECRET_KEY = 'sk-rat-bi-mat-123456'
  check('moderator lưu provider → 403', (await save({ model: 'x' }, 'tMod')).status === 403)
  check('lưu provider lạ → 400', (await save({ provider: 'khong-co', model: 'x' })).status === 400)
  process.env.MERCURY_API_KEY = 'k-env-12345678'
  const END = 'https://api.inceptionlabs.ai/v1'
  check('lưu tên model lạ → 400', (await save({ model: 'a b', endpoint: END })).status === 400)
  check('đổi endpoint không nhập key → 400', (await save({ model: 'm', endpoint: 'https://8.8.8.8/v1' })).status === 400)
  delete process.env.AI_SETTINGS_SECRET
  check('lưu key khi chưa có secret → 400', (await save({ model: 'm', endpoint: END, apiKey: SECRET_KEY })).status === 400)
  process.env.AI_SETTINGS_SECRET = 'x'.repeat(32)
  delete process.env.AI_ENDPOINT_ALLOWED_HOSTS
  check('tên miền chưa cho phép → 400', (await save({ model: 'm', endpoint: 'https://8.8.8.8/v1', apiKey: SECRET_KEY })).status === 400)
  process.env.AI_ENDPOINT_ALLOWED_HOSTS = '8.8.8.8, 127.0.0.1,169.254.169.254'
  check('endpoint http → 400', (await save({ model: 'm', endpoint: 'http://8.8.8.8/v1', apiKey: SECRET_KEY })).status === 400)
  check('endpoint nội bộ → 400', (await save({ model: 'm', endpoint: 'https://127.0.0.1/v1', apiKey: SECRET_KEY })).status === 400)
  check('endpoint metadata → 400', (await save({ model: 'm', endpoint: 'https://169.254.169.254/v1', apiKey: SECRET_KEY })).status === 400)
  const from = bodies.length
  const r = await save({ model: 'mercury-moi', endpoint: 'https://8.8.8.8/v1', apiKey: SECRET_KEY })
  const sent = bodies.slice(from).join(' ')
  check('lưu provider → 200, có model và key đã mã hoá', r.status === 200 && sent.includes('"model":"mercury-moi"') && sent.includes('"api_key_enc":"v1:'))
  check('API key không lọt ra DB hay nhật ký dạng rõ', !sent.includes(SECRET_KEY))
  check('kết quả chỉ trả key đã che', !JSON.stringify(r.data ?? r).includes(SECRET_KEY))
  const { encryptKey, decryptKey, rowToOverride, resetAiOverrides } = await import('../server/aiSettings.ts')
  const { assertSafeEndpoint } = await import('../server/llmProxy.ts')
  for (const u of ['https://[::ffff:127.0.0.1]/v1', 'https://[::ffff:a9fe:a9fe]/v1', 'https://[::ffff:10.0.0.1]/v1', 'https://[64:ff9b::7f00:1]/v1', 'https://[2002:7f00:1::]/v1', 'https://192.0.0.1/v1', 'https://[fe80::1]/v1', 'https://[ff02::1]/v1']) {
    check('chặn địa chỉ nội bộ ' + u, await assertSafeEndpoint(u).then(() => false, () => true))
  }
  check('địa chỉ công khai vẫn qua', await assertSafeEndpoint('https://8.8.8.8/v1').then(() => true, () => false))
  const gone = rowToOverride({ provider: 'mercury', model: 'm', base_url: 'https://may-la.test/v1', api_key_enc: encryptKey('abc') })
  check('tên miền bị gỡ khỏi danh sách thì bỏ endpoint và key', gone.baseUrl === undefined && gone.apiKey === undefined && gone.model === 'm')
  const okRow = rowToOverride({ provider: 'mercury', model: null, base_url: 'https://8.8.8.8/v1', api_key_enc: encryptKey('abc') })
  check('tên miền trong danh sách thì dùng', okRow.baseUrl === 'https://8.8.8.8/v1' && okRow.apiKey === 'abc')
  check('mã hoá rồi giải mã đúng', decryptKey(encryptKey('abc')) === 'abc')
  const bad = rowToOverride({ provider: 'mercury', model: null, base_url: 'https://evil.test/v1', api_key_enc: 'v1:AAAA:BBBB:CCCC' })
  check('key hỏng thì bỏ luôn endpoint riêng', bad.apiKey === undefined && bad.baseUrl === undefined)
  check('về mặc định → 200', (await hit({ action: 'ai.resetProvider', provider: 'mercury' }, 'tAdmin')).status === 200)
  check('moderator về mặc định → 403', (await hit({ action: 'ai.resetProvider', provider: 'mercury' }, 'tMod')).status === 403)
  resetAiOverrides()
  delete process.env.MERCURY_API_KEY
  delete process.env.AI_SETTINGS_SECRET
  delete process.env.AI_ENDPOINT_ALLOWED_HOSTS
}
check('kiểm tra riêng dịch vụ lạ → 400', (await hit({ action: 'health', target: 'khong-co' }, 'tAdmin')).status === 400)

// chặn bảo trì ở server (ops.ts)
const { maintenanceBlock, _resetOpsCache } = await import('../server/ops.ts')
const blockFor = async (token?: string) => {
  _resetOpsCache()
  const req = { headers: token ? { authorization: `Bearer ${token}` } : {} } as unknown as IncomingMessage
  let code = 0
  const res = { writeHead: (c: number) => ((code = c), res), end: () => {} } as unknown as ServerResponse
  const blocked = await maintenanceBlock(req, res)
  return { blocked, code }
}
const g1 = await blockFor()
check('bảo trì: khách bị chặn 503', g1.blocked && g1.code === 503)
check('bảo trì: user thường bị chặn', (await blockFor('tUser')).blocked)
check('bảo trì: admin vẫn dùng được', !(await blockFor('tAdmin')).blocked)

// đọc ảnh đề: chỉ admin, đầu vào chặt
{
  const vision = await import('../server/bankVision.ts')
  const bad = async (v: unknown) => vision.readExamPages(v, 'u').then(() => false, (e) => e instanceof vision.VisionInputError)
  check('vision: thiếu ảnh → từ chối', await bad([]))
  check('vision: quá 4 ảnh → từ chối', await bad(Array(5).fill('data:image/png;base64,AA==')))
  check('vision: không phải ảnh → từ chối', await bad(['data:text/html;base64,AA==']))
  check('vision: URL ngoài → từ chối', await bad(['http://169.254.169.254/x.png']))
}

// số đo Postgres (dbMetrics.ts)
const { parseProm, computeMetrics } = await import('../server/dbMetrics.ts')
const prom = (load: number) => `# HELP x
node_load1{service_type="db"} ${load}
node_cpu_seconds_total{cpu="0",mode="idle"} 100
node_cpu_seconds_total{cpu="0",mode="user"} 10
node_cpu_seconds_total{cpu="1",mode="idle"} 100
node_cpu_seconds_total{cpu="1",mode="system"} 10
node_memory_MemTotal_bytes 1000
node_memory_MemAvailable_bytes 390
node_filesystem_size_bytes{device="/dev/x",mountpoint="/"} 50
node_filesystem_avail_bytes{device="/dev/x",mountpoint="/"} 0
node_filesystem_size_bytes{device="/dev/y",mountpoint="/data"} 200
node_filesystem_avail_bytes{device="/dev/y",mountpoint="/data"} 172
pg_stat_database_num_backends{datname="postgres"} 9
pg_stat_database_num_backends{datname="template1"} 2
max_connections_connection_count{server="x"} 60
`
const mt = computeMetrics(parseProm(prom(0.06)))
check('metrics: CPU 3%', mt.cpu === 3)
check('metrics: CPU tối đa 100%', computeMetrics(parseProm(prom(5))).cpu === 100)
check('metrics: RAM 61%', mt.ram === 61)
check('metrics: Disk lấy ổ /data 14%', mt.disk === 14)
check('metrics: 11/60 kết nối', mt.connections === 11 && mt.maxConnections === 60)
const empty = computeMetrics(parseProm('garbage line'))
check('metrics: thiếu số đo → null, không lỗi', empty.cpu === null && empty.ram === null && empty.disk === null && empty.connections === null)
check('moderator xem db.metrics → 403', (await hit({ action: 'db.metrics' }, 'tMod')).status === 403)

// tự động khoá khi cố gọi API admin
const banBody = () => bodies[calls.findIndex((c) => c.startsWith(`PUT /auth/v1/admin/users/${USER}`))] ?? ''
const banned = () => calls.some((c) => c.startsWith(`PUT /auth/v1/admin/users/${USER}`))
const strikeCalled = () => calls.some((c) => c.includes('record_security_strike'))
const reset = (r: unknown) => { calls.length = 0; bodies.length = 0; strikeReply = r }

reset([{ strikes: 1, is_new: true }])
check('user thường hỏi me → không phạt', (await hit({ action: 'me' }, 'tUser')).status === 403 && !strikeCalled() && !banned())
reset([{ strikes: 1, is_new: true }])
check('moderator gọi action admin → không phạt', (await hit({ action: 'users.list' }, 'tMod')).status === 403 && !strikeCalled() && !banned())
reset([{ strikes: 1, is_new: true }])
check('không token → không phạt', (await hit({ action: 'users.list' })).status === 401 && !strikeCalled())
reset([{ strikes: 1, is_new: true }])
const s1 = await hit({ action: 'users.list' }, 'tUser')
check('lần 1 → 403, báo khoá 3 ngày', s1.status === 403 && String(s1.data.error).includes('3 ngày'))
check('lần 1 → ban 72h, ghi nhật ký', banBody().includes('"72h"') && calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))
reset([{ strikes: 2, is_new: true }])
const s2 = await hit({ action: 'quota.set', userId: USER }, 'tUser')
check('lần 2 → khoá vĩnh viễn', s2.status === 403 && String(s2.data.error).includes('vĩnh viễn') && banBody().includes('876000h'))
reset([{ strikes: 1, is_new: false }])
check('đang bị khoá → không ban lại', (await hit({ action: 'users.list' }, 'tUser')).status === 403 && !banned())
reset([{ strikes: 1, is_new: true }])
await hit({ action: 'drop.all' }, 'tUser')
check('dò action lạ → cũng bị phạt', strikeCalled() && banned())
reset([{ strikes: 1, is_new: true }])
await hit({ action: 'constructor' }, 'tAdmin')
check('admin gọi action lạ → không phạt', !strikeCalled())
check('action trùng thuộc tính Object → 400', (await hit({ action: 'constructor' }, 'tAdmin')).status === 400)
reset('error')
check('lỗi ghi vi phạm → 403 thường, không khoá', (await hit({ action: 'users.list' }, 'tUser')).status === 403 && !banned())
reset([])
check('moderator gỡ cờ → 403', (await hit({ action: 'security.clear', userId: USER }, 'tMod')).status === 403)
check('admin gỡ cờ → 200', (await hit({ action: 'security.clear', userId: USER }, 'tAdmin')).status === 200)

// giữ chỗ hạn mức AI: request song song không cùng lọt
const { reserveQuota } = await import('../server/aiQuota.ts')
const guestQ = { used: 0, limit: 30_000, scope: 'day' as const }
const r1 = await reserveQuota(null, '9.9.9.9', guestQ)
const r2 = await reserveQuota(null, '9.9.9.9', guestQ)
const r3 = await reserveQuota(null, '9.9.9.9', guestQ)
check('khách: 2 request song song được, cái thứ 3 bị chặn', !!r1 && !!r2 && r3 === null)
await r1!()
await r1!()
const r4 = await reserveQuota(null, '9.9.9.9', guestQ)
check('trả chỗ một lần dù gọi 2 lần', !!r4 && (await reserveQuota(null, '9.9.9.9', guestQ)) === null)

const { r2DocKeyFromUrl } = await import('../server/r2.ts')
const H = 'a'.repeat(40)
check('xoá tệp: không nhận ảnh trong đề', r2DocKeyFromUrl(`/api/files/img/${H}.png`) === null)
check('xoá tệp: nhận tài liệu', r2DocKeyFromUrl(`/api/files/doc/${H}.pdf`) === `doc/${H}.pdf`)

if (fail) {
  console.error(`${fail} lỗi`)
  process.exit(1)
}
console.log('test-admin: OK')
