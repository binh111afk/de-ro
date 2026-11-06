/**
 * Bài làm của học sinh trên đề đã xuất bản (bảng `exam_attempts`). Ai mở link cũng nộp được, kể cả chưa đăng nhập;
 * chỉ chủ đề đọc được. `summarize` gom các lượt làm thành thống kê cho thẻ báo cáo.
 */
import { currentSession } from '@/lib/auth'
import { rest } from '@/lib/documents'
import { apiFetch } from '@/lib/apiFetch'

export interface Attempt {
  id: string
  exam_id: string
  user_id: string | null
  student_name: string
  score: number
  max_score: number
  duration_seconds: number
  created_at: string
  device_id?: string | null
  class_name?: string | null
  seat_no?: number | null
}

const COLUMNS = 'id,exam_id,user_id,student_name,score,max_score,duration_seconds,created_at,device_id,class_name,seat_no'
const OLD_COLUMNS = 'id,exam_id,user_id,student_name,score,max_score,duration_seconds,created_at'

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* trình duyệt chặn lưu: lần sau hỏi lại */
  }
}

/** Id ngẫu nhiên của thiết bị, sinh một lần rồi giữ trong localStorage. Gom bài của một học sinh và chặn làm lại. */
export function deviceId(): string {
  let id = read('dethinhbien-device')
  if (!id) {
    id = crypto.randomUUID()
    write('dethinhbien-device', id)
  }
  return id
}

export interface StudentInfo {
  name: string
  className: string
  seat?: number
}

/** Thông tin học sinh nhập lần trước trên máy này (điền sẵn cho đề sau). */
export function loadStudent(): StudentInfo | null {
  try {
    const v = JSON.parse(read('dethinhbien-student') ?? 'null') as StudentInfo | null
    if (v?.name) return v
  } catch {
    /* bỏ bản hỏng */
  }
  const name = read('dethinhbien-student-name')
  return name ? { name, className: '' } : null
}
export const saveStudent = (s: StudentInfo) => write('dethinhbien-student', JSON.stringify(s))

/** Trước khi làm: đề có ở cộng đồng không, máy này đã nộp bài chưa. Máy chủ chưa có hàm thì coi như đề chỉ-link, chưa nộp. */
export async function examGate(examId: string): Promise<{ listed: boolean; attempted: boolean }> {
  return rest<{ listed: boolean; attempted: boolean } | null>('/rpc/exam_gate', {
    method: 'POST',
    token: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    body: { p_id: examId, p_device: deviceId() },
  })
    .then((r) => r ?? { listed: false, attempted: false })
    .catch(() => ({ listed: false, attempted: false }))
}

/** Id đề trên máy chủ là uuid; đề mẫu và đề làm ở máy thì không có bài làm nào để gửi. */
export const isRemoteExamId = (id: string | undefined): id is string =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))

/** Nộp bài: gửi bài làm (không gửi điểm), server tự chấm theo đáp án của đề rồi lưu. Có phiên đăng nhập thì gắn vào tài khoản. */
export interface GradeResult { score: number; max: number; key: Record<string, { answer?: string; explanation?: string }> }

export async function submitAttempt(a: { examId: string; name: string; answers: Record<string, string>; seconds: number; className?: string; seat?: number }): Promise<GradeResult> {
  const res = await apiFetch('/api/attempt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examId: a.examId,
      name: a.name.trim().slice(0, 60),
      answers: a.answers,
      seconds: Math.max(0, Math.round(a.seconds)),
      deviceId: deviceId(),
      className: a.className?.trim().slice(0, 30) || undefined,
      seat: a.seat,
    }),
  })
  if (!res.ok) throw new Error(`Nộp bài lỗi ${res.status}`)
  return (await res.json()) as GradeResult
}

/** Bài làm của các đề của bạn, mới nhất trước. */
export async function listAttempts(examIds: string[]): Promise<Attempt[]> {
  const s = await currentSession()
  if (!s || !examIds.length) return []
  const q = (cols: string) => rest<Attempt[]>(`/exam_attempts?exam_id=in.(${examIds.join(',')})&select=${cols}&order=created_at.desc&limit=3000`, { token: s.access_token })
  return q(COLUMNS).catch(() => q(OLD_COLUMNS))
}

export interface Student {
  name: string
  className?: string
  seat?: number
  /** điểm cao nhất và thang của lần đó */
  best: number
  max: number
  attempts: number
  /** thời gian làm của lần điểm cao nhất (giây) */
  seconds: number
  lastAt: string
}

export interface ExamStats {
  attempts: number
  /** mỗi người một dòng, xếp theo điểm cao nhất (bằng điểm thì ai nhanh hơn xếp trên) */
  students: Student[]
  top: Student[]
  /** điểm trung bình của điểm cao nhất mỗi người, quy về thang 10 */
  avg: number
  /** số người theo mức: dưới 5 · 5–dưới 6,5 · 6,5–dưới 8 · từ 8 */
  bands: [number, number, number, number]
}

const ten = (s: Student) => (s.max > 0 ? (s.best / s.max) * 10 : 0)

export function summarize(list: Attempt[]): ExamStats {
  // `list` mới nhất trước: lần đầu gặp một người cũng là lần mới nhất của họ
  const by = new Map<string, Student & { pct: number }>()
  for (const a of list) {
    // một thiết bị = một học sinh; bài cũ không có id thiết bị thì gom theo tài khoản hoặc tên
    const key = a.device_id ? `d:${a.device_id}` : a.user_id ?? `n:${a.student_name.trim().toLowerCase()}`
    const pct = a.max_score > 0 ? a.score / a.max_score : 0
    const cur = by.get(key)
    if (!cur) {
      by.set(key, { name: a.student_name.trim(), className: a.class_name ?? undefined, seat: a.seat_no ?? undefined, best: a.score, max: a.max_score, attempts: 1, seconds: a.duration_seconds, lastAt: a.created_at, pct })
    } else {
      cur.attempts++
      if (pct > cur.pct || (pct === cur.pct && a.duration_seconds < cur.seconds)) {
        cur.best = a.score
        cur.max = a.max_score
        cur.seconds = a.duration_seconds
        cur.pct = pct
      }
    }
  }
  const students = [...by.values()].sort((x, y) => y.pct - x.pct || x.seconds - y.seconds).map(({ pct: _p, ...s }) => s)
  const bands: ExamStats['bands'] = [0, 0, 0, 0]
  for (const s of students) bands[ten(s) < 5 ? 0 : ten(s) < 6.5 ? 1 : ten(s) < 8 ? 2 : 3]++
  return {
    attempts: list.length,
    students,
    top: students.slice(0, 3),
    avg: students.length ? students.reduce((n, s) => n + ten(s), 0) / students.length : 0,
    bands,
  }
}
