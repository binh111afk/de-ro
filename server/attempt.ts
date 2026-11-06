/**
 * Nộp bài đề tương tác: server tự chấm theo đáp án trong đề đã xuất bản rồi mới ghi `exam_attempts`.
 * Trình duyệt chỉ gửi bài làm (không gửi điểm) nên không thể tự khai điểm.
 * Cần SUPABASE_SERVICE_ROLE_KEY (chỉ có ở server) vì bảng không còn cho trình duyệt ghi thẳng.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ExamDoc } from '../src/data/docTypes'
import { docToExam } from '../src/lib/docToExam.js'
import { scoreQuestion } from '../src/lib/grading.js'
import { guard, userFromToken } from './guard.js'
import { json, readBody } from './http.js'
import { getExamRow } from './examCache.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function handleAttemptRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'attempt'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!base || !key) return json(res, 503, { error: 'Máy chủ chưa cấu hình nộp bài.' })
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

  try {
    const body = JSON.parse(await readBody(req, 256 * 1024)) as Record<string, unknown>
    const examId = str(body.examId, 40)
    const name = str(body.name, 60)
    if (!UUID.test(examId) || !name) return json(res, 400, { error: 'Thiếu đề hoặc tên học sinh.' })
    const answers = (body.answers && typeof body.answers === 'object' ? body.answers : {}) as Record<string, unknown>

    const row = await getExamRow(base, key, examId)
    if (!row?.doc) return json(res, 404, { error: 'Không tìm thấy đề.' })

    const exam = docToExam(row.doc, examId)
    const seat = Number(body.seat)
    const device = str(body.deviceId, 64)
    // đề "chỉ làm một lần": máy này đã nộp thì từ chối (trước đây chỉ chặn ở trình duyệt)
    if (exam.settings?.oneAttempt) {
      if (device.length < 8) return json(res, 400, { error: 'Thiếu mã thiết bị.' })
      const dup = await fetch(`${base}/rest/v1/exam_attempts?exam_id=eq.${examId}&device_id=eq.${encodeURIComponent(device)}&select=id&limit=1`, { headers })
      if (dup.ok && ((await dup.json()) as unknown[]).length) return json(res, 409, { error: 'Em đã nộp bài cho đề này rồi.' })
    }
    const questions = exam.sections.flatMap((s) => s.questions)
    let score = 0
    // đề cộng đồng / chỉ làm một lần / hiện đáp án ngay: trả đủ đáp án để xem lại bài.
    // đề link làm nhiều lần: chỉ trả đáp án những câu đã làm đúng trọn (nộp bài trống không dò được đáp án)
    const fullKey = row.listed || exam.settings?.oneAttempt || exam.settings?.instantFeedback
    const answerKey: Record<string, { answer?: string; explanation?: string; solution?: string[] }> = {}
    for (const q of questions) {
      const given = answers[q.id]
      const got = scoreQuestion(q, typeof given === 'string' ? given.slice(0, 200) : undefined)
      score += got
      if (fullKey) {
        if (q.answer || q.explanation || q.solution) answerKey[q.id] = { answer: q.answer, explanation: q.explanation, solution: q.solution }
      } else if (q.points > 0 && got >= q.points) answerKey[q.id] = { answer: q.answer, explanation: q.explanation }
    }
    score = Math.round(score * 1000) / 1000
    const max = Math.round(questions.reduce((n, q) => n + q.points, 0) * 1000) / 1000

    const ins = await fetch(`${base}/rest/v1/exam_attempts`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        exam_id: examId,
        user_id: await userFromToken(req),
        student_name: name,
        score,
        max_score: max,
        duration_seconds: Math.max(0, Math.min(86400, Math.round(Number(body.seconds) || 0))),
        device_id: device.length >= 8 ? device : null,
        class_name: str(body.className, 30) || null,
        seat_no: Number.isInteger(seat) && seat >= 1 && seat <= 999 ? seat : null,
      }),
    })
    if (!ins.ok) return json(res, 502, { error: 'Không lưu được bài làm.' })
    // đề link gửi cho học sinh không kèm đáp án (api/exam): nộp xong mới trả điểm và đáp án để xem lại bài
    return json(res, 200, { score, max, key: answerKey })
  } catch (err) {
    return json(res, 400, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function attemptMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleAttemptRequest(req, res).catch((err: unknown) => json(res, 500, { error: String(err) }))
}
