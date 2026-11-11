/**
 * Đề đăng lên cộng đồng, lưu trong bảng `community_exams` của Supabase.
 * `listed` = có hiện trong danh sách cộng đồng; đề `listed = false` là đề xuất bản cho học sinh, chỉ mở được bằng link.
 * RLS: ai cũng xem được đề `listed`; chủ đề xem, sửa, gỡ được đề của mình; học sinh mở đề theo id qua `get_shared_exam`.
 */
import type { ExamDoc } from '@/data/docTypes'
import { questionCount, totalPoints } from '@/data/types'
import { AuthError, currentSession } from '@/lib/auth'
import { docToExam } from '@/lib/docToExam'
import { apiFetch } from '@/lib/apiFetch'
import { confirmPublishWithoutKey } from '@/lib/answerKeyWarn'

const BASE = import.meta.env.VITE_SUPABASE_URL as string
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

/** Các cột đủ để vẽ thẻ đề, không kéo nội dung đề. */
export interface CommunityRow {
  id: string
  title: string
  subject: string
  grade: string
  school: string
  created_at: string
  question_count: number
  duration_minutes: number
  total_points: number
  preview: string
  listed: boolean
}

const COLUMNS =
  'id,title,subject,grade,school,created_at,question_count,duration_minutes,total_points,preview,listed'

async function rest<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string; prefer?: string } = {},
): Promise<T> {
  const res = await fetch(`${BASE}/rest/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: KEY,
      'Content-Type': 'application/json',
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const data = (await res.json().catch(() => null)) as { message?: string } | null
  if (!res.ok) throw new Error(data?.message ?? `Không kết nối được máy chủ (${res.status}).`)
  return data as T
}

/** Danh sách đề đã đăng, mới nhất trước. Chỉ lấy đề có status = published. */
export function listCommunityDocs(): Promise<CommunityRow[]> {
  return rest<CommunityRow[]>(`/community_exams?select=${COLUMNS}&listed=eq.true&status=eq.published&order=created_at.desc&limit=100`)
}

/** Các đề người đang đăng nhập đã xuất bản (cả đề công khai và đề chỉ có link), mới nhất trước. */
export async function listMyPublished(page?: { limit: number; offset: number }): Promise<CommunityRow[]> {
  const s = await currentSession()
  if (!s) return []
  const range = page ? `&limit=${page.limit}&offset=${page.offset}` : ''
  return rest<CommunityRow[]>(`/community_exams?select=${COLUMNS}&owner_id=eq.${s.user.id}&order=created_at.desc${range}`, { token: s.access_token })
}

/** Số đề đã xuất bản (chỉ tải cột id) — để chia trang mà không tải cả danh sách. */
export async function countMyPublished(): Promise<number> {
  const s = await currentSession()
  if (!s) return 0
  const ids = await rest<Array<{ id: string }>>(`/community_exams?select=id&owner_id=eq.${s.user.id}`, { token: s.access_token })
  return ids.length
}

/** Nội dung đầy đủ của một đề đã đăng (khối ExamDoc), tải khi người dùng mở đề. */
export async function getCommunityDoc(id: string): Promise<ExamDoc> {
  const doc = await rest<ExamDoc | null>('/rpc/get_shared_exam', { method: 'POST', body: { p_id: id } }).catch(() => null)
  if (!doc) throw new Error('Đề này không còn được xuất bản.')
  return doc
}

/**
 * Đăng một đề. `listed` = hiện trong danh sách cộng đồng; false = chỉ ai có link mới làm được.
 * Có `replaceId` thì cập nhật đề đã đăng đó (giữ link và bài làm của học sinh); đề đã bị gỡ thì đăng mới.
 */
export async function publishDoc(doc: ExamDoc, listed = true, replaceId?: string): Promise<CommunityRow> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập để đăng đề.')
  const exam = docToExam(doc, doc.id)
  if (!(await confirmPublishWithoutKey(exam))) throw new Error('Đã huỷ đăng đề để bổ sung đáp án.')
  const body = {
    title: doc.title,
    subject: doc.subject,
    grade: doc.grade,
    school: doc.unit,
    doc,
    question_count: questionCount(exam),
    duration_minutes: exam.durationMinutes,
    total_points: totalPoints(exam),
    preview: exam.sections[0]?.questions[0]?.prompt ?? '',
    listed,
  }
  const opts = { token: s.access_token, prefer: 'return=representation' }
  if (replaceId) {
    const [row] = await rest<CommunityRow[]>(`/community_exams?select=${COLUMNS}&id=eq.${encodeURIComponent(replaceId)}`, { ...opts, method: 'PATCH', body })
    if (row) return row
  }
  const [row] = await rest<CommunityRow[]>(`/community_exams?select=${COLUMNS}`, { ...opts, method: 'POST', body })
  return row
}

/** Đưa đề đã xuất bản lên (hoặc gỡ khỏi) danh sách cộng đồng; link vẫn dùng được. */
export async function setListed(id: string, listed: boolean): Promise<void> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập.')
  await rest(`/community_exams?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', token: s.access_token, prefer: 'return=minimal', body: { listed } })
}

/** Gỡ đề đã xuất bản. Bài làm của học sinh cho đề đó cũng bị xoá. */
export async function unpublish(id: string): Promise<void> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập.')
  await rest(`/community_exams?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', token: s.access_token, prefer: 'return=minimal' })
}

/** Đề cho học sinh mở bằng link: qua server, đề chỉ-link không kèm đáp án (xem server/exam.ts). */
export async function getStudentDoc(id: string): Promise<ExamDoc> {
  const res = await apiFetch('/api/exam', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  const data = (await res.json().catch(() => null)) as { doc?: ExamDoc; error?: string } | null
  if (!res.ok || !data?.doc) throw new Error(data?.error ?? 'Đề này không còn được xuất bản.')
  return data.doc
}

export interface ReportInput {
  examId: string
  reason: string
  detail?: string
}

/** Gửi báo cáo vi phạm đề thi. Cần đăng nhập; gửi bằng token người dùng. */
export async function submitReport(input: ReportInput): Promise<void> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập để gửi báo cáo.')
  await rest('/reports', {
    method: 'POST',
    token: s.access_token,
    prefer: 'return=minimal',
    body: {
      exam_id: input.examId,
      reporter_id: s.user.id,
      reason: input.reason.trim(),
      detail: input.detail?.trim() || null,
    },
  })
}

export interface FeedbackInput {
  message: string
  email?: string
  page?: string
}

/** Gửi góp ý ý kiến người dùng. Khách hoặc người dùng đã đăng nhập đều gửi được. */
export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const s = await currentSession()
  await rest('/feedback', {
    method: 'POST',
    token: s?.access_token,
    prefer: 'return=minimal',
    body: {
      user_id: s?.user?.id ?? null,
      email: input.email?.trim() || (s?.user?.email ?? null),
      message: input.message.trim(),
      page: input.page || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : null),
    },
  })
}
