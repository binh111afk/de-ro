import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'

process.env.NODE_ENV = 'development'
delete process.env.VERCEL
process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key'
process.env.MUSE_STATS_TOKEN = 'fake-muse-token'
process.env.AI_MONTHLY_TOKENS = '0'

const WATCH_ID = '11111111-1111-4111-8111-111111111111'
const OTHER_ID = '22222222-2222-4222-8222-222222222222'
const WATCH_EMAIL = 'watch@example.com'
const OTHER_EMAIL = 'private@example.net'
const PATH = '/api/admin/muse-stats'
const ALIAS = '/api/muse-stats'
process.env.MUSE_WATCHLIST = ` ${WATCH_EMAIL}, teacher, missing, ${WATCH_EMAIL} `
const userId = (i: number) => `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`
const allUsers = [
  ...Array.from({ length: 198 }, (_, i) => ({
    id: userId(i), email: `user${i}@example.org`, created_at: '2026-11-10T00:00:00Z',
  })),
  {
    id: WATCH_ID, email: WATCH_EMAIL, created_at: '2026-11-10T00:00:00Z',
    last_sign_in_at: '2026-11-11T00:00:00Z',
    user_metadata: { display_name: 'Nguyễn An', full_name: 'Tên Google', name: 'Tên khác' },
  },
  {
    id: userId(198), email: 'phone@example.org', created_at: '2026-11-21T00:00:00Z',
    user_metadata: { display_name: 'An (+84) 912-345-678' },
  },
  {
    id: OTHER_ID, email: OTHER_EMAIL, created_at: '2026-11-12T00:00:00Z',
    last_sign_in_at: '2026-11-22T00:00:00Z', user_metadata: { full_name: `Tên <${OTHER_EMAIL}>` },
  },
  {
    id: userId(199), email: 'id-name@example.org', created_at: '2026-11-20T00:00:00Z',
    user_metadata: { name: `An (${userId(199)})` },
  },
  {
    id: userId(200), email: 'full-name@example.org', created_at: '2026-11-19T00:00:00Z',
    user_metadata: { full_name: 'Tên đầy đủ' },
  },
  {
    id: userId(201), email: 'name@example.org', created_at: '2026-11-18T00:00:00Z',
    user_metadata: { name: 'Tên bên ngoài' },
  },
  { id: userId(202), created_at: '2026-11-17T00:00:00Z' },
]
const authPages: number[] = []
let now = Date.parse('2026-11-22T17:00:00Z')
Date.now = () => now

