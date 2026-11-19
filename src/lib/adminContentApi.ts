/**
 * Client trang Admin giai đoạn 3 (Nội dung). Xem docs/prompt-admin-content.md.
 * Gọi server bằng `post(action, body, read)` từ './adminApi'; dữ liệu giả khi `isAdminMock()` (dùng `wait`).
 */
import { isAdminMock, post } from './adminApi'

export interface ContentExam {
  id: string
  ownerId: string | null
  ownerEmail: string | null
  title: string
  subject: string
  grade: string
  school: string
  createdAt: string
  questionCount: number
  durationMinutes: number
  totalPoints: number
  preview: string
  listed: boolean
  status: 'published' | 'hidden' | 'removed'
  removedReason: string | null
  moderatedBy: string | null
  moderatedAt: string | null
  openReports: number
}

export interface ContentExamPage {
  exams: ContentExam[]
  total: number
  page: number
  perPage: number
}

export interface ContentReport {
  id: number
  examId: string
  examTitle: string
  reporterId: string | null
  reporterEmail: string | null
  reason: string
  detail: string | null
  status: 'open' | 'resolved' | 'dismissed'
  createdAt: string
  resolvedBy: string | null
  resolvedAt: string | null
}

export interface ContentReportPage {
  reports: ContentReport[]
  total: number
  page: number
  perPage: number
}

export interface ContentDoc {
  id: string
  ownerId: string
  ownerEmail: string
  name: string
  mime: string
  size: number
  url: string
  createdAt: string
  subject: string | null
}

export interface ContentTopUserStorage {
  ownerId: string
  email: string
  name: string
  totalSize: number
  docCount: number
}

export interface ContentDocPage {
  docs: ContentDoc[]
  total: number
  page: number
  perPage: number
  topUsers: ContentTopUserStorage[]
}

export interface ContentFeedback {
  id: number
  userId: string | null
  email: string | null
  message: string
  page: string | null
  createdAt: string
  read: boolean
}

export interface ContentFeedbackPage {
  feedback: ContentFeedback[]
  total: number
  page: number
  perPage: number
}

export const CONTENT_AUDIT_LABELS: Record<string, string> = {
  'content.exams.setStatus': 'Đổi trạng thái đề',
  'content.exams.delete': 'Xoá hẳn đề',
  'content.reports.resolve': 'Xử lý báo cáo',
  'content.docs.delete': 'Xoá tài liệu',
  'content.feedback.markRead': 'Đánh dấu góp ý',
}

// ==================== API CLIENT FUNCTIONS ====================

export async function listContentExams(opts: {
  q?: string
  status?: string
  subject?: string
  page?: number
  perPage?: number
} = {}): Promise<ContentExamPage> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockListContentExams(opts)
  return post('content.exams.list', opts)
}

export async function getContentExam(examId: string): Promise<{ exam: any }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockGetContentExam(examId)
  return post('content.exams.get', { examId })
}

export async function setContentExamStatus(
  examId: string,
  status: 'published' | 'hidden' | 'removed',
  reason?: string,
): Promise<{ ok: boolean }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockSetContentExamStatus(examId, status, reason)
  return post('content.exams.setStatus', { examId, status, reason }, false)
}

export async function deleteContentExam(examId: string): Promise<{ ok: boolean }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockDeleteContentExam(examId)
  return post('content.exams.delete', { examId }, false)
}

export async function listContentReports(opts: {
  status?: string
  page?: number
  perPage?: number
} = {}): Promise<ContentReportPage> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockListContentReports(opts)
  return post('content.reports.list', opts)
}

export async function resolveContentReport(
  reportId: number,
  status: 'resolved' | 'dismissed',
): Promise<{ ok: boolean }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockResolveContentReport(reportId, status)
  return post('content.reports.resolve', { reportId, status }, false)
}

export async function listContentDocs(opts: {
  q?: string
  page?: number
  perPage?: number
} = {}): Promise<ContentDocPage> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockListContentDocs(opts)
  return post('content.docs.list', opts)
}

export async function deleteContentDoc(docId: string): Promise<{ ok: boolean; r2Removed: boolean }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockDeleteContentDoc(docId)
  return post('content.docs.delete', { docId }, false)
}

export async function listContentFeedback(opts: {
  read?: boolean
  page?: number
  perPage?: number
} = {}): Promise<ContentFeedbackPage> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockListContentFeedback(opts)
  return post('content.feedback.list', opts)
}

export async function markContentFeedbackRead(
  feedbackId: number,
  read = true,
): Promise<{ ok: boolean }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminContentMock')).mockMarkContentFeedbackRead(feedbackId, read)
  return post('content.feedback.markRead', { feedbackId, read }, false)
}
