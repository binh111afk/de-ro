import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { defaultMeta, itemToDoc, newQuestion } from '../src/lib/onlineExam'
import { handleAttemptRequest } from '../server/attempt'

process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const rosterId = '11111111-1111-4111-8111-111111111111'
const openId = '22222222-2222-4222-8222-222222222222'
const date = '2026-10-29T00:00:00.000Z'
const roster = ['Nguyễn An', 'Trần Bình', 'Nguyễn An']
const makeDoc = (names: string[]) => itemToDoc({
  id: 'online',
  status: 'done',
  meta: defaultMeta(),
  questions: [newQuestion('tu-luan', 'Tính 2 + 2')],
  settings: { roster: names },
  createdAt: date,
  updatedAt: date,
})

const inserts: Record<string, unknown>[] = []
const filters: URLSearchParams[] = []
let ownCount = 0
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input))
  if (url.pathname === '/rest/v1/community_exams') {
    return Response.json([{ doc: makeDoc(url.searchParams.get('id') === 'eq.' + rosterId ? roster : []), listed: false }])
  }
  assert.equal(url.pathname, '/rest/v1/exam_attempts')
  if (init?.method === 'HEAD') {
    filters.push(url.searchParams)
    const mine = url.searchParams.has('student_name') || url.searchParams.has('device_id')
    return new Response(null, { headers: { 'content-range': '*/' + (mine ? ownCount : 0) } })
  }
  assert.equal(init?.method, 'POST')
  inserts.push(JSON.parse(String(init?.body)))
  return new Response(null, { status: 201 })
}

async function submit(body: Record<string, unknown>) {
  const req = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    method: 'POST',
    headers: { host: 'localhost' },
    socket: { remoteAddress: '127.0.0.1' },
  }) as unknown as IncomingMessage
  let status = 0
  let payload = ''
  const res = {
    writeHead(code: number) { status = code },
    end(value: string) { payload = value },
  } as unknown as ServerResponse
  await handleAttemptRequest(req, res)
  return { status, body: JSON.parse(payload) }
}

const unknown = await submit({ examId: rosterId, name: 'Tên ngoài danh sách', seat: 1 })
assert.deepEqual(unknown, { status: 400, body: { error: 'Tên không có trong danh sách lớp.' } })
assert.equal(filters.length, 0)
assert.equal(inserts.length, 0)

const spelling = '  ' + roster[0].toUpperCase().normalize('NFD') + '  '
assert.equal((await submit({ examId: rosterId, name: spelling, seat: 2 })).status, 200)
assert.equal(inserts.at(-1)?.student_name, roster[0])
assert.equal(inserts.at(-1)?.seat_no, 1)
assert.equal(inserts.at(-1)?.device_id, null)
const byName = filters.find((f) => f.has('student_name'))
assert.equal(byName?.get('student_name'), 'eq.' + roster[0])
assert.equal(byName?.get('exam_id'), 'eq.' + rosterId)
assert.equal(byName?.get('user_id'), 'is.null')

assert.equal((await submit({ examId: rosterId, name: roster[0], seat: 3, deviceId: 'device-123' })).status, 200)
assert.equal(inserts.at(-1)?.seat_no, 3)
assert.ok(filters.some((f) => f.get('device_id') === 'eq.device-123' && !f.has('student_name')))

assert.equal((await submit({ examId: openId, name: '  Họ, tên & lớp  ', seat: 42 })).status, 200)
assert.equal(inserts.at(-1)?.student_name, 'Họ, tên & lớp')
assert.equal(inserts.at(-1)?.seat_no, 42)
assert.ok(filters.some((f) => f.get('student_name') === 'eq.Họ, tên & lớp' && f.get('exam_id') === 'eq.' + openId))

ownCount = 20
for (const deviceId of [undefined, 'short']) {
  assert.equal((await submit({ examId: rosterId, name: spelling, deviceId })).status, 429)
}
assert.equal(inserts.length, 3)
console.log('✅ Nộp bài kiểm tra danh sách lớp, số báo danh và trần lượt theo tên hoặc thiết bị')

