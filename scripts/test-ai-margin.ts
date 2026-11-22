import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import type { AiMarginReport, AiMarginSettings } from '../src/lib/adminAiMarginApi.js'

process.env.NODE_ENV = 'development'
process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const now = Date.parse('2027-01-20T06:00:00Z')
Date.now = () => now
const month = '2027-01'
const since = Date.parse('2027-01-13T06:00:00Z')
const admin = '11111111-1111-4111-8111-111111111111'
const mod = '22222222-2222-4222-8222-222222222222'
const settings: AiMarginSettings = {
  usdVnd: 25_000,
  unitCostUsd: { image: 0.002, other: 0 },
  actual: { [month]: { text: 0.04, image: 0 }, '2026-12': { text: 1 } },
}

const recent = '2027-01-19T00:00:00Z'
const calls = [
  { id: 8, kind: 'task-doc', provider: 'text', ok: true, billed: 10_000, cost: 0.002, created_at: recent },
  { id: 7, kind: 'task-doc', provider: 'text', ok: false, billed: null, cost: 0.002, created_at: recent },
  { id: 6, kind: 'image', provider: 'image', ok: true, billed: 1250, cost: null, created_at: recent },
  { id: 5, kind: 'image-pro', provider: 'image', ok: true, billed: 5000, cost: null, created_at: recent },
  { id: 4, kind: ' ', provider: 'text', ok: true, billed: null, cost: null, created_at: recent },
  { id: 3, kind: null, provider: 'text', ok: false, billed: null, cost: null, created_at: recent },
  { id: 2, kind: 'task-doc', provider: 'text', ok: true, billed: 5000, cost: 0.016, created_at: '2026-12-31T17:00:00Z' },
  { id: 1, kind: 'task-doc', provider: 'text', ok: true, billed: 5000, cost: 1, created_at: '2026-12-31T16:59:59Z' },
]

const { summarizeAiMargin } = await import('../server/aiMargin.ts')
const report = summarizeAiMargin(calls, settings, 50, since, month)
const row = (kind: string) => {
  const item = report.rows.find((entry) => entry.kind === kind)
  assert.ok(item, `Thiếu tác vụ ${kind}`)
  return item
}
assert.equal(report.vndPerPoint, 20)
assert.equal(row('task-doc').success, 1)
assert.equal(row('task-doc').marginVnd, 100)
assert.equal(row('task-doc').marginPercent, 50)
assert.equal(row('image').points, 1.25)
assert.equal(row('image').marginVnd, -25)
assert.equal(row('image').marginPercent, -100)
assert.equal(row('image-pro').missingPrice, 1)
assert.equal(row('image-pro').marginVnd, null)
assert.equal(row('other').costUsd, 0)
assert.equal(row('other').missingPrice, 0)
assert.equal(row('other').marginVnd, 0)
assert.equal(row('other').marginPercent, null)
assert.equal(report.total.billed, 16_250)
assert.equal(report.total.costVnd, 150)
assert.equal(report.total.marginVnd, null)
assert.deepEqual(report.comparison, [
  { provider: 'image', estimatedUsd: 0, actualUsd: 0, ratio: null },
  { provider: 'text', estimatedUsd: 0.02, actualUsd: 0.04, ratio: 2 },
])
console.log('OK tính biên âm/dương, thiếu giá, giá 0, chia 0 và đối chiếu theo tháng VN')

let saved: AiMarginSettings | undefined
const reads: URL[] = []
const audits: unknown[] = []
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input))
  const body = () => JSON.parse(String(init?.body))
  const json = (data: unknown) => new Response(JSON.stringify(data))
  switch (url.pathname) {
    case '/auth/v1/.well-known/jwks.json':
      return json({ keys: [] })
    case '/auth/v1/user':
      return json({ id: new Headers(init?.headers).get('Authorization') === 'Bearer h.mod.s' ? mod : admin })
    case `/auth/v1/admin/users/${admin}`:
    case `/auth/v1/admin/users/${mod}`:
      return json({ banned_until: null })
    case '/rest/v1/user_roles':
      return json([{ role: url.searchParams.get('user_id') === `eq.${mod}` ? 'moderator' : 'admin' }])
    case '/rest/v1/admin_audit':
      audits.push(body())
      return new Response(null, { status: 201 })
    case '/rest/v1/app_settings': {
      if (init?.method === 'POST') {
        assert.equal(url.searchParams.get('on_conflict'), 'key')
        assert.equal(body().key, 'ai_margin')
        saved = body().value
        return new Response(null, { status: 201 })
      }
      const rows = saved ? [{ key: 'ai_margin', value: saved }] : []
      if (url.searchParams.get('key') === 'eq.ai_margin') return json(rows)
      assert.equal(url.searchParams.get('key'), 'in.(ai_margin,pricing)')
      return json([...rows, { key: 'pricing', value: { pointsPer1000: 50, packs: [{ vnd: 2000, bonus: 0.2 }] } }])
    }
    case '/rest/v1/ai_calls': {
      reads.push(url)
      assert.equal(url.searchParams.get('order'), 'id.desc')
      const [min, max] = url.searchParams.getAll('created_at').map((value) => Date.parse(value.slice(4)))
      const beforeId = Number(url.searchParams.get('id')?.slice(3) ?? Infinity)
      // Giả lập PostgREST giới hạn trang nhỏ hơn limit yêu cầu.
      return json(calls.filter((call) => {
        const time = Date.parse(call.created_at)
        return call.id < beforeId && time >= min && time <= max
      }).slice(0, 2))
    }
    default:
      throw new Error('Đường dẫn Supabase ngoài dự kiến')
  }
}

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')

