/**
 * Nộp bài đề tương tác: server tự chấm theo đáp án trong đề đã xuất bản rồi mới ghi `exam_attempts`.
 * Trình duyệt chỉ gửi bài làm (không gửi điểm) nên không thể tự khai điểm.
 * Cần SUPABASE_SERVICE_ROLE_KEY (chỉ có ở server) vì bảng không còn cho trình duyệt ghi thẳng.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ExamDoc } from '../src/data/docTypes'
import { docToExam } from '../src/lib/docToExam.js'
import { gradableMax, scoreQuestion } from '../src/lib/grading.js'
import { clientIp, guard, isLocal, rateLimitOnly, userFromToken } from './guard.js'
import { json, readBody, safeError } from './http.js'
import { getExamRow } from './examCache.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Số lượt nộp tối đa của một tài khoản, thiết bị hoặc tên khách cho một đề. */
const ATTEMPTS_PER_STUDENT = 20
/** tổng bài nộp không đăng nhập của một đề (vài lớp × vài lượt) */
const ANON_ATTEMPTS_PER_EXAM = 400
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const rosterName = (name: string) => name.trim().normalize('NFC').toLowerCase()

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
    const submittedName = typeof body.name === 'string' ? body.name.trim() : ''
    let name = submittedName.slice(0, 60)
    if (!UUID.test(examId) || !name) return json(res, 400, { error: 'Thiếu đề hoặc tên học sinh.' })
    const answers = (body.answers && typeof body.answers === 'object' ? body.answers : {}) as Record<string, unknown>

    // chặn nộp dồn dập một đề từ một IP (60 lượt / 10 phút đủ cho cả lớp chung IP)
    if (!rateLimitOnly(req, res, `attempt-exam:${examId.toLowerCase()}`, 60)) return
    const row = await getExamRow(base, key, examId)
    if (!row?.doc) return json(res, 404, { error: 'Không tìm thấy đề.' })

    const exam = docToExam(row.doc, examId)
    let seat = Number(body.seat)
    const roster = exam.settings?.roster
    if (roster?.length) {
      const normalized = rosterName(submittedName)
      const matches = (entry: unknown) => typeof entry === 'string' && rosterName(entry) === normalized
      const index = Number.isInteger(seat) && seat > 0 && matches(roster[seat - 1]) ? seat - 1 : roster.findIndex(matches)
      if (index < 0) return json(res, 400, { error: 'Tên không có trong danh sách lớp.' })
      name = roster[index]
      seat = index + 1
    }
    const device = str(body.deviceId, 64)
    const userId = await userFromToken(req)
    // đề "chỉ làm một lần": chỉ tài khoản là danh tính tin được (mã thiết bị trình duyệt tự đặt, đổi là xong).
    // Bắt đăng nhập, rồi giữ chỗ nguyên tử trong DB TRƯỚC khi chấm: khoá chính (exam_id, user_id) nên hai lượt
    // song song chỉ một lượt qua. Lỗi khác trùng khoá → từ chối (không bao giờ coi là "chưa nộp").
    let locked = false
    if (exam.settings?.oneAttempt) {
      if (!userId) return json(res, 401, { error: 'Đề này chỉ làm một lần, em cần đăng nhập để nộp bài.', loginRequired: true })
      const lock = await fetch(`${base}/rest/v1/exam_attempt_locks`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ exam_id: examId, user_id: userId }),
      })
      if (lock.status === 409) return json(res, 409, { error: 'Em đã nộp bài cho đề này rồi.' })
      if (!lock.ok) return json(res, 503, { error: 'Máy chủ bận, em nộp lại sau ít phút.' })
      locked = true
    }
    // trần số bài mỗi đề (Strix 7: không trần thì ai có link cũng bơm được hàng nghìn "học sinh" giả vào sổ điểm).
    // Trần chính tính theo cả đề; tài khoản, thiết bị hoặc tên khách có thêm trần riêng.
    if (!locked) {
      const count = async (filter: string) => {
        const r = await fetch(`${base}/rest/v1/exam_attempts?select=exam_id&exam_id=eq.${examId}${filter}`, {
          method: 'HEAD',
          headers: { ...headers, Prefer: 'count=exact' },
        }).catch(() => null)
        const n = Number(r?.headers.get('content-range')?.split('/')[1])
        return Number.isFinite(n) ? n : null
      }
      const [mine, total] = await Promise.all([
        userId
          ? count(`&user_id=eq.${userId}`)
          : device.length >= 8
            ? count(`&user_id=is.null&device_id=eq.${encodeURIComponent(device)}`)
            : count(`&user_id=is.null&student_name=eq.${encodeURIComponent(name)}`),
        userId ? Promise.resolve(0) : count('&user_id=is.null'),
      ])
      if (mine === null || total === null) return json(res, 503, { error: 'Máy chủ bận, em nộp lại sau ít phút.' })
      if (mine >= ATTEMPTS_PER_STUDENT) return json(res, 429, { error: 'Em đã nộp bài này nhiều lần rồi.' })
      if (total >= ANON_ATTEMPTS_PER_EXAM) return json(res, 429, { error: 'Đề đã nhận đủ số bài nộp không đăng nhập, em đăng nhập để nộp.', loginRequired: true })
    }
    const unlock = () =>
      locked
        ? fetch(`${base}/rest/v1/exam_attempt_locks?exam_id=eq.${examId}&user_id=eq.${userId}`, { method: 'DELETE', headers }).catch(() => undefined)
        : undefined
    const questions = exam.sections.flatMap((s) => s.questions)
    let score = 0
    let correct = 0
    // đáp án vốn đã công khai (đề cộng đồng, hoặc "hiện đúng/sai ngay" — api/exam trả kèm đáp án): trả đủ.
    // Đề link giấu đáp án: mọi phản hồi sau khi nộp đều là máy dò, vì nộp được nhiều lần:
    // - theo từng câu (đáp án / đúng-sai): mỗi lượt thử song song mọi câu, vài lượt ra cả đề;
    // - điểm tổng / số câu đúng: mỗi lượt chỉ làm một câu, bỏ trống phần còn lại → điểm 0 hay >0 là đúng/sai
    //   (Strix đo: đề 10 câu ra hết đáp án sau 22 lượt, không cần tài khoản).
    // Nên đề giấu đáp án chỉ báo "đã nộp"; điểm lưu cho giáo viên. Giáo viên tự bật `showScore` nếu chấp nhận
    // rủi ro đó, hoặc bật "hiện đáp án ngay" (khi ấy đáp án vốn công khai).
    const fullKey = row.listed || exam.settings?.instantFeedback
    const revealScore = fullKey || exam.settings?.showScore === true
    const answerKey: Record<string, { answer?: string; explanation?: string; solution?: string[] }> = {}
    for (const q of questions) {
      const given = answers[q.id]
      const text = typeof given === 'string' ? given.slice(0, 200) : undefined
      const got = scoreQuestion(q, text)
      score += got
      if (q.points > 0 && got >= q.points) correct++
      if (fullKey && (q.answer || q.explanation || q.solution)) answerKey[q.id] = { answer: q.answer, explanation: q.explanation, solution: q.solution }
    }
    score = Math.round(score * 1000) / 1000
    const max = Math.round(questions.reduce((n, q) => n + q.points, 0) * 1000) / 1000

    const ins = await fetch(`${base}/rest/v1/exam_attempts`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        exam_id: examId,
        user_id: userId,
        student_name: name,
        score,
        max_score: max,
        duration_seconds: Math.max(0, Math.min(86400, Math.round(Number(body.seconds) || 0))),
        device_id: device.length >= 8 ? device : null,
        class_name: str(body.className, 30) || null,
        seat_no: Number.isInteger(seat) && seat >= 1 && seat <= 999 ? seat : null,
      }),
    }).catch(() => null)
    if (!ins?.ok) {
      await unlock()
      return json(res, 502, { error: 'Không lưu được bài làm.' })
    }
    // đề link gửi cho học sinh không kèm đáp án (api/exam): nộp xong mới trả điểm và đáp án để xem lại bài
    // gradable: tổng điểm các câu chấm được (có đáp án) — học sinh xem điểm trên thang này,
    // max_score lưu cho giáo viên vẫn là tổng điểm cả đề (giáo viên còn chấm tay câu tự luận)
    if (!revealScore) return json(res, 200, { submitted: true, hidden: true })
    return json(res, 200, { score, max, gradable: gradableMax(questions), correct, key: answerKey })
  } catch (err) {
    return json(res, 400, { error: safeError(err, isLocal(clientIp(req)), 'Dữ liệu không hợp lệ.') })
  }
}

export function attemptMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleAttemptRequest(req, res).catch((err: unknown) => json(res, 500, { error: safeError(err, isLocal(clientIp(req))) }))
}
