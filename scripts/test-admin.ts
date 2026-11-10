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

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const method = init.method ?? 'GET'
  calls.push(`${method} ${url.replace('http://sb', '')}`)
  const ok = (body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status: 200, headers })
  if (url.endsWith('/auth/v1/user')) {
    const tok = String((init.headers as Record<string, string>).Authorization ?? '').replace('Bearer ', '')
    return TOKENS[tok] ? ok({ id: TOKENS[tok] }) : new Response('{}', { status: 401 })
  }
  if (url.includes('/rest/v1/user_roles')) {
    const id = /user_id=eq\.([0-9a-f-]+)/.exec(url)?.[1] ?? ''
    return ok(ROLES[id] ? [{ role: ROLES[id] }] : [])
  }
  if (url.includes('/auth/v1/admin/users?')) return ok({ users: [{ id: USER, email: 'u@x.vn', created_at: '2026-11-01T00:00:00Z' }] }, { 'x-total-count': '1' })
  if (url.includes('/rpc/admin_user_stats')) return ok([{ user_id: USER, docs: 3, decks: 1, tokens: 500, role: null }])
  if (url.includes(`/auth/v1/admin/users/${USER}`) && method === 'GET') return ok({ id: USER, email: 'u@x.vn', created_at: '' })
  if (url.includes('/auth/v1/admin/users/')) return ok({})
  if (url.includes('/rest/v1/user_documents')) return ok([])
  if (url.includes('/rpc/grant_ai_credits')) return ok(1500)
  if (url.includes('/rest/v1/admin_audit')) return new Response(null, { status: 201 })
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

if (fail) {
  console.error(`${fail} lỗi`)
  process.exit(1)
}
console.log('test-admin: OK')