const calls: string[] = []
const unexpected: string[] = []
let ai7dUnavailable = false
globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = new URL(input)
  const method = init.method ?? 'GET'
  const request = `${method} ${url.pathname}`
  const params = url.searchParams
  const batchIds = params.get('user_id')?.match(/^in\.\((.+)\)$/)?.[1].split(',') ?? []
  calls.push(request)
  const ok = (data: unknown) => Response.json(data)

  switch (request) {
    case 'POST /rest/v1/rpc/admin_stats_overview':
      if (JSON.parse(String(init.body)).p_days !== 7) break
      return ok({
        total_users: 76, online_count: 1,
        days: [
          { day: '2026-11-22', new_users: 2, new_docs: 3, new_decks: 4, new_community_exams: 10 },
          { day: '2026-11-23', new_users: 5, new_docs: 7, new_decks: 9 },
        ],
      })
    case 'POST /rest/v1/rpc/admin_ai_stats': {
      const { p_days } = JSON.parse(String(init.body))
      if (p_days === 7) {
        if (ai7dUnavailable) return new Response('internal failure', { status: 502 })
        return ok([{ calls: '3', errors: 1, tokens: 450, cost: null }])
      }
      if (p_days === 30) return ok([
        { calls: '5', errors: 0, tokens: '500', cost: '2.34' },
        { calls: 3, errors: 1, tokens: 450, cost: null },
      ])
      break
    }
    case 'HEAD /rest/v1/ai_feedback':
      if (params.get('kind') !== 'eq.down') break
      return new Response(null, { headers: { 'content-range': '0-0/12' } })
    case 'GET /rest/v1/ai_feedback':
      if (params.get('select') !== 'user_id,mode,created_at' || params.get('limit') !== '10') break
      return ok(Array.from({ length: 12 }, () => ({
        user_id: OTHER_ID, mode: 'slide', created_at: '2026-11-22T18:00:00Z',
        request: 'Nội dung riêng tư', reply: OTHER_EMAIL,
      })))
    case 'GET /auth/v1/admin/users':
      if (params.get('filter') === WATCH_EMAIL) return ok({ users: [{ id: WATCH_ID, email: WATCH_EMAIL }] })
      if (params.get('filter') === 'teacher') return ok({ users: [
        { id: OTHER_ID, email: OTHER_EMAIL },
        { id: WATCH_ID, email: 'teacher@school.example' },
      ] })
      if (params.get('filter') === 'missing') return ok({ users: [{ id: OTHER_ID, email: OTHER_EMAIL }] })
      if (!params.has('filter') && params.get('per_page') === '100') {
        const page = Number(params.get('page'))
        authPages.push(page)
        return ok({ users: allUsers.slice((page - 1) * 100, page * 100), total: allUsers.length })
      }
      break
    case `GET /auth/v1/admin/users/${OTHER_ID}`:
      return ok({ email: OTHER_EMAIL, user_metadata: { display_name: OTHER_EMAIL } })
    case 'POST /rest/v1/rpc/admin_user_stats': {
      const { p_ids: ids } = JSON.parse(String(init.body))
      if (JSON.stringify(ids) !== JSON.stringify([WATCH_ID]) && ids.length !== 100) break
      return ok(ids.includes(WATCH_ID) ? [{ user_id: WATCH_ID, docs: '2', decks: 3 }] : [])
    }
    case 'GET /rest/v1/presence':
      if (!batchIds.length || params.get('select') !== 'user_id,last_seen') break
      return ok(batchIds.includes(WATCH_ID)
        ? [{ user_id: WATCH_ID, last_seen: '2026-11-22T16:00:00Z' }]
        : [])
    case 'GET /rest/v1/app_settings':
      if (params.get('key') !== 'eq.ai_welcome') break
      return ok([{ value: { points: 90 } }])
    case 'GET /rest/v1/ai_credits':
      if (params.get('user_id') === `eq.${WATCH_ID}`) return ok([{ balance: 39_000 }])
      if (batchIds.length === 100) return ok(batchIds.includes(WATCH_ID) ? [{ user_id: WATCH_ID, balance: 39_000 }] : [])
      break
    case 'GET /rest/v1/ai_quota_overrides':
      if (params.get('user_id') === `eq.${WATCH_ID}`) return ok([{ monthly_tokens: 5_000 }])
      if (batchIds.length === 100) return ok(batchIds.includes(WATCH_ID)
        ? [{ user_id: WATCH_ID, monthly_tokens: 5_000 }, { user_id: OTHER_ID, monthly_tokens: null }]
        : [])
      break
    case 'GET /rest/v1/ai_usage':
      if (params.get('user_id') === `eq.${WATCH_ID}`) return ok([{ tokens: 18_000 }])
      if (batchIds.length === 100) return ok(batchIds.includes(WATCH_ID) ? [{ user_id: WATCH_ID, tokens: 18_000 }] : [])
      break
  }
  unexpected.push(request)
  return new Response('unexpected DB call', { status: 500 })
}) as typeof fetch

const { handleAdminRequest } = await import('../server/admin.ts')
const rewrites = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).rewrites
const rewritten = rewrites.find((rule: { source: string }) => rule.source === ALIAS).destination

async function hit(url = PATH, token?: string, method = 'GET', ip = '127.0.0.1') {
  const req = {
    url, method, headers: { origin: 'https://bot.example', 'x-muse-token': token },
    socket: { remoteAddress: ip },
  } as unknown as IncomingMessage
  const out = { status: 0, headers: {} as Record<string, string>, body: '' }
  const res = {
    setHeader(name: string, value: string) {
      out.headers[name.toLowerCase()] = value
    },
    writeHead(status: number) {
      out.status = status
    },
    end(body: string) {
      out.body = body
    },
  } as unknown as ServerResponse
  await handleAdminRequest(req, res)
  assert.equal(out.headers['cache-control'], 'no-store')
  return out
}

const token = process.env.MUSE_STATS_TOKEN
assert.equal((await hit()).status, 401)
assert.equal((await hit(PATH, 'wrong')).status, 401)
const post = await hit(rewritten, token, 'POST')
assert.equal(post.status, 405)
assert.equal(post.headers.allow, 'GET')
assert.equal((await hit(PATH, token, 'OPTIONS')).status, 405)
delete process.env.MUSE_STATS_TOKEN
assert.equal((await hit(PATH, token)).status, 401)
process.env.MUSE_STATS_TOKEN = ' '
assert.equal((await hit(PATH, ' ')).status, 401)
assert.deepEqual(calls, [])
process.env.MUSE_STATS_TOKEN = token

