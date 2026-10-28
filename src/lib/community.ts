/**
 * Đề đăng lên cộng đồng, lưu trong bảng `community_exams` của Supabase.
 * RLS: ai cũng đọc được; chỉ người đăng (đã đăng nhập) mới thêm được đề của mình.
 */
import type { ExamDoc } from '@/data/docTypes'
import { questionCount, totalPoints } from '@/data/types'
import { AuthError, currentSession } from '@/lib/auth'
import { docToExam } from '@/lib/docToExam'

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
}

const COLUMNS =
  'id,title,subject,grade,school,created_at,question_count,duration_minutes,total_points,preview'

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

/** Danh sách đề đã đăng, mới nhất trước. */
export function listCommunityDocs(): Promise<CommunityRow[]> {
  return rest<CommunityRow[]>(`/community_exams?select=${COLUMNS}&order=created_at.desc&limit=100`)
}

/** Nội dung đầy đủ của một đề đã đăng (khối ExamDoc), tải khi người dùng mở đề. */
export async function getCommunityDoc(id: string): Promise<ExamDoc> {
  const [row] = await rest<{ doc: ExamDoc }[]>(`/community_exams?select=doc&id=eq.${encodeURIComponent(id)}`)
  if (!row) throw new Error('Đề này không còn trên cộng đồng.')
  return row.doc
}

/** Đăng một đề. `owner_id` tự điền từ phiên đăng nhập (auth.uid()). */
export async function publishDoc(doc: ExamDoc): Promise<CommunityRow> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập để đăng đề.')
  const exam = docToExam(doc, doc.id)
  const [row] = await rest<CommunityRow[]>(`/community_exams?select=${COLUMNS}`, {
    method: 'POST',
    token: s.access_token,
    prefer: 'return=representation',
    body: {
      title: doc.title,
      subject: doc.subject,
      grade: doc.grade,
      school: doc.unit,
      doc,
      question_count: questionCount(exam),
      duration_minutes: exam.durationMinutes,
      total_points: totalPoints(exam),
      preview: exam.sections[0]?.questions[0]?.prompt ?? '',
    },
  })
  return row
}
