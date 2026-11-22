import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import type { AiFeedbackDetail, AiFeedbackOverview } from '../src/lib/adminAiFeedbackApi.ts'

process.env.NODE_ENV = 'development'
process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const ADMIN = '11111111-1111-4111-8111-111111111111'
const MOD = '22222222-2222-4222-8222-222222222222'
const USER = '33333333-3333-4333-8333-333333333333'
const REMOVED = '44444444-4444-4444-8444-444444444444'
const tokens = new Map([['h.admin.s', ADMIN], ['h.mod.s', MOD], ['h.user.s', USER]])
const roles = new Map([[ADMIN, 'admin'], [MOD, 'moderator']])
const calls: Array<{ url: URL; method: string; prefer: string | null }> = []
const request = 'a'.repeat(299) + '👍' + 'b'.repeat(20)
const reply = 'c'.repeat(320)
const now = Date.now()
const negativeKinds = ['down', 'undo', 'resend', 'complaint']
const negativeRows = Array.from({ length: 54 }, (_, i) => ({
  id: i + 2,
  kind: negativeKinds[i % negativeKinds.length],
  mode: i === 0 ? 'board' : 'exam',
  user_id: i === 52 ? REMOVED : USER,
  created_at: new Date(now - (54 - i) * 1000).toISOString(),
  request, reply, note: 'Ghi chú mẫu', context: 'Ngữ cảnh nội bộ',
}))
const feedbackRows = [
  ...negativeRows,
  ...Array.from({ length: 1001 }, (_, i) => ({
    ...negativeRows[0], id: i + 56, kind: 'up', mode: 'exam',
    created_at: new Date(now - 500).toISOString(),
  })),
]
const callRows = [
  { kind: 'task-doc', count: 1200 },
  { kind: 'question', count: 20 },
  { kind: 'ask-clarify', count: 15 },
  { kind: 'task-exam-online', count: 4 },
  { kind: 'vision-source', count: 1 },
  { kind: 'task-slide', count: 10 },
  { kind: 'task-slide-pro', count: 5 },
  { kind: 'image', count: 400 },
]
let brokenTable = ''
const listKinds = (filter: string | null) => filter?.slice(4, -1).split(',') ?? []

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input))
  const method = init.method ?? 'GET'
  const headers = new Headers(init.headers)
  calls.push({ url, method, prefer: headers.get('prefer') })
  const query = url.searchParams
  const path = url.pathname
  if (path === '/auth/v1/user') {
    const id = tokens.get(headers.get('authorization')?.slice(7) ?? '')
    return id ? Response.json({ id }) : new Response('{}', { status: 401 })
  }
  if (path === '/rest/v1/user_roles') {
    const role = roles.get(query.get('user_id')?.slice(3) ?? '')
    return Response.json(role ? [{ role }] : [])
  }
  if (path === brokenTable) return new Response('{}', { status: 500 })
  if (path === '/rest/v1/ai_calls') {
    const kinds = listKinds(query.get('kind'))
    const total = callRows.filter((row) => kinds.includes(row.kind)).reduce((sum, row) => sum + row.count, 0)
    const count = query.get('ok') === 'eq.true' ? total : total + 25
    return new Response(null, { headers: { 'content-range': count ? `0-0/${count}` : '*/0' } })
  }
  if (path === '/rest/v1/ai_feedback') {
    const select = query.get('select') ?? ''
    const id = query.get('id')
    const kinds = listKinds(query.get('kind'))
    const rows = feedbackRows.filter((row) =>
      (!kinds.length || kinds.includes(row.kind)) &&
      (!id || (id.startsWith('eq.') ? row.id === Number(id.slice(3)) : row.id < Number(id.slice(3)))),
    )
    rows.sort((a, b) => (query.get('order')?.startsWith('created_at') ? b.created_at.localeCompare(a.created_at) : 0) || b.id - a.id)
    return Response.json(rows.slice(0, Number(query.get('limit'))).map((row) =>
      Object.fromEntries(select.split(',').map((field) => [field, row[field as keyof typeof row]])),
    ))
  }
  if (path === `/auth/v1/admin/users/${USER}`) {
    return Response.json({ id: USER, email: 'user@example.com', user_metadata: { full_name: 'Giáo viên' } })
  }
  if (path === `/auth/v1/admin/users/${REMOVED}`) return new Response('{}', { status: 404 })
  return Response.json([])
}

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')
const { summarizeAiFeedback } = await import('../server/adminAiFeedback.ts')

