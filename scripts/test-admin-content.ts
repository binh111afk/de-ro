/**
 * Test API admin giai đoạn 3 (Nội dung) với Supabase và R2 giả:
 * - User thường bị 403 trên các action admin/moderator.
 * - Moderator xem được đề, báo cáo; đổi trạng thái được; nhưng KHÔNG xoá hẳn đề được (403).
 * - Moderator không xem/xoá được tài liệu, không xem được góp ý (403).
 * - Gỡ đề thiếu lý do → 400.
 * - Xoá tài liệu: không xoá R2 khi còn dòng khác dùng chung URL; có xoá R2 khi là dòng duy nhất.
 * - Mọi thao tác thay đổi dữ liệu ghi admin_audit.
 * Chạy: npm run test:admin-content
 */
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'

process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'
process.env.R2_ACCOUNT_ID = 'acc123'
process.env.R2_ACCESS_KEY_ID = 'key123'
process.env.R2_SECRET_ACCESS_KEY = 'secret123'
process.env.R2_BUCKET = 'bucket123'

const ADMIN = '11111111-1111-4111-8111-111111111111'
const MOD = '22222222-2222-4222-8222-222222222222'
const USER = '33333333-3333-4333-8333-333333333333'
const TOKENS: Record<string, string> = { tAdmin: ADMIN, tMod: MOD, tUser: USER }
const ROLES: Record<string, string> = { [ADMIN]: 'admin', [MOD]: 'moderator' }

const calls: string[] = []
let sharedDocCount = 1

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const method = init.method ?? 'GET'
  calls.push(`${method} ${url.replace('http://sb', '')}`)

  const ok = (body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status: 200, headers })

  // R2 S3 API
  if (url.includes('.r2.cloudflarestorage.com')) {
    if (method === 'DELETE') {
      calls.push(`R2_DELETE ${url}`)
      return new Response(null, { status: 204 })
    }
    return new Response(null, { status: 200 })
  }

  // Supabase Auth
  if (url.endsWith('/auth/v1/user')) {
    const tok = String((init.headers as Record<string, string>).Authorization ?? '').replace('Bearer ', '')
    return TOKENS[tok] ? ok({ id: TOKENS[tok] }) : new Response('{}', { status: 401 })
  }
  if (url.includes('/rest/v1/user_roles')) {
    const id = /user_id=eq\.([0-9a-f-]+)/.exec(url)?.[1] ?? ''
    return ok(ROLES[id] ? [{ role: ROLES[id] }] : [])
  }
  if (url.includes('/auth/v1/admin/users/')) {
    return ok({ id: USER, email: 'gv@school.edu.vn', user_metadata: { display_name: 'Giáo viên Test' } })
  }

  // Audit
  if (url.includes('/rest/v1/admin_audit')) {
    return new Response(null, { status: 201 })
  }

  // Community exams
  if (url.includes('/rest/v1/community_exams')) {
    if (method === 'DELETE') return new Response(null, { status: 204 })
    if (method === 'PATCH') return new Response(null, { status: 204 })
    if (url.includes('id=eq.')) {
      return ok([
        {
          id: 'e1111111-1111-4111-8111-111111111111',
          owner_id: USER,
          title: 'Đề thi thử Toán 10',
          subject: 'Toán',
          grade: '10',
          school: 'THPT Test',
          created_at: '2026-11-01T00:00:00Z',
          question_count: 20,
          duration_minutes: 45,
          total_points: 10,
          preview: 'Câu 1...',
          listed: true,
          status: 'published',
          doc: { blocks: [] },
        },
      ])
    }
    return ok(
      [
        {
          id: 'e1111111-1111-4111-8111-111111111111',
          owner_id: USER,
          title: 'Đề thi thử Toán 10',
          subject: 'Toán',
          grade: '10',
          school: 'THPT Test',
          created_at: '2026-11-01T00:00:00Z',
          question_count: 20,
          duration_minutes: 45,
          total_points: 10,
          preview: 'Câu 1...',
          listed: true,
          status: 'published',
        },
      ],
      { 'content-range': '0-0/1' },
    )
  }

  // Reports
  if (url.includes('/rest/v1/reports')) {
    if (method === 'PATCH') return new Response(null, { status: 204 })
    if (url.includes('status=eq.open&exam_id=in.')) {
      return ok([{ exam_id: 'e1111111-1111-4111-8111-111111111111' }])
    }
    return ok(
      [
        {
          id: 1,
          exam_id: 'e1111111-1111-4111-8111-111111111111',
          reporter_id: USER,
          reason: 'Sai đáp án',
          detail: 'Câu 1 sai đáp án',
          status: 'open',
          created_at: '2026-11-02T00:00:00Z',
          community_exams: { title: 'Đề thi thử Toán 10' },
        },
      ],
      { 'content-range': '0-0/1' },
    )
  }

  // User documents
  if (url.includes('/rest/v1/user_documents')) {
    if (method === 'DELETE') return new Response(null, { status: 204 })
    if (url.includes('url=eq.')) {
      // kiểm tra còn dòng nào khác dùng chung không
      return ok(sharedDocCount > 0 ? [{ id: 'other-doc-id' }] : [])
    }
    if (url.includes('id=eq.')) {
      return ok([
        {
          id: 'd1111111-1111-4111-8111-111111111111',
          owner_id: USER,
          name: 'de-toan.pdf',
          mime: 'application/pdf',
          size: 102400,
          url: '/api/files/doc/0123456789abcdef0123456789abcdef01234567.pdf',
          created_at: '2026-11-01T00:00:00Z',
          subject: 'Toán',
        },
      ])
    }
    return ok(
      [
        {
          id: 'd1111111-1111-4111-8111-111111111111',
          owner_id: USER,
          name: 'de-toan.pdf',
          mime: 'application/pdf',
          size: 102400,
          url: '/api/files/doc/0123456789abcdef0123456789abcdef01234567.pdf',
          created_at: '2026-11-01T00:00:00Z',
          subject: 'Toán',
        },
      ],
      { 'content-range': '0-0/1' },
    )
  }

  // Feedback
  if (url.includes('/rest/v1/feedback')) {
    if (method === 'PATCH') return new Response(null, { status: 204 })
    return ok(
      [
        {
          id: 1,
          user_id: USER,
          email: 'gv@school.edu.vn',
          message: 'Ứng dụng tốt',
          page: '/soan-de',
          created_at: '2026-11-01T00:00:00Z',
          read: false,
        },
      ],
      { 'content-range': '0-0/1' },
    )
  }

  return ok([])
}) as typeof fetch

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')

