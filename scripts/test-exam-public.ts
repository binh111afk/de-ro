import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import type { ExamDoc } from '../src/data/docTypes'
import { defaultMeta, itemToDoc, newQuestion } from '../src/lib/onlineExam'
import { handleExamRequest } from '../server/exam'

process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const listedId = '11111111-1111-4111-8111-111111111111'
const linkId = '22222222-2222-4222-8222-222222222222'
const instantId = '33333333-3333-4333-8333-333333333333'
const date = '2026-10-29T00:00:00.000Z'
const roster = ['Học sinh A', 'Học sinh B']
const doc = itemToDoc({
  id: 'online',
  status: 'done',
  meta: defaultMeta(),
  questions: [{
    ...newQuestion('tu-luan', 'Tính 2 + 2'),
    answer: '4',
    explanation: 'Cộng hai số',
    solution: ['2 + 2 = 4'],
  }],
  settings: { roster, noTimeLimit: true },
  createdAt: date,
  updatedAt: date,
})
assert.ok(doc.online)
const instantDoc = { ...doc, online: { ...doc.online, settings: { ...doc.online.settings, instantFeedback: true } } }

globalThis.fetch = async (input) => {
  const url = new URL(String(input))
  assert.equal(url.pathname, '/rest/v1/community_exams')
  const id = url.searchParams.get('id')
  return Response.json([{ doc: id === `eq.${instantId}` ? instantDoc : doc, listed: id === `eq.${listedId}` }])
}

async function open(id: string): Promise<{ doc: ExamDoc; hidden?: boolean }> {
  const req = Object.assign(Readable.from([Buffer.from(JSON.stringify({ id }))]), {
    method: 'POST',
    headers: { host: 'localhost' },
    socket: { remoteAddress: '127.0.0.1' },
  }) as unknown as IncomingMessage
  let status = 0
  let body = ''
  const res = {
    writeHead(code: number) { status = code },
    end(payload: string) { body = payload },
  } as unknown as ServerResponse
  await handleExamRequest(req, res)
  assert.equal(status, 200, body)
  return JSON.parse(body)
}

const listed = await open(listedId)
assert.deepEqual(listed.doc.online?.settings, { noTimeLimit: true })
assert.deepEqual(listed.doc.online?.sections, doc.online.sections)

const link = await open(linkId)
assert.equal(link.hidden, true)
assert.deepEqual(link.doc.online?.settings, { roster, noTimeLimit: true })
assert.deepEqual(link.doc.blocks, [])
const question = link.doc.online?.sections[0]?.questions[0]
assert.ok(question)
assert.equal(question.prompt, 'Tính 2 + 2')
for (const key of ['answer', 'explanation', 'solution']) assert.ok(!(key in question), key)

const instant = await open(instantId)
assert.deepEqual(instant, { doc: instantDoc })
console.log('Đề cộng đồng, đề chỉ-link và chế độ phản hồi tức thì đều đạt.')