async function hit<T>(action: string, body: Record<string, unknown> = {}, token?: string) {
  const req = Readable.from([Buffer.from(JSON.stringify({ action, ...body }))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    headers: { host: 'x', ...(token ? { authorization: `Bearer h.${token}.s` } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  })
  let status = 0
  let payload = ''
  const res = {
    writeHead(code: number) {
      status = code
      return this
    },
    end(value = '') { payload = value },
  } as unknown as ServerResponse
  _resetRoleCache()
  await handleAdminRequest(req, res)
  return { status, data: JSON.parse(payload) as T }
}

const counts = { up: 9, down: 1, undo: 2, resend: 3, complaint: 4 }
const [exam, slide, board] = summarizeAiFeedback({ exam: 40 }, { exam: counts, slide: counts })
assert.equal(exam.dissatisfied, 10)
assert.equal(exam.dissatisfactionRate, 0.25)
assert.equal(exam.counts.up, 9)
assert.equal(slide.dissatisfactionRate, null)
assert.equal(slide.dissatisfied, 10)
assert.deepEqual(board, {
  mode: 'board', successfulCalls: 0, counts: { up: 0, down: 0, undo: 0, resend: 0, complaint: 0 },
  dissatisfied: 0, dissatisfactionRate: null,
})
console.log('✓ Gộp số liệu, tính tỉ lệ, chia 0 và chế độ chưa có dữ liệu')

for (const action of ['aiFeedback.overview', 'aiFeedback.detail']) {
  assert.equal((await hit(action)).status, 401)
  assert.equal((await hit(action, {}, 'bad')).status, 401)
  assert.equal((await hit(action, {}, 'user')).status, 403)
  assert.equal((await hit(action, {}, 'mod')).status, 403)
}
assert.ok(!calls.some(({ url }) => /\/ai_(calls|feedback)$/.test(url.pathname)))
console.log('✓ Chỉ admin đọc được tổng quan và chi tiết')

calls.length = 0
const { status, data } = await hit<AiFeedbackOverview>('aiFeedback.overview', {}, 'admin')
assert.equal(status, 200)
assert.equal(data.days, 30)
assert.deepEqual(data.modes[0], {
  mode: 'exam', successfulCalls: 1240,
  counts: { up: 1001, down: 13, undo: 14, resend: 13, complaint: 13 },
  dissatisfied: 53, dissatisfactionRate: 53 / 1240,
})
assert.equal(data.modes[1].successfulCalls, 15)
assert.equal(data.modes[1].dissatisfactionRate, 0)
assert.equal(data.modes[2].dissatisfactionRate, null)
assert.equal(data.items.length, 50)
assert.equal(data.items[0].id, 55)
assert.equal(data.items[49].id, 6)
assert.equal(Array.from(data.items[0].request).length, 300)
assert.ok(data.items[0].request.endsWith('👍'))
assert.equal(data.items[0].reply.length, 300)
assert.equal(data.items[0].note, 'Ghi chú mẫu')
assert.equal(data.items[0].user?.name, 'Giáo viên')
assert.ok(data.items[0].user?.email === 'user@example.com')
assert.equal(data.items[1].user, null)
assert.ok(!('context' in data.items[0]))
assert.equal(calls.filter(({ url }) => url.pathname === `/auth/v1/admin/users/${USER}`).length, 1)
assert.equal(calls.filter(({ url }) => url.pathname === `/auth/v1/admin/users/${REMOVED}`).length, 1)
const reads = calls.filter(({ url }) => /\/ai_(calls|feedback)$/.test(url.pathname))
assert.ok(reads.every(({ url }) => Number(url.searchParams.get('limit')) <= 1000))
assert.ok(reads.some(({ url }) => url.searchParams.get('id')?.startsWith('lt.')))
assert.ok(reads.some(({ url }) => url.searchParams.get('order') === 'created_at.desc,id.desc'))
assert.ok(reads.some(({ url }) => url.searchParams.get('kind') === 'in.(down,undo,resend,complaint)'))
assert.deepEqual(
  reads.filter(({ method, prefer }) => method === 'HEAD' && prefer === 'count=exact')
    .map(({ url }) => url.searchParams.get('kind')),
  ['in.(task-doc,question,ask-clarify,task-exam-online,vision-source)', 'in.(task-slide,task-slide-pro)', 'in.(board)'],
)
console.log('✓ Đếm chính xác hơn 1.000 lượt, phân trang phản hồi và giới hạn 50 phản hồi mới nhất')

for (const [input, days] of [[7, 7], [90, 90], [14, 30], ['7', 30]] as const) {
  calls.length = 0
  const result = await hit<AiFeedbackOverview>('aiFeedback.overview', { days: input }, 'admin')
  assert.equal(result.data.days, days)
  const read = calls.find(({ url }) => url.pathname === '/rest/v1/ai_calls')!
  const [from, to] = read.url.searchParams.getAll('created_at')
  assert.equal(Date.parse(to.slice(4)) - Date.parse(from.slice(4)), days * 86_400_000)
}
for (const table of ['ai_feedback', 'ai_calls']) {
  brokenTable = `/rest/v1/${table}`
  const result = await hit<AiFeedbackOverview>('aiFeedback.overview', {}, 'admin')
  assert.equal(result.status, 200)
  assert.equal(result.data.unavailable, true)
  assert.deepEqual(result.data.modes, summarizeAiFeedback({}, {}))
  assert.equal(result.data.items.length, 0)
}
brokenTable = ''
console.log('✓ Khoảng thời gian hợp lệ, mặc định 30 ngày và cấu trúc rỗng khi lỗi bảng')

const full = await hit<AiFeedbackDetail>('aiFeedback.detail', { id: 55 }, 'admin')
assert.equal(full.status, 200)
assert.equal(full.data.request.length, request.length)
assert.equal(full.data.reply.length, reply.length)
assert.equal((await hit('aiFeedback.detail', { id: 56 }, 'admin')).status, 404)
assert.equal((await hit('aiFeedback.detail', { id: '55&kind=eq.up' }, 'admin')).status, 400)
console.log('✓ Chi tiết trả nội dung đầy đủ cho phản hồi không hài lòng')
console.log('test-ai-feedback-admin: OK')