async function hit(body: unknown, token = 'admin') {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST', headers: { host: 'x', ...(token ? { authorization: `Bearer h.${token}.s` } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  })
  let status = 0
  let response = ''
  const res = {
    writeHead(code: number) { status = code; return this },
    end(value?: string) { response = value ?? '' },
  } as unknown as ServerResponse
  _resetRoleCache()
  await handleAdminRequest(req, res)
  return { status, data: response ? JSON.parse(response) : {} }
}

assert.equal((await hit({ action: 'aiMargin.get', days: 7 }, '')).status, 401)
assert.equal((await hit({ action: 'aiMargin.get', days: 7 }, 'mod')).status, 403)
assert.equal((await hit({ action: 'aiMargin.settings' }, 'mod')).status, 403)
assert.equal((await hit({ action: 'aiMargin.saveSettings', settings }, 'mod')).status, 403)
assert.deepEqual(await hit({ action: 'aiMargin.settings' }), {
  status: 200, data: { month, settings: { usdVnd: 25_000, unitCostUsd: {}, actual: {} } },
})

const mapOf = (count: number) => Object.fromEntries(Array.from({ length: count }, (_, index) => [`id${index}`, 0]))
const tooManyMonths = Object.fromEntries(Array.from({ length: 25 }, (_, index) => [`${2000 + index}-01`, {}]))
const invalid = [
  { ...settings, unknown: true },
  { ...settings, usdVnd: 999 }, { ...settings, usdVnd: 100_001 }, { ...settings, usdVnd: '25000' },
  { ...settings, unitCostUsd: [] }, { ...settings, unitCostUsd: { image: -1 } },
  { ...settings, unitCostUsd: { image: 10.01 } }, { ...settings, unitCostUsd: { constructor: 0 } },
  { ...settings, unitCostUsd: mapOf(33) },
  { ...settings, actual: { '2027-13': { text: 0 } } },
  { ...settings, actual: { [month]: { text: 100_001 } } },
  { ...settings, actual: { [month]: { text: null } } },
  { ...settings, actual: { [month]: { 'text provider': 0 } } },
  { ...settings, actual: { [month]: mapOf(25) } }, { ...settings, actual: tooManyMonths },
]
for (const bad of invalid) assert.equal((await hit({ action: 'aiMargin.saveSettings', settings: bad })).status, 400)
assert.equal((await hit({ action: 'aiMargin.saveSettings', settings, unknown: true })).status, 400)
assert.equal(saved, undefined)
assert.deepEqual(audits, [])
assert.deepEqual(await hit({ action: 'aiMargin.saveSettings', settings }), { status: 200, data: { month, settings } })
assert.deepEqual(saved, settings)
assert.deepEqual(audits, [{ admin_id: admin, action: 'aiMargin.saveSettings', target: 'ai_margin', detail: {} }])
assert.deepEqual(await hit({ action: 'aiMargin.settings' }), { status: 200, data: { month, settings } })
console.log('OK phân quyền admin, xác thực dữ liệu lưu, đọc lại và audit')

assert.equal((await hit({ action: 'aiMargin.get', days: 14 })).status, 400)
assert.equal((await hit({ action: 'aiMargin.get', days: '7' })).status, 400)
assert.equal(reads.length, 0)
const result = await hit({ action: 'aiMargin.get', days: 7 })
assert.equal(result.status, 200)
assert.deepEqual(result.data, report)
assert.deepEqual(reads.map((url) => url.searchParams.get('id')), [null, 'lt.7', 'lt.5', 'lt.3', 'lt.2'])
for (const days of [30, 90]) {
  const longer = await hit({ action: 'aiMargin.get', days })
  assert.equal(longer.status, 200)
  assert.equal((longer.data as AiMarginReport).total.billed, 26_250)
  assert.deepEqual((longer.data as AiMarginReport).comparison, report.comparison)
}
console.log('OK aiMargin.get qua Supabase giả lập, đủ trang và đủ ba kỳ')
