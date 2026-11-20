/** Test API admin (server/admin.ts) với Supabase giả: không token / user thường / moderator gọi action admin phải bị chặn,
 * admin làm được, không tự khoá mình, xoá tài khoản phải gõ đúng email, thao tác ghi nhật ký. */
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
process.env.NODE_ENV ??= 'development' // giả lập `vite` dev: isLocal chỉ miễn trừ loopback khi NODE_ENV=development

process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const ADMIN = '11111111-1111-4111-8111-111111111111'
const MOD = '22222222-2222-4222-8222-222222222222'
const USER = '33333333-3333-4333-8333-333333333333'
const TOKENS: Record<string, string> = { tAdmin: ADMIN, tMod: MOD, tUser: USER }
const ADMIN2 = '66666666-6666-4666-8666-666666666666'
const ROLES: Record<string, string> = { [ADMIN]: 'admin', [MOD]: 'moderator', [ADMIN2]: 'admin' }
let adminBanned = false
let noCreditRow = false
let presenceUnavailable = false
const calls: string[] = []
const LISTED = '44444444-4444-4444-8444-444444444444'
const PRIVATE = '55555555-5555-4555-8555-555555555555'
const REMOVED = '77777777-7777-4777-8777-777777777777'
const OWN = '88888888-8888-4888-8888-888888888888'
const LOOKUP_UNAVAILABLE = '99999999-9999-4999-8999-999999999999'
// status / owner_id cho các ca kiểm duyệt (Strix lần 5): đề admin đã gỡ, đề của chính moderator
const EXAMS: Array<{ id: string; listed: boolean; status: string; owner_id: string }> = [
  { id: LISTED, listed: true, status: 'published', owner_id: USER },
  { id: PRIVATE, listed: false, status: 'published', owner_id: USER },
  { id: REMOVED, listed: true, status: 'removed', owner_id: USER },
  { id: OWN, listed: true, status: 'published', owner_id: MOD },
]
let strikeReply: unknown = []
const bodies: string[] = []

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const method = init.method ?? 'GET'
  calls.push(`${method} ${url.replace('http://sb', '')}`)
  bodies.push(String(init.body ?? ''))
  const ok = (body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status: 200, headers })
  if (url.endsWith('/auth/v1/user')) {
    const tok = String((init.headers as Record<string, string>).Authorization ?? '').replace('Bearer ', '').replace(/^h\.(.*)\.s$/, '$1')
    return TOKENS[tok] ? ok({ id: TOKENS[tok] }) : new Response('{}', { status: 401 })
  }
  if (url.includes('/rest/v1/user_roles')) {
    const id = /user_id=eq\.([0-9a-f-]+)/.exec(url)?.[1] ?? ''
    return ok(ROLES[id] ? [{ role: ROLES[id] }] : [])
  }
  if (url.includes('/auth/v1/admin/users?')) {
    const filter = new URL(url).searchParams.get('filter')
    const user = { id: USER, email: 'u@x.vn', created_at: '2026-11-01T00:00:00Z', user_metadata: { display_name: 'Cô Lan', avatar_url: 'https://x/a.jpg' } }
    const users = filter ? [user] : [user, ...[ADMIN2, MOD, ADMIN].map((id) => ({ id, created_at: user.created_at }))]
    return ok({ users }, { 'x-total-count': String(users.length) })
  }
  if (url.includes('/rpc/admin_user_stats')) return ok([{ user_id: USER, docs: 3, decks: 1, tokens: 500, role: null }])
  if (url.includes('/rest/v1/presence?')) {
    if (presenceUnavailable) return new Response('{}', { status: 503 })
    const params = new URL(url).searchParams
    const ids = params.get('user_id')?.match(/^in\.\((.*)\)$/)?.[1]?.split(',')
    const since = Date.parse(params.get('last_seen')?.match(/^gte\.(.*)$/)?.[1] ?? '')
    const now = Date.now()
    const rows = [
      { user_id: ADMIN, lastSeen: now - 10_000 },
      { user_id: USER, lastSeen: now - 180_000 },
      { user_id: ADMIN2, lastSeen: now - 60_000 },
    ]
    return ok(rows.filter((r) => ids?.includes(r.user_id) && r.lastSeen >= since).map(({ user_id }) => ({ user_id })))
  }
  if (url.endsWith(`/auth/v1/admin/users/${USER}`) && method === 'GET') return ok({ id: USER, email: 'u@x.vn', created_at: '', user_metadata: { full_name: 'Cô Lan' } })
  if (url.endsWith(`/auth/v1/admin/users/${LOOKUP_UNAVAILABLE}`) && method === 'GET') return new Response('{}', { status: 503 })
  if (url.includes(`/auth/v1/admin/users/${ADMIN}`) && method === 'GET') return ok({ id: ADMIN, banned_until: adminBanned ? '2999-01-01T00:00:00Z' : null })
  if (url.includes('/auth/v1/admin/users/')) return ok({})
  if (url.includes('/rest/v1/user_documents')) return ok([])
  if (url.includes('/rest/v1/ai_credits') && method === 'GET') return ok(noCreditRow ? [] : [{ balance: 500 }])
  if (url.includes('/rpc/claim_ai_welcome')) return (calls.push('claim_ai_welcome'), ok(120000))
  if (url.includes('/rpc/grant_ai_credits')) return ok(1500)
  if (url.includes('/rpc/record_security_strike')) return strikeReply === 'error' ? new Response('{}', { status: 500 }) : ok(strikeReply)
  if (url.includes('/rest/v1/admin_audit')) return new Response(null, { status: 201 })
  if (url.includes('/rest/v1/ai_provider_settings')) return method === 'GET' ? ok([]) : new Response(null, { status: 201 })
  if (url.includes('/rest/v1/app_settings') && method === 'GET') return ok([{ key: 'maintenance', value: { on: true, message: 'x' } }])
  if (url.includes('/rest/v1/app_settings')) return new Response(null, { status: 201 })
  if (url.includes('/rest/v1/ai_calls?')) {
    const q = new URL(url).searchParams
    const now = Date.now()
    const rows = [
      { id: 7, user_id: USER, error: 'model: empty content', hoursAgo: 1, ok: false },
      { id: 6, user_id: USER, error: 'model: luồng trả lời bị ngắt giữa chừng', hoursAgo: 2, ok: false },
      { id: 5, user_id: LOOKUP_UNAVAILABLE, error: 'model: empty content', hoursAgo: 3, ok: false },
      { id: 4, user_id: null, error: 'model: empty content', hoursAgo: 4, ok: false },
      { id: 3, user_id: USER, error: 'model: empty content', hoursAgo: 5, ok: false },
      { id: 2, user_id: USER, error: 'model: empty content', hoursAgo: 6, ok: true },
      { id: 1, user_id: USER, error: 'model: empty content', hoursAgo: 25, ok: false },
    ].map((r) => ({ ...r, model: 'm', provider: 'opencode', ms: 1200, created_at: new Date(now - r.hoursAgo * 3600_000).toISOString() }))
    const ids = q.get('user_id')?.match(/^in\.\((.*)\)$/)?.[1]?.split(',')
    const since = q.get('created_at')?.match(/^gte\.(.*)$/)?.[1]
    return ok(rows.filter((r) =>
      (q.get('ok') !== 'eq.false' || !r.ok) &&
      (!q.get('or') || /empty content|ngắt giữa chừng/.test(r.error)) &&
      (!since || r.created_at >= since) &&
      (!ids || (r.user_id && ids.includes(r.user_id))) &&
      (!q.get('user_id')?.startsWith('eq.') || r.user_id === q.get('user_id')!.slice(3)),
    ).slice(0, Number(q.get('limit') ?? rows.length)))
  }
  if (url.includes('/rpc/admin_ai_stats')) return ok([{ day: '2026-11-10', model: 'm', provider: 'opencode', calls: 3, errors: 1, tokens: 900, cost: null, avg_ms: 1200 }])
  if (url.includes('/rest/v1/community_exams')) {
    // một đề cộng đồng (listed) và một đề link riêng; lọc theo id / listed như PostgREST
    const q = new URL(url).searchParams
    const rows = EXAMS.filter(
      (e) =>
        (!q.get('id') || q.get('id') === `eq.${e.id}`) &&
        (!q.get('listed') || q.get('listed') === `eq.${e.listed}`) &&
        (!q.get('status') || q.get('status') === `eq.${e.status}`),
    )
    return ok(rows.map((e) => ({ ...e, title: e.id === LISTED ? 'Đề cộng đồng' : 'Đề riêng' })))
  }
  if (url.includes('/rest/v1/reports')) {
    const q = new URL(url).searchParams
    const all = [{ id: 1, exam_id: LISTED, community_exams: { title: 'Đề cộng đồng', listed: true } }, { id: 2, exam_id: PRIVATE, community_exams: { title: 'Đề riêng', listed: false } }]
    const rows = all.filter((r) => (!q.get('id') || q.get('id') === `eq.${r.id}`) && (!q.get('community_exams.listed') || q.get('community_exams.listed') === `eq.${r.community_exams.listed}`))
    return ok(rows)
  }
  return ok([])
}) as typeof fetch

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')

