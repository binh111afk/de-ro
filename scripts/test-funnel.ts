import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { mapAdminFunnel } from '../server/adminFunnel.ts'
import { funnelPercentages } from '../src/lib/adminFunnel.ts'
import type { StatsFunnel } from '../src/lib/adminStatsApi.ts'

const zeroSteps = { signedUp: 0, returned: 0, made: 0, usedAi: 0, paid: 0 }
const empty = { days: 0, steps: zeroSteps, weeks: [], hot: [] }
assert.deepEqual(mapAdminFunnel(null, 0), empty)
assert.deepEqual(mapAdminFunnel({}, 0), empty)
assert.deepEqual(mapAdminFunnel({ weeks: [{}], hot: [{}] }, 7), {
  ...empty,
  days: 7,
  weeks: [{ week: '', ...zeroSteps }],
  hot: [{ userId: '', email: '', name: '', calls: 0, billed: 0 }],
})

const ratios = funnelPercentages({ signedUp: 20, returned: 10, made: 0, usedAi: 5, paid: 1 })
assert.deepEqual(ratios, [
  { key: 'signedUp', count: 20, fromSignup: 100, fromPrevious: null },
  { key: 'returned', count: 10, fromSignup: 50, fromPrevious: 50 },
  { key: 'made', count: 0, fromSignup: 0, fromPrevious: 0 },
  { key: 'usedAi', count: 5, fromSignup: 25, fromPrevious: null },
  { key: 'paid', count: 1, fromSignup: 5, fromPrevious: 20 },
])
assert(funnelPercentages(zeroSteps).every((row) => row.fromSignup === null && row.fromPrevious === null))
assert.equal(funnelPercentages({ ...zeroSteps, usedAi: 7, paid: 1 })[4].fromPrevious, (1 / 7) * 100)

process.env.NODE_ENV ??= 'development'
process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const admin = '11111111-1111-4111-8111-111111111111'
const moderator = '22222222-2222-4222-8222-222222222222'
const firstUser = '33333333-3333-4333-8333-333333333333'
const missingUser = '44444444-4444-4444-8444-444444444444'
const sampleEmail = 'user@example.com'
const rpcCalls: Array<{ method?: string; authorization: string | null; body: unknown }> = []

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = new URL(String(input))
  const authorization = new Headers(init.headers).get('Authorization')
  const ok = (body: unknown) => new Response(JSON.stringify(body))

  if (url.pathname === '/auth/v1/user') {
    if (authorization === 'Bearer h.admin.s') return ok({ id: admin })
    if (authorization === 'Bearer h.mod.s') return ok({ id: moderator })
    return new Response('{}', { status: 401 })
  }
  if (url.pathname === '/rest/v1/user_roles') {
    return ok([{ role: url.searchParams.get('user_id') === `eq.${admin}` ? 'admin' : 'moderator' }])
  }
  if (url.pathname === '/rest/v1/rpc/admin_funnel') {
    rpcCalls.push({ method: init.method, authorization, body: JSON.parse(String(init.body)) })
    return ok({
      signed_up: 20, returned: 10, made: 8, used_ai: 5,
      weeks: [
        { week: '2026-11-16', signed_up: 9, used_ai: 2 },
        { week: '2026-11-09', signed_up: 11, paid: 1 },
      ],
      hot: [
        { user_id: firstUser, calls: 9, billed: '12000' },
        { user_id: missingUser, calls: 4 },
      ],
    })
  }
  if (url.pathname === `/auth/v1/admin/users/${firstUser}`) {
    return ok({ id: firstUser, email: sampleEmail, user_metadata: { full_name: 'Giáo viên' } })
  }
  if (url.pathname === `/auth/v1/admin/users/${missingUser}`) {
    return new Response('{}', { status: 404 })
  }
  return ok([])
}) as typeof fetch

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')

async function hit(days?: unknown, token?: string) {
  const body = { action: 'stats.funnel', days }
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    headers: { host: 'x', ...(token ? { authorization: `Bearer h.${token}.s` } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  })
  const out = { status: 0, data: {} as StatsFunnel }
  const res = {
    writeHead(status: number) {
      out.status = status
      return this
    },
    end(body?: string) {
      if (body) out.data = JSON.parse(body)
    },
  } as unknown as ServerResponse
  _resetRoleCache()
  await handleAdminRequest(req, res)
  return out
}

assert.equal((await hit(7)).status, 401)
assert.equal((await hit(7, 'mod')).status, 403)
assert.equal(rpcCalls.length, 0)

for (const [input, expected] of [[0, 0], [7, 7], [30, 30], [90, 90], ['30', 0], [7.5, 0], [undefined, 0]]) {
  const response = await hit(input, 'admin')
  assert.equal(response.status, 200)
  assert.equal(response.data.days, expected)
  assert.deepEqual(rpcCalls.at(-1), { method: 'POST', authorization: 'Bearer sk', body: { p_days: expected } })
}

const { data } = await hit(30, 'admin')
assert.deepEqual(data.steps, { signedUp: 20, returned: 10, made: 8, usedAi: 5, paid: 0 })
assert.deepEqual(data.weeks, [
  { week: '2026-11-16', ...zeroSteps, signedUp: 9, usedAi: 2 },
  { week: '2026-11-09', ...zeroSteps, signedUp: 11, paid: 1 },
])
assert.equal(data.hot.length, 2)
const [first, second] = data.hot
assert(first.email === sampleEmail, 'Hàng đầu có email từ Auth Admin API')
assert.equal(first.name, 'Giáo viên')
assert.equal(first.userId, firstUser)
assert.equal(first.calls, 9)
assert.equal(first.billed, 12_000)
assert.equal(second.userId, missingUser)
assert(second.email === '', 'Hàng lỗi tra cứu có email trống')
assert.equal(second.name, '')
assert.equal(second.calls, 4)
assert.equal(second.billed, 0)

console.log('test-funnel: OK')
