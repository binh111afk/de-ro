/**
 * Học sinh mở đề bằng link: đề chỉ-link (không ở cộng đồng) được trả về KHÔNG kèm đáp án và lời giải,
 * nộp bài xong `api/attempt` mới trả điểm và đáp án. Đề cộng đồng giữ đáp án để dùng lại, bỏ danh sách lớp.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ExamDoc } from '../src/data/docTypes'
import { docToExam } from '../src/lib/docToExam.js'
import { clientIp, guard, isLocal } from './guard.js'
import { json, readBody, safeError } from './http.js'
import { getExamRow } from './examCache.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** mã link ngắn /d/<mã> (migration 20261224) */
const CODE = /^[23456789a-hjkmnp-z]{6}$/
/** số lần gõ sai mã mỗi IP trong 10 phút: đủ cho gõ nhầm, không đủ để dò */
const CODE_MISSES = 30
const misses = new Map<string, { count: number; reset: number }>()

export async function handleExamRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'exam'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!base || !key) return json(res, 503, { error: 'Máy chủ chưa cấu hình.' })
  try {
    const body = JSON.parse(await readBody(req, 4096)) as { id?: unknown; code?: unknown }
    let id = body.id
    if (body.code !== undefined) {
      const code = typeof body.code === 'string' ? body.code.toLowerCase() : ''
      const ip = clientIp(req)
      const miss = misses.get(ip)
      const fresh = !miss || miss.reset <= Date.now()
      if (!fresh && miss.count >= CODE_MISSES) return json(res, 429, { error: 'Nhập sai mã đề nhiều lần, thử lại sau ít phút.' })
      let found: string | undefined
      if (CODE.test(code)) {
        const r = await fetch(`${base}/rest/v1/community_exams?code=eq.${code}&select=id&status=eq.published`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
        if (!r.ok) return json(res, 503, { error: 'Máy chủ bận, thử lại sau ít phút.' })
        found = ((await r.json()) as Array<{ id: string }>)[0]?.id
      }
      if (!found) {
        if (misses.size > 5000) misses.clear()
        misses.set(ip, fresh ? { count: 1, reset: Date.now() + 10 * 60 * 1000 } : { ...miss, count: miss.count + 1 })
        return json(res, 404, { error: 'Đề này không còn được xuất bản.' })
      }
      id = found
    }
    if (typeof id !== 'string' || !UUID.test(id)) return json(res, 400, { error: 'Link đề không hợp lệ.' })
    const row = await getExamRow(base, key, id)
    if (!row?.doc) return json(res, 404, { error: 'Đề này không còn được xuất bản.' })
    if (row.listed) {
      const { online } = row.doc
      if (!online?.settings) return json(res, 200, { id, doc: row.doc })
      const settings = { ...online.settings }
      delete settings.roster
      return json(res, 200, { id, doc: { ...row.doc, online: { ...online, settings } } })
    }
    const exam = docToExam(row.doc, id)
    // giáo viên bật "hiện đúng/sai ngay khi chọn" thì trình duyệt cần đáp án: giữ nguyên
    if (exam.settings?.instantFeedback) return json(res, 200, { id, doc: row.doc })
    const online = {
      ...exam,
      sections: exam.sections.map((sec) => ({
        ...sec,
        // chỉ giữ các trường học sinh được thấy (danh sách cho phép, không phải danh sách cấm):
        // trường đáp án mới (như `solution` của tự luận) không thể lọt ra vì quên bỏ
        questions: sec.questions.map(({ id: qid, number, type, prompt, align, image, options, points }) => ({ id: qid, number, type, prompt, align, image, options, points })),
      })),
    }
    return json(res, 200, { id, doc: { ...row.doc, blocks: [], online }, hidden: true })
  } catch (err) {
    return json(res, 400, { error: safeError(err, isLocal(clientIp(req)), 'Dữ liệu không hợp lệ.') })
  }
}

export function examMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleExamRequest(req, res).catch((err: unknown) => json(res, 500, { error: safeError(err, isLocal(clientIp(req))) }))
}
