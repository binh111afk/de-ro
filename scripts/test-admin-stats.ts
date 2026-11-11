/**
 * Test API admin giai đoạn 5 (Số liệu):
 * - moderator / user thường gọi stats.overview, stats.online bị chặn 403
 * - không token / sai token bị chặn 401
 * - admin gọi stats.overview: days bị kẹp 1..90, gọi RPC admin_stats_overview, đổi tên cột sang camelCase
 * - admin gọi stats.online: gọi bảng presence, lấy email qua Auth Admin API
 * Chạy: npm run test:admin-stats
 */
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
let lastRpcBody: Record<string, unknown> = {}

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const method = init.method ?? 'GET'
  calls.push(`${method} ${url.replace('http://sb', '')}`)
  const ok = (body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status: 200, headers })

  if (url.endsWith('/auth/v1/user')) {
    const tok = String((init.headers as Record<string, string>).Authorization ?? '').replace('Bearer ', '')
    return TOKENS[tok] ? ok({ id: TOKENS[tok] }) : new Response('{}', { status: 401 })
  }
  if (url.includes('/rest/v1/user_roles')) {
    const id = /user_id=eq\.([0-9a-f-]+)/.exec(url)?.[1] ?? ''
    return ok(ROLES[id] ? [{ role: ROLES[id] }] : [])
  }
  if (url.includes('/rpc/admin_stats_overview')) {
    if (init.body) {
      try {
        lastRpcBody = JSON.parse(String(init.body))
      } catch {
        lastRpcBody = {}
      }
    }
    return ok({
      total_users: 120,
      active_7d: 45,
      active_30d: 90,
      online_count: 3,
      days: [
        {
          day: '2026-11-10',
          new_users: 5,
          new_docs: 12,
          new_decks: 3,
          new_community_exams: 1,
        },
      ],
    })
  }
  if (url.includes('/rest/v1/presence')) {
    return ok(
      [
        { user_id: USER, last_seen: '2026-11-10T23:00:00Z' },
        { user_id: MOD, last_seen: '2026-11-10T22:59:00Z' },
      ],
      { 'content-range': '0-1/2' },
    )
  }
  if (url.includes(`/auth/v1/admin/users/${USER}`)) {
    return ok({ id: USER, email: 'user@example.com' })
  }
  if (url.includes(`/auth/v1/admin/users/${MOD}`)) {
    return ok({ id: MOD, email: 'mod@example.com' })
  }
  return ok([])
}) as typeof fetch

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')

async function hit(body: unknown, token?: string): Promise<{ status: number; data: Record<string, unknown> }> {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    headers: { host: 'x', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  })
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

// 1. Kiểm tra xác thực & phân quyền
check('stats.overview không token → 401', (await hit({ action: 'stats.overview' })).status === 401)
check('stats.overview token sai → 401', (await hit({ action: 'stats.overview' }, 'bad')).status === 401)
check('stats.overview user thường → 403', (await hit({ action: 'stats.overview' }, 'tUser')).status === 403)
check('stats.overview moderator → 403', (await hit({ action: 'stats.overview' }, 'tMod')).status === 403)

check('stats.online không token → 401', (await hit({ action: 'stats.online' })).status === 401)
check('stats.online user thường → 403', (await hit({ action: 'stats.online' }, 'tUser')).status === 403)
check('stats.online moderator → 403', (await hit({ action: 'stats.online' }, 'tMod')).status === 403)

// 2. Kiểm tra kẹp days của stats.overview
lastRpcBody = {}
const defRes = await hit({ action: 'stats.overview' }, 'tAdmin')
check('stats.overview mặc định days = 7', defRes.status === 200 && lastRpcBody.p_days === 7 && defRes.data.days === 7)

lastRpcBody = {}
const maxRes = await hit({ action: 'stats.overview', days: 500 }, 'tAdmin')
check('stats.overview kẹp days tối đa 90', maxRes.status === 200 && lastRpcBody.p_days === 90 && maxRes.data.days === 90)

lastRpcBody = {}
const minRes = await hit({ action: 'stats.overview', days: -10 }, 'tAdmin')
check('stats.overview kẹp days tối thiểu 1', minRes.status === 200 && lastRpcBody.p_days === 1 && minRes.data.days === 1)

// 3. Kiểm tra đổi tên cột sang camelCase
const r = defRes.data
check(
  'stats.overview đổi tên các tổng sang camelCase',
  r.totalUsers === 120 && r.active7d === 45 && r.active30d === 90 && r.onlineCount === 3,
)

const d = ((r.chartDays ?? r.daily) as Array<Record<string, unknown>>)?.[0]
check(
  'stats.overview đổi tên cột theo ngày sang camelCase',
  d?.day === '2026-11-10' &&
    d?.newUsers === 5 &&
    d?.newDocs === 12 &&
    d?.newDecks === 3 &&
    d?.newCommunityExams === 1,
)

// 4. Kiểm tra stats.online
calls.length = 0
const onlineRes = await hit({ action: 'stats.online' }, 'tAdmin')
check('stats.online admin → 200', onlineRes.status === 200)
check('stats.online trả số onlineCount', onlineRes.data.onlineCount === 2)
const emails = (onlineRes.data.emails as string[]) ?? []
check(
  'stats.online lấy danh sách email qua Auth Admin API',
  emails.includes('user@example.com') && emails.includes('mod@example.com'),
)
check('stats.online gọi presence và Auth Admin API', calls.some((c) => c.includes('/rest/v1/presence')) && calls.some((c) => c.includes('/auth/v1/admin/users/')))

if (fail > 0) {
  console.error(`test-admin-stats: FAILED (${fail} lỗi)`)
  process.exit(1)
} else {
  console.log('test-admin-stats: OK')
}