const result = await hit(rewritten, token)
assert.equal(result.status, 200)
assert.deepEqual(JSON.parse(result.body), {
  checked_at: '2026-11-23T00:00:00+07:00',
  users: { total: 76, new_today: 5, new_7d: 7, online_now: 1 },
  content: { exams_7d: 10, slides_7d: 13, exams_today: 7, slides_today: 9 },
  ai: {
    cost_30d_usd: 2.34, calls_30d: 8, tokens_30d: 950, error_30d_pct: 12.5,
    cost_7d_usd: 0, calls_7d: 3, tokens_7d: 450, error_7d_pct: 33.3,
  },
  feedback: {
    dislikes_total: 12,
    recent: Array.from({ length: 10 }, () => ({ at: '2026-11-22T18:00:00Z', kind: 'slide', user: 'pr***@example.net' })),
  },
  watchlist: [
    { email: WATCH_EMAIL, points_left: 26, exams: 2, slides: 3 },
    { email: 'teacher', points_left: 26, exams: 2, slides: 3 },
    { email: 'missing', points_left: null, exams: 0, slides: 0 },
  ],
  retention: { since: '2026-11-22', returning_pct: null },
})
assert.deepEqual(result.body.match(/[^"\s]+@[^"\s]+/g), ['pr***@example.net', ...Array(9).fill('pr***@example.net'), WATCH_EMAIL])
const callCount = calls.length
now += 59_999
assert.equal((await hit(PATH, token)).status, 429)
assert.equal(calls.length, callCount)

now += 1
delete process.env.MUSE_WATCHLIST
ai7dUnavailable = true
const partial = await hit(ALIAS, token)
assert.equal(partial.status, 200)
assert.deepEqual(JSON.parse(partial.body).watchlist, [])
assert.equal(JSON.parse(partial.body).ai.calls_7d, 0)
assert.equal(JSON.parse(partial.body).ai.calls_30d, 8)

process.env.MUSE_WATCHLIST = '*'
now += 60_000
const beforeWildcard = calls.length
const wildcard = await hit(ALIAS, token)
assert.equal(wildcard.status, 200)
const { accounts, accounts_total, watchlist } = JSON.parse(wildcard.body)
assert.deepEqual(watchlist, [])
assert.equal(accounts_total, 205)
assert.equal(accounts.length, 200)
assert.deepEqual(authPages, [1, 2, 3])
assert.deepEqual(accounts.slice(0, 7), [
  { name: 'Nguyễn An', points_left: 26, exams: 2, slides: 3 },
  { name: 'pr***@example.net', points_left: -1, exams: 0, slides: 0 },
  { name: 'ph***@example.org', points_left: 90, exams: 0, slides: 0 },
  { name: 'id***@example.org', points_left: 90, exams: 0, slides: 0 },
  { name: 'Tên đầy đủ', points_left: 90, exams: 0, slides: 0 },
  { name: 'Tên bên ngoài', points_left: 90, exams: 0, slides: 0 },
  { name: 'Ẩn danh', points_left: 90, exams: 0, slides: 0 },
])
for (const row of accounts) {
  assert.deepEqual(Object.keys(row).sort(), ['exams', 'name', 'points_left', 'slides'])
  assert.equal(typeof row.name, 'string')
  assert.ok([row.exams, row.points_left, row.slides].every(Number.isFinite))
  if (row.name.includes('@')) assert.match(row.name, /^[^@]*\*\*\*@[^@]+$/)
}
const serializedAccounts = JSON.stringify(accounts)
for (const user of allUsers) {
  if (user.email) assert.ok(!serializedAccounts.includes(user.email))
  assert.ok(!serializedAccounts.includes(user.id))
}
assert.ok(!serializedAccounts.includes('912-345-678'))
for (const request of [
  'POST /rest/v1/rpc/admin_user_stats', 'GET /rest/v1/ai_credits',
  'GET /rest/v1/ai_quota_overrides', 'GET /rest/v1/ai_usage',
]) {
  assert.equal(calls.slice(beforeWildcard).filter((call) => call === request).length, 2, request)
}

now += 60_000
process.env.MUSE_WATCHLIST = ` ${WATCH_EMAIL}, *, * `
const mixed = await hit(ALIAS, token)
assert.equal(mixed.status, 200)
const mixedData = JSON.parse(mixed.body)
assert.deepEqual(mixedData.accounts, accounts)
assert.equal(mixedData.accounts_total, accounts_total)
assert.deepEqual(mixedData.watchlist, [{ email: WATCH_EMAIL, points_left: 26, exams: 2, slides: 3 }])

delete process.env.SUPABASE_SERVICE_ROLE_KEY
const logError = console.error
console.error = () => {}
try {
  const failed = await hit(PATH, token, 'GET', '192.0.2.5')
  assert.equal(failed.status, 503)
  assert.deepEqual(JSON.parse(failed.body), { error: 'Máy chủ đang bận, thử lại sau.' })
} finally {
  console.error = logError
}
assert.deepEqual(unexpected, [])
console.log('test-admin-muse-stats: OK')