async function hit(body: unknown, token?: string): Promise<{ status: number; data: Record<string, unknown> }> {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage
  Object.assign(req, { method: 'POST', headers: { host: 'x', ...(token ? { authorization: `Bearer h.${token}.s` } : {}) }, socket: { remoteAddress: '127.0.0.1' } })
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

const onlineList = await hit({ action: 'users.list' }, 'tAdmin')
const onlineUsers = onlineList.data.users as Array<{ id: string; online: boolean }> | undefined
check('users.list gắn online trong 2 phút và giữ thứ tự trong từng nhóm', onlineList.status === 200 &&
  onlineUsers?.map((row) => row.id).join(',') === [ADMIN2, ADMIN, USER, MOD].join(',') &&
  onlineUsers.every((row, i) => row.online === (i < 2)))

presenceUnavailable = true
const offlineList = await hit({ action: 'users.list' }, 'tAdmin')
presenceUnavailable = false
const offlineUsers = offlineList.data.users as typeof onlineUsers
check('users.list giữ danh sách và thứ tự cũ khi presence lỗi', offlineList.status === 200 &&
  offlineUsers?.map((row) => row.id).join(',') === [USER, ADMIN2, MOD, ADMIN].join(',') &&
  offlineUsers.every((row) => row.online === false))

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
check('cộng điểm cho người đã có số dư → không tặng quà thêm', !calls.includes('claim_ai_welcome'))
noCreditRow = true
const g2 = await hit({ action: 'credits.grant', userId: USER, tokens: 1000 }, 'tAdmin')
check('cộng điểm cho người chưa có số dư → tặng quà chào mừng trước rồi mới cộng', g2.status === 200 && calls.includes('claim_ai_welcome'))
noCreditRow = false


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
const aiErrors = { action: 'ai.errors', limit: 4 }
check('không token xem ai.errors → 401', (await hit(aiErrors)).status === 401)
check('user thường xem ai.errors → 403', (await hit(aiErrors, 'tUser')).status === 403)
check('moderator xem ai.errors → 403', (await hit(aiErrors, 'tMod')).status === 403)
const aiErrorsFrom = calls.length
const aiErrorsResult = await hit(aiErrors, 'tAdmin')
const errorRows = aiErrorsResult.data.items as Array<{ id: number; userName: string; userEmail: string; emptyDay: number }> | undefined
check('admin xem ai.errors → 200, trả ngưỡng miễn điểm và giữ thứ tự', aiErrorsResult.status === 200 &&
  aiErrorsResult.data.freeEmpty === 3 && errorRows?.map((r) => r.id).join(',') === '7,6,5,4')
check('ai.errors trả tên, email và đếm đúng lượt lỗi rỗng trong 24 giờ ngoài cả trang hiện tại', errorRows?.[0]?.userName === 'Cô Lan' &&
  errorRows[0].userEmail === 'u@x.vn' && errorRows[0].emptyDay === 3 && errorRows[1]?.emptyDay === 3)
check('ai.errors vẫn trả lượt rỗng khi tra tài khoản lỗi, lượt khách đếm 0', errorRows?.[2]?.userName === '' &&
  errorRows[2].userEmail === '' && errorRows[2].emptyDay === 1 && errorRows[3]?.emptyDay === 0)
const aiErrorCalls = calls.slice(aiErrorsFrom)
check('ai.errors tra mỗi tài khoản một lần và đếm theo cả nhóm', aiErrorCalls.filter((c) => c === `GET /auth/v1/admin/users/${USER}`).length === 1 &&
  aiErrorCalls.filter((c) => c.startsWith('GET /rest/v1/ai_calls?user_id=in.')).length === 1 &&
  aiErrorCalls.some((c) => c.includes(`user_id=in.(${USER},${LOOKUP_UNAVAILABLE})`)))
{
  const qg = (await hit({ action: 'quota.get', userId: USER }, 'tAdmin')).data as { emptyDay?: number; freeEmpty?: number }
  check('quota.get trả số lượt hỏng (rỗng + luồng đứt) 24 giờ và ngưỡng miễn', qg.emptyDay === 3 && qg.freeEmpty === 3, qg)
}
check('moderator chạy health → 403', (await hit({ action: 'health' }, 'tMod')).status === 403)
check('moderator xem health.targets → 403', (await hit({ action: 'health.targets' }, 'tMod')).status === 403)
{
  const save = async (o: object, tok = 'tAdmin') => hit({ action: 'ai.saveProvider', provider: 'deepseek', ...o }, tok)
  const SECRET_KEY = 'sk-rat-bi-mat-123456'
  check('moderator lưu provider → 403', (await save({ model: 'x' }, 'tMod')).status === 403)
  check('lưu provider lạ → 400', (await save({ provider: 'khong-co', model: 'x' })).status === 400)
  process.env.DEEPSEEK_API_KEY = 'k-env-12345678'
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
  const r = await save({ model: 'deepseek-moi', endpoint: 'https://8.8.8.8/v1', apiKey: SECRET_KEY })
  const sent = bodies.slice(from).join(' ')
  check('lưu provider → 200, có model và key đã mã hoá', r.status === 200 && sent.includes('"model":"deepseek-moi"') && sent.includes('"api_key_enc":"v1:'))
  check('API key không lọt ra DB hay nhật ký dạng rõ', !sent.includes(SECRET_KEY))
  check('kết quả chỉ trả key đã che', !JSON.stringify(r.data ?? r).includes(SECRET_KEY))
  const { encryptKey, decryptKey, rowToOverride, resetAiOverrides } = await import('../server/aiSettings.ts')
  const { assertSafeEndpoint } = await import('../server/llmProxy.ts')
  for (const u of ['https://[::ffff:127.0.0.1]/v1', 'https://[::ffff:a9fe:a9fe]/v1', 'https://[::ffff:10.0.0.1]/v1', 'https://[64:ff9b::7f00:1]/v1', 'https://[2002:7f00:1::]/v1', 'https://192.0.0.1/v1', 'https://[fe80::1]/v1', 'https://[ff02::1]/v1']) {
    check('chặn địa chỉ nội bộ ' + u, await assertSafeEndpoint(u).then(() => false, () => true))
  }
  check('địa chỉ công khai vẫn qua', await assertSafeEndpoint('https://8.8.8.8/v1').then(() => true, () => false))
  const gone = rowToOverride({ provider: 'deepseek', model: 'm', base_url: 'https://may-la.test/v1', api_key_enc: encryptKey('abc') })
  check('tên miền bị gỡ khỏi danh sách thì bỏ endpoint và key', gone.baseUrl === undefined && gone.apiKey === undefined && gone.model === 'm')
  const okRow = rowToOverride({ provider: 'deepseek', model: null, base_url: 'https://8.8.8.8/v1', api_key_enc: encryptKey('abc') })
  check('tên miền trong danh sách thì dùng', okRow.baseUrl === 'https://8.8.8.8/v1' && okRow.apiKey === 'abc')
  check('mã hoá rồi giải mã đúng', decryptKey(encryptKey('abc')) === 'abc')
  const bad = rowToOverride({ provider: 'deepseek', model: null, base_url: 'https://evil.test/v1', api_key_enc: 'v1:AAAA:BBBB:CCCC' })
  check('key hỏng thì bỏ luôn endpoint riêng', bad.apiKey === undefined && bad.baseUrl === undefined)
  check('về mặc định → 200', (await hit({ action: 'ai.resetProvider', provider: 'deepseek' }, 'tAdmin')).status === 200)
  check('moderator về mặc định → 403', (await hit({ action: 'ai.resetProvider', provider: 'deepseek' }, 'tMod')).status === 403)
  resetAiOverrides()
  delete process.env.DEEPSEEK_API_KEY
  delete process.env.AI_SETTINGS_SECRET
  delete process.env.AI_ENDPOINT_ALLOWED_HOSTS
}
check('kiểm tra riêng dịch vụ lạ → 400', (await hit({ action: 'health', target: 'khong-co' }, 'tAdmin')).status === 400)

// chặn bảo trì ở server (ops.ts)
const { maintenanceBlock, _resetOpsCache } = await import('../server/ops.ts')
const blockFor = async (token?: string) => {
  _resetOpsCache()
  const req = { headers: token ? { authorization: `Bearer h.${token}.s` } : {} } as unknown as IncomingMessage
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

// hạn mức AI: khách không có hạn mức (llmProxy chặn khách từ trước), biên nhận hoàn điểm chỉ cho người đăng nhập
const { readQuota, issueReceipt } = await import('../server/aiQuota.ts')
check('khách: không có hạn mức', (await readQuota(null, '9.9.9.9')) === null)
check('khách: không cấp biên nhận hoàn điểm', issueReceipt(null, '9.9.9.9', 1000) === undefined)

const { r2DocKeyFromUrl } = await import('../server/r2.ts')
const H = 'a'.repeat(40)
check('xoá tệp: không nhận ảnh trong đề', r2DocKeyFromUrl(`/api/files/img/${H}.png`) === null)
check('xoá tệp: nhận tài liệu', r2DocKeyFromUrl(`/api/files/doc/${H}.pdf`) === `doc/${H}.pdf`)

// Strix lần 3 mục 4: moderator chỉ đụng được đề đã đăng cộng đồng — mọi action, kể cả list/setStatus/báo cáo
{
  const ml = await hit({ action: 'content.exams.list' }, 'tMod')
  const ids = ((ml.data.exams as Array<{ id: string }>) ?? []).map((e) => e.id)
  check('moderator list đề → chỉ đề cộng đồng (0 đề riêng)', ml.status === 200 && ids.includes(LISTED) && !ids.includes(PRIVATE))
  check('moderator xem đề riêng → 404', (await hit({ action: 'content.exams.get', examId: PRIVATE }, 'tMod')).status === 404)
  check('moderator gỡ đề riêng → 404', (await hit({ action: 'content.exams.setStatus', examId: PRIVATE, status: 'removed', reason: 'x' }, 'tMod')).status === 404)
  check('moderator gỡ đề cộng đồng → được', (await hit({ action: 'content.exams.setStatus', examId: LISTED, status: 'hidden' }, 'tMod')).status === 200)
  const mr = await hit({ action: 'content.reports.list' }, 'tMod')
  const rids = ((mr.data.reports as Array<{ examId: string }>) ?? []).map((r) => r.examId)
  check('moderator xem báo cáo → không có báo cáo của đề riêng', mr.status === 200 && rids.includes(LISTED) && !rids.includes(PRIVATE))
  check('moderator xử lý báo cáo của đề riêng → 404', (await hit({ action: 'content.reports.resolve', reportId: 2, status: 'dismissed' }, 'tMod')).status === 404)
  const al = await hit({ action: 'content.exams.list' }, 'tAdmin')
  const aids = ((al.data.exams as Array<{ id: string }>) ?? []).map((e) => e.id)
  check('admin vẫn thấy cả đề riêng', aids.includes(LISTED) && aids.includes(PRIVATE))
  check('admin gỡ đề riêng → được', (await hit({ action: 'content.exams.setStatus', examId: PRIVATE, status: 'hidden' }, 'tAdmin')).status === 200)
}

// Strix lần 5: moderator không khôi phục / sửa đề admin đã gỡ, không tự kiểm duyệt đề của mình; nhật ký giữ quyết định cũ
{
  check('moderator khôi phục đề đã gỡ → 403', (await hit({ action: 'content.exams.setStatus', examId: REMOVED, status: 'published' }, 'tMod')).status === 403)
  check('moderator đổi lý do gỡ → 403', (await hit({ action: 'content.exams.setStatus', examId: REMOVED, status: 'removed', reason: 'khác' }, 'tMod')).status === 403)
  check('moderator ẩn đề của chính mình → 403', (await hit({ action: 'content.exams.setStatus', examId: OWN, status: 'hidden' }, 'tMod')).status === 403)
  const before = bodies.length
  check('admin khôi phục đề đã gỡ → được', (await hit({ action: 'content.exams.setStatus', examId: REMOVED, status: 'published' }, 'tAdmin')).status === 200)
  const auditBody = bodies.slice(before).find((b) => b.includes('content.exams.setStatus')) ?? ''
  check('nhật ký ghi trạng thái cũ (from: removed)', auditBody.includes('"from":"removed"'))
  const patchUrl = calls.find((c) => c.startsWith('PATCH') && c.includes(REMOVED)) ?? ''
  check('lệnh ghi ghim trạng thái vừa đọc (status=eq.removed)', patchUrl.includes('status=eq.removed'))
}

// Strix lần 3 mục 5: không nhớ trạng thái khoá — admin vừa bị khoá mất quyền ngay request kế tiếp
{
  check('admin chưa bị khoá → dùng được', (await hit({ action: 'me' }, 'tAdmin')).status === 200)
  adminBanned = true
  check('admin vừa bị khoá → request ngay sau bị 403 (không chờ cache 60 s)', (await hit({ action: 'me' }, 'tAdmin')).status === 403)
  adminBanned = false
}

// Strix lần 3 mục 6: protectTarget ở cả quota/credits/storage; lượt bị từ chối có ghi nhật ký
for (const [action, extra] of [
  ['quota.set', { monthlyTokens: 1000 }],
  ['quota.clear', {}],
  ['credits.grant', { tokens: 500 }],
  ['storage.set', { maxBytes: 50 * 1024 * 1024 }],
] as const) {
  calls.length = 0
  bodies.length = 0
  const self = await hit({ action, userId: ADMIN, ...extra }, 'tAdmin')
  const other = await hit({ action, userId: ADMIN2, ...extra }, 'tAdmin')
  const denied = bodies.filter((b) => b.includes(`${action}.denied`)).length
  check(`${action}: tự nhắm mình và nhắm admin khác → 400, ghi ${action}.denied (${denied} dòng)`, self.status === 400 && other.status === 400 && denied === 2)
  check(`${action}: user thường vẫn làm được`, (await hit({ action, userId: USER, ...extra }, 'tAdmin')).status === 200)
}

if (fail) {
  console.error(`${fail} lỗi`)
  process.exit(1)
}
console.log('test-admin: OK')