async function hit(body: unknown, token?: string): Promise<{ status: number; data: Record<string, unknown> }> {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    headers: { host: 'x', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  })
  const out = { status: 0, body: '' }
  const res = {
    writeHead(c: number) {
      out.status = c
      return this
    },
    end(b?: string) {
      out.body = b ?? ''
    },
  } as unknown as ServerResponse
  _resetRoleCache()
  await handleAdminRequest(req, res)
  return { status: out.status, data: out.body ? JSON.parse(out.body) : {} }
}

let fail = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✅' : '❌'} ${name}`)
  if (!ok) fail++
}

const EXAM_ID = 'e1111111-1111-4111-8111-111111111111'
const DOC_ID = 'd1111111-1111-4111-8111-111111111111'

// 1. Kiểm tra phân quyền user thường
check('user thường gọi content.exams.list → 403', (await hit({ action: 'content.exams.list' }, 'tUser')).status === 403)
check('user thường gọi content.exams.setStatus → 403', (await hit({ action: 'content.exams.setStatus', examId: EXAM_ID, status: 'hidden' }, 'tUser')).status === 403)
check('user thường gọi content.reports.list → 403', (await hit({ action: 'content.reports.list' }, 'tUser')).status === 403)
check('user thường gọi content.docs.list → 403', (await hit({ action: 'content.docs.list' }, 'tUser')).status === 403)
check('user thường gọi content.feedback.list → 403', (await hit({ action: 'content.feedback.list' }, 'tUser')).status === 403)

// 2. Moderator vs Admin permissions
check('moderator gọi content.exams.list → 200', (await hit({ action: 'content.exams.list' }, 'tMod')).status === 200)
check('moderator gọi content.exams.get → 200', (await hit({ action: 'content.exams.get', examId: EXAM_ID }, 'tMod')).status === 200)
check('moderator gọi content.reports.list → 200', (await hit({ action: 'content.reports.list' }, 'tMod')).status === 200)
check('moderator gọi content.reports.resolve → 200', (await hit({ action: 'content.reports.resolve', reportId: 1, status: 'resolved' }, 'tMod')).status === 200)

