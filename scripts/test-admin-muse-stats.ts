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
      break
    case `GET /auth/v1/admin/users/${OTHER_ID}`:
      return ok({ email: OTHER_EMAIL, user_metadata: { display_name: OTHER_EMAIL } })
    case 'POST /rest/v1/rpc/admin_user_stats':
      if (JSON.stringify(JSON.parse(String(init.body)).p_ids) !== JSON.stringify([WATCH_ID])) break
      return ok([{ user_id: WATCH_ID, docs: '2', decks: 3 }])
    case 'GET /rest/v1/ai_credits':
      if (params.get('user_id') === `eq.${WATCH_ID}`) return ok([{ balance: 39_000 }])
      break
    case 'GET /rest/v1/ai_quota_overrides':
      if (params.get('user_id') === `eq.${WATCH_ID}`) return ok([{ monthly_tokens: 5_000 }])
      break
    case 'GET /rest/v1/ai_usage':
      if (params.get('user_id') === `eq.${WATCH_ID}`) return ok([{ tokens: 18_000 }])
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
