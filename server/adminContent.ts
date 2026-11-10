/**
 * Admin giai đoạn 3 (Nội dung): các action của /api/admin. Xem docs/prompt-admin-content.md.
 * Đã được gộp vào ACTIONS trong server/admin.ts.
 * Helper dùng chung import từ './admin.js': call, audit, HttpError, str, needUser, protectTarget.
 * KHÔNG gọi các helper đó ở top-level (admin.ts và file này import vòng nhau; chỉ dùng trong `run`).
 */
import type { ActionMap, AdminCtx } from './admin.js'
import { audit, call, HttpError, str } from './admin.js'
import { deleteR2Object, r2KeyFromUrl } from './r2.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function needUuid(v: unknown, msg = 'Thiếu hoặc sai mã định danh.'): string {
  if (typeof v !== 'string' || !UUID.test(v)) throw new HttpError(400, msg)
  return v
}

interface ExamDbRow {
  id: string
  owner_id: string | null
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
  status: 'published' | 'hidden' | 'removed'
  removed_reason: string | null
  moderated_by: string | null
  moderated_at: string | null
}

interface ReportDbRow {
  id: number
  exam_id: string
  reporter_id: string | null
  reason: string
  detail: string | null
  status: 'open' | 'resolved' | 'dismissed'
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
  community_exams?: { title?: string } | null
  exam_title?: string
}

interface DocDbRow {
  id: string
  owner_id: string
  name: string
  mime: string
  size: number
  url: string
  created_at: string
  subject: string | null
}

interface FeedbackDbRow {
  id: number
  user_id: string | null
  email: string | null
  message: string
  page: string | null
  created_at: string
  read: boolean
}

function parseTotal(res: Response, fallback: number): number {
  const range = res.headers.get('content-range')
  if (range) {
    const m = /\/(\d+)$/.exec(range)
    if (m) return Number(m[1])
  }
  const totalHdr = res.headers.get('x-total-count')
  if (totalHdr) return Number(totalHdr)
  return fallback
}