check('moderator gọi content.exams.delete → 403 (không xoá hẳn được)', (await hit({ action: 'content.exams.delete', examId: EXAM_ID }, 'tMod')).status === 403)
check('moderator gọi content.docs.list → 403', (await hit({ action: 'content.docs.list' }, 'tMod')).status === 403)
check('moderator gọi content.docs.delete → 403', (await hit({ action: 'content.docs.delete', docId: DOC_ID }, 'tMod')).status === 403)
check('moderator gọi content.feedback.list → 403', (await hit({ action: 'content.feedback.list' }, 'tMod')).status === 403)
check('moderator gọi content.feedback.markRead → 403', (await hit({ action: 'content.feedback.markRead', feedbackId: 1 }, 'tMod')).status === 403)

// 3. Gỡ đề thiếu lý do → 400
check('gỡ đề thiếu lý do → 400', (await hit({ action: 'content.exams.setStatus', examId: EXAM_ID, status: 'removed' }, 'tMod')).status === 400)
check('gỡ đề lý do rỗng → 400', (await hit({ action: 'content.exams.setStatus', examId: EXAM_ID, status: 'removed', reason: '   ' }, 'tMod')).status === 400)
check('trạng thái đề không hợp lệ → 400', (await hit({ action: 'content.exams.setStatus', examId: EXAM_ID, status: 'invalid_status' }, 'tMod')).status === 400)

// 4. Thao tác hợp lệ & ghi admin_audit
calls.length = 0
const setRemoved = await hit({ action: 'content.exams.setStatus', examId: EXAM_ID, status: 'removed', reason: 'Vi phạm bản quyền' }, 'tMod')
check('gỡ đề có lý do → 200', setRemoved.status === 200)
check('gỡ đề ghi audit', calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))

calls.length = 0
const resRep = await hit({ action: 'content.reports.resolve', reportId: 1, status: 'resolved' }, 'tMod')
check('xử lý báo cáo → 200', resRep.status === 200)
check('xử lý báo cáo ghi audit', calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))

// 5. Admin xoá hẳn đề thi
calls.length = 0
const delExam = await hit({ action: 'content.exams.delete', examId: EXAM_ID }, 'tAdmin')
check('admin xoá hẳn đề → 200', delExam.status === 200)
check('xoá hẳn đề gọi DELETE và ghi audit', calls.some((c) => c.startsWith(`DELETE /rest/v1/community_exams?id=eq.${EXAM_ID}`)) && calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))

// 6. Xoá tài liệu: không xoá file R2 khi còn dòng khác dùng chung
sharedDocCount = 1 // còn người khác dùng
calls.length = 0
const delDocShared = await hit({ action: 'content.docs.delete', docId: DOC_ID }, 'tAdmin')
check('xoá tài liệu dùng chung → 200', delDocShared.status === 200 && delDocShared.data.r2Removed === false)
check('xoá tài liệu dùng chung: KHÔNG gọi R2 DELETE', !calls.some((c) => c.includes('R2_DELETE')))
check('xoá tài liệu dùng chung: có ghi audit', calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))

// 7. Xoá tài liệu: CÓ xoá file R2 khi không còn dòng nào khác dùng chung
sharedDocCount = 0 // là dòng cuối cùng
calls.length = 0
const delDocSingle = await hit({ action: 'content.docs.delete', docId: DOC_ID }, 'tAdmin')
check('xoá tài liệu duy nhất → 200', delDocSingle.status === 200 && delDocSingle.data.r2Removed === true)
check('xoá tài liệu duy nhất: CÓ gọi R2 DELETE', calls.some((c) => c.includes('R2_DELETE')))
check('xoá tài liệu duy nhất: có ghi audit', calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))

// 8. Feedback (chỉ admin)
calls.length = 0
const fbList = await hit({ action: 'content.feedback.list' }, 'tAdmin')
check('admin xem góp ý → 200', fbList.status === 200 && Array.isArray(fbList.data.feedback))

const fbMark = await hit({ action: 'content.feedback.markRead', feedbackId: 1, read: true }, 'tAdmin')
check('admin đánh dấu đã đọc góp ý → 200', fbMark.status === 200)
check('đánh dấu góp ý ghi audit', calls.some((c) => c.startsWith('POST /rest/v1/admin_audit')))

if (fail) {
  console.error(`${fail} lỗi`)
  process.exit(1)
}
console.log('test-admin-content: TẤT CẢ ĐẠT (OK)')
