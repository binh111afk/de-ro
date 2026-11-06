/**
 * Học sinh mở đề bằng link: đề chỉ-link (không ở cộng đồng) được trả về KHÔNG kèm đáp án và lời giải,
 * nộp bài xong `api/attempt` mới trả điểm và đáp án. Đề ở cộng đồng trả nguyên (giáo viên khác cần đáp án để dùng lại).
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ExamDoc } from '../src/data/docTypes'
import { docToExam } from '../src/lib/docToExam.js'
import { guard } from './guard.js'
import { json, readBody } from './http.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function handleExamRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'exam'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!base || !key) return json(res, 503, { error: 'Máy chủ chưa cấu hình.' })
  try {
    const { id } = JSON.parse(await readBody(req, 4096)) as { id?: unknown }
    if (typeof id !== 'string' || !UUID.test(id)) return json(res, 400, { error: 'Link đề không hợp lệ.' })
    const r = await fetch(`${base}/rest/v1/community_exams?id=eq.${id}&select=doc,listed`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    const [row] = r.ok ? ((await r.json()) as Array<{ doc: ExamDoc; listed: boolean }>) : []
    if (!row?.doc) return json(res, 404, { error: 'Đề này không còn được xuất bản.' })
    if (row.listed) return json(res, 200, { doc: row.doc })
    const exam = docToExam(row.doc, id)
    const online = {
      ...exam,
      sections: exam.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map(({ answer: _a, explanation: _e, ...q }) => q),
      })),
    }
    return json(res, 200, { doc: { ...row.doc, blocks: [], online }, hidden: true })
  } catch (err) {
    return json(res, 400, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function examMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleExamRequest(req, res).catch((err: unknown) => json(res, 500, { error: String(err) }))
}