export const CONTENT_ACTIONS: ActionMap = {
  /**
   * Danh sách đề cộng đồng (moderator/admin):
   * Lọc tiêu đề (q), môn (subject), trạng thái (status).
   * Kèm email người đăng và số báo cáo đang mở.
   */
  'content.exams.list': {
    need: 'moderator',
    run: async (ctx: AdminCtx, b) => {
      const page = Math.max(1, Math.floor(Number(b.page) || 1))
      const perPage = Math.min(100, Math.max(1, Math.floor(Number(b.perPage) || 20)))
      const q = str(b.q, 100)
      const status = str(b.status, 20)
      const subject = str(b.subject, 50)

      const qs = new URLSearchParams()
      qs.set('order', 'created_at.desc')
      qs.set('limit', String(perPage))
      qs.set('offset', String((page - 1) * perPage))
      qs.set(
        'select',
        'id,owner_id,title,subject,grade,school,created_at,question_count,duration_minutes,total_points,preview,listed,status,removed_reason,moderated_by,moderated_at',
      )

      if (q) qs.set('title', `ilike.*${q}*`)
      if (status) qs.set('status', `eq.${status}`)
      if (subject) qs.set('subject', `eq.${subject}`)

      const { data: exams, res } = await call<ExamDbRow[]>(
        ctx.s,
        `/rest/v1/community_exams?${qs.toString()}`,
        { headers: { Prefer: 'count=exact' } },
      )

      const total = parseTotal(res, exams.length)

      // Lấy email người đăng cho các đề trên trang
      const ownerIds = [...new Set(exams.map((e) => e.owner_id).filter((id): id is string => !!id))]
      const ownerEmails = new Map<string, string>()
      await Promise.all(
        ownerIds.map(async (oid) => {
          try {
            const { data: u } = await call<{ email?: string }>(ctx.s, `/auth/v1/admin/users/${oid}`)
            if (u?.email) ownerEmails.set(oid, u.email)
          } catch {
            // bỏ qua lỗi nếu không tìm thấy user
          }
        }),
      )

      // Đếm số báo cáo 'open' cho các đề trên trang
      const examIds = exams.map((e) => e.id)
      const openReportsCount = new Map<string, number>()
      if (examIds.length > 0) {
        try {
          const { data: reps } = await call<Array<{ exam_id: string }>>(
            ctx.s,
            `/rest/v1/reports?status=eq.open&exam_id=in.(${examIds.join(',')})&select=exam_id`,
          )
          for (const r of reps) {
            openReportsCount.set(r.exam_id, (openReportsCount.get(r.exam_id) ?? 0) + 1)
          }
        } catch {
          // bỏ qua lỗi nếu bảng reports chưa có dòng nào
        }
      }

      const rows = exams.map((e) => ({
        id: e.id,
        ownerId: e.owner_id,
        ownerEmail: e.owner_id ? ownerEmails.get(e.owner_id) ?? null : null,
        title: e.title,
        subject: e.subject,
        grade: e.grade,
        school: e.school,
        createdAt: e.created_at,
        questionCount: Number(e.question_count || 0),
        durationMinutes: Number(e.duration_minutes || 0),
        totalPoints: Number(e.total_points || 0),
        preview: e.preview,
        listed: Boolean(e.listed),
        status: e.status || 'published',
        removedReason: e.removed_reason ?? null,
        moderatedBy: e.moderated_by ?? null,
        moderatedAt: e.moderated_at ?? null,
        openReports: openReportsCount.get(e.id) ?? 0,
      }))

      return { exams: rows, total, page, perPage }
    },
  },

  /**
   * Xem chi tiết đề thi kèm nội dung `doc` để xem trước.
   */
  'content.exams.get': {
    need: 'moderator',
    run: async (ctx: AdminCtx, b) => {
      const examId = needUuid(b.examId, 'Mã đề thi không hợp lệ.')
      const { data } = await call<unknown[]>(
        ctx.s,
        `/rest/v1/community_exams?id=eq.${examId}&select=*`,
      )
      if (!data.length) throw new HttpError(404, 'Không tìm thấy đề thi.')
      return { exam: data[0] }
    },
  },

  /**
   * Cập nhật trạng thái đề thi: published / hidden / removed.
   * Khi gỡ (removed), bắt buộc phải có lý do.
   */
  'content.exams.setStatus': {
    need: 'moderator',
    run: async (ctx: AdminCtx, b) => {
      const examId = needUuid(b.examId, 'Mã đề thi không hợp lệ.')
      const status = str(b.status, 20)
      if (!['published', 'hidden', 'removed'].includes(status)) {
        throw new HttpError(400, 'Trạng thái đề không hợp lệ.')
      }

      const reason = str(b.reason, 500)
      if (status === 'removed' && !reason) {
        throw new HttpError(400, 'Cần có lý do khi gỡ đề thi.')
      }

      const patchBody: Record<string, unknown> = {
        status,
        removed_reason: status === 'removed' ? reason : null,
        moderated_by: ctx.userId,
        moderated_at: new Date().toISOString(),
      }

      await call(ctx.s, `/rest/v1/community_exams?id=eq.${examId}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(patchBody),
      })

      await audit(ctx, 'content.exams.setStatus', examId, {
        status,
        reason: status === 'removed' ? reason : undefined,
      })

      return { ok: true }
    },
  },

  /**
   * Xoá hẳn đề thi khỏi cơ sở dữ liệu (chỉ admin).
   */
  'content.exams.delete': {
    need: 'admin',
    run: async (ctx: AdminCtx, b) => {
      const examId = needUuid(b.examId, 'Mã đề thi không hợp lệ.')
      const { data: ex } = await call<Array<{ title: string }>>(
        ctx.s,
        `/rest/v1/community_exams?id=eq.${examId}&select=title`,
      )
      if (!ex.length) throw new HttpError(404, 'Không tìm thấy đề thi.')

      await call(ctx.s, `/rest/v1/community_exams?id=eq.${examId}`, {
        method: 'DELETE',
      })

      await audit(ctx, 'content.exams.delete', examId, { title: ex[0].title })
      return { ok: true }
    },
  },

  /**
   * Danh sách báo cáo vi phạm đề thi (moderator/admin).
   * Lọc theo status ('open', 'resolved', 'dismissed').
   */
  'content.reports.list': {
    need: 'moderator',
    run: async (ctx: AdminCtx, b) => {
      const page = Math.max(1, Math.floor(Number(b.page) || 1))
      const perPage = Math.min(100, Math.max(1, Math.floor(Number(b.perPage) || 20)))
      const status = str(b.status, 20)

      const qs = new URLSearchParams()
      qs.set('order', 'created_at.desc')
      qs.set('limit', String(perPage))
      qs.set('offset', String((page - 1) * perPage))
      qs.set(
        'select',
        'id,exam_id,reporter_id,reason,detail,status,created_at,resolved_by,resolved_at,community_exams(title)',
      )

      if (status) qs.set('status', `eq.${status}`)

      const { data: reports, res } = await call<ReportDbRow[]>(
        ctx.s,
        `/rest/v1/reports?${qs.toString()}`,
        { headers: { Prefer: 'count=exact' } },
      )

      const total = parseTotal(res, reports.length)

      // Lấy email người báo cáo
      const reporterIds = [
        ...new Set(reports.map((r) => r.reporter_id).filter((id): id is string => !!id)),
      ]
      const reporterEmails = new Map<string, string>()
      await Promise.all(
        reporterIds.map(async (rid) => {
          try {
            const { data: u } = await call<{ email?: string }>(ctx.s, `/auth/v1/admin/users/${rid}`)
            if (u?.email) reporterEmails.set(rid, u.email)
          } catch {}
        }),
      )

      const rows = reports.map((r) => ({
        id: r.id,
        examId: r.exam_id,
        examTitle: r.community_exams?.title ?? r.exam_title ?? '(Đề đã bị gỡ hoặc xoá)',
        reporterId: r.reporter_id,
        reporterEmail: r.reporter_id ? reporterEmails.get(r.reporter_id) ?? null : null,
        reason: r.reason,
        detail: r.detail,
        status: r.status,
        createdAt: r.created_at,
        resolvedBy: r.resolved_by,
        resolvedAt: r.resolved_at,
      }))

      return { reports: rows, total, page, perPage }
    },
  },

  /**
   * Xử lý báo cáo vi phạm: resolved (đã xử lý) hoặc dismissed (bỏ qua).
   */
  'content.reports.resolve': {
    need: 'moderator',
    run: async (ctx: AdminCtx, b) => {
      const reportId = Math.floor(Number(b.reportId) || 0)
      if (!reportId || reportId <= 0) throw new HttpError(400, 'Mã báo cáo không hợp lệ.')

      const status = str(b.status, 20)
      if (!['resolved', 'dismissed'].includes(status)) {
        throw new HttpError(400, 'Trạng thái xử lý không hợp lệ.')
      }

      await call(ctx.s, `/rest/v1/reports?id=eq.${reportId}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          status,
          resolved_by: ctx.userId,
          resolved_at: new Date().toISOString(),
        }),
      })

      await audit(ctx, 'content.reports.resolve', String(reportId), { status })
      return { ok: true }
    },
  },

  /**
   * Danh sách tài liệu tải lên (chỉ admin).
   * Kèm thống kê top 20 người dùng tốn dung lượng nhất.
   */
  'content.docs.list': {
    need: 'admin',
    run: async (ctx: AdminCtx, b) => {
      const page = Math.max(1, Math.floor(Number(b.page) || 1))
      const perPage = Math.min(100, Math.max(1, Math.floor(Number(b.perPage) || 20)))
      const q = str(b.q, 100)

      // 1. Thống kê dung lượng theo người (top 20)
      let topUsers: Array<{
        ownerId: string
        email: string
        name: string
        totalSize: number
        docCount: number
      }> = []

      try {
        const { data: allDocs } = await call<Array<{ owner_id: string; size: number }>>(
          ctx.s,
          '/rest/v1/user_documents?select=owner_id,size',
        )

        const byOwner = new Map<string, { totalSize: number; docCount: number }>()
        for (const d of allDocs) {
          if (!d.owner_id) continue
          const cur = byOwner.get(d.owner_id) ?? { totalSize: 0, docCount: 0 }
          cur.totalSize += Number(d.size || 0)
          cur.docCount += 1
          byOwner.set(d.owner_id, cur)
        }

        const sortedOwners = [...byOwner.entries()]
          .sort((a, b) => b[1].totalSize - a[1].totalSize)
          .slice(0, 20)

        topUsers = await Promise.all(
          sortedOwners.map(async ([ownerId, stats]) => {
            let email = ''
            let name = ''
            try {
              const { data: u } = await call<{
                email?: string
                user_metadata?: { display_name?: string; full_name?: string }
              }>(ctx.s, `/auth/v1/admin/users/${ownerId}`)
              email = u.email ?? ''
              name = u.user_metadata?.display_name || u.user_metadata?.full_name || ''
            } catch {}
            return {
              ownerId,
              email: email || ownerId.slice(0, 8),
              name,
              totalSize: stats.totalSize,
              docCount: stats.docCount,
            }
          }),
        )
      } catch {
        // bỏ qua nếu lỗi
      }

      // 2. Danh sách tài liệu phân trang
      const qs = new URLSearchParams()
      qs.set('order', 'created_at.desc')
      qs.set('limit', String(perPage))
      qs.set('offset', String((page - 1) * perPage))
      qs.set('select', 'id,owner_id,name,mime,size,url,created_at,subject')

      if (q) {
        qs.set('name', `ilike.*${q}*`)
      }

      const { data: docs, res } = await call<DocDbRow[]>(
        ctx.s,
        `/rest/v1/user_documents?${qs.toString()}`,
        { headers: { Prefer: 'count=exact' } },
      )

      const total = parseTotal(res, docs.length)

      // Lấy email người tải
      const docOwnerIds = [...new Set(docs.map((d) => d.owner_id).filter((id): id is string => !!id))]
      const docOwnerEmails = new Map<string, string>()
      await Promise.all(
        docOwnerIds.map(async (oid) => {
          try {
            const { data: u } = await call<{ email?: string }>(ctx.s, `/auth/v1/admin/users/${oid}`)
            if (u?.email) docOwnerEmails.set(oid, u.email)
          } catch {}
        }),
      )

      const rows = docs.map((d) => ({
        id: d.id,
        ownerId: d.owner_id,
        ownerEmail: docOwnerEmails.get(d.owner_id) ?? d.owner_id.slice(0, 8),
        name: d.name,
        mime: d.mime,
        size: Number(d.size || 0),
        url: d.url,
        createdAt: d.created_at,
        subject: d.subject ?? null,
      }))

      return { docs: rows, total, page, perPage, topUsers }
    },
  },

  /**
   * Xoá tài liệu tải lên (chỉ admin).
   * R2 dùng key theo nội dung: chỉ xoá file R2 khi không còn dòng user_documents nào khác trỏ tới cùng url.
   */
  'content.docs.delete': {
    need: 'admin',
    run: async (ctx: AdminCtx, b) => {
      const docId = needUuid(b.docId, 'Mã tài liệu không hợp lệ.')

      const { data: docs } = await call<Array<{ id: string; owner_id: string; name: string; url: string }>>(
        ctx.s,
        `/rest/v1/user_documents?id=eq.${docId}&select=id,owner_id,name,url`,
      )
      if (!docs.length) throw new HttpError(404, 'Không tìm thấy tài liệu.')
      const doc = docs[0]

      // Xoá bản ghi database trước
      await call(ctx.s, `/rest/v1/user_documents?id=eq.${docId}`, { method: 'DELETE' })

      // Kiểm tra file R2
      const key = doc.url ? r2KeyFromUrl(doc.url) : null
      let r2Removed = false
      if (key) {
        const fileUrl = doc.url.startsWith('/api/files/') ? doc.url : `/api/files/${key}`
        const { data: others } = await call<unknown[]>(
          ctx.s,
          `/rest/v1/user_documents?url=eq.${encodeURIComponent(fileUrl)}&select=id&limit=1`,
        )
        if (!others.length) {
          r2Removed = await deleteR2Object(key).catch(() => false)
        }
      }

      await audit(ctx, 'content.docs.delete', docId, {
        name: doc.name,
        url: doc.url,
        r2Removed,
      })

      return { ok: true, r2Removed }
    },
  },

  /**
   * Danh sách thư góp ý (chỉ admin).
   * Lọc theo trạng thái đã đọc (read).
   */
  'content.feedback.list': {
    need: 'admin',
    run: async (ctx: AdminCtx, b) => {
      const page = Math.max(1, Math.floor(Number(b.page) || 1))
      const perPage = Math.min(100, Math.max(1, Math.floor(Number(b.perPage) || 20)))

      const qs = new URLSearchParams()
      qs.set('order', 'created_at.desc')
      qs.set('limit', String(perPage))
      qs.set('offset', String((page - 1) * perPage))
      qs.set('select', 'id,user_id,email,message,page,created_at,read')

      if (typeof b.read === 'boolean') {
        qs.set('read', `eq.${b.read}`)
      }

      const { data: feedback, res } = await call<FeedbackDbRow[]>(
        ctx.s,
        `/rest/v1/feedback?${qs.toString()}`,
        { headers: { Prefer: 'count=exact' } },
      )

      const total = parseTotal(res, feedback.length)
      return { feedback, total, page, perPage }
    },
  },

  /**
   * Đánh dấu đã đọc / chưa đọc thư góp ý (chỉ admin).
   */
  'content.feedback.markRead': {
    need: 'admin',
    run: async (ctx: AdminCtx, b) => {
      const feedbackId = Math.floor(Number(b.feedbackId) || 0)
      if (!feedbackId || feedbackId <= 0) throw new HttpError(400, 'Mã góp ý không hợp lệ.')

      const read = b.read !== false
      await call(ctx.s, `/rest/v1/feedback?id=eq.${feedbackId}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ read }),
      })

      await audit(ctx, 'content.feedback.markRead', String(feedbackId), { read })
      return { ok: true }
    },
  },
}
