/**
 * Client trang Admin giai đoạn 3 (Nội dung). Xem docs/prompt-admin-content.md.
 * Gọi server bằng `post(action, body, read)` từ './adminApi'; dữ liệu giả khi `isAdminMock()` (dùng `wait`).
 */
import { isAdminMock, post, wait } from './adminApi'

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

// ==================== DỮ LIỆU GIẢ (MOCK) ====================

const MOCK_EXAMS: ContentExam[] = [
  {
    id: 'e1000000-0000-4000-8000-000000000001',
    ownerId: '00000000-0000-4000-8000-000000000001',
    ownerEmail: 'giaovien1@example.com',
    title: 'Kiểm tra 1 tiết Toán 10 — Đại số & Hệ số góc',
    subject: 'Toán',
    grade: 'Lớp 10',
    school: 'THPT Chu Văn An',
    createdAt: '2026-11-09T08:30:00Z',
    questionCount: 25,
    durationMinutes: 45,
    totalPoints: 10,
    preview: 'Tìm tập xác định của hàm số y = sqrt(2x - 4)...',
    listed: true,
    status: 'published',
    removedReason: null,
    moderatedBy: null,
    moderatedAt: null,
    openReports: 0,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000002',
    ownerId: '00000000-0000-4000-8000-000000000002',
    ownerEmail: 'giaovien2@example.com',
    title: 'Đề thi giữa kỳ 1 Vật lí 11 — Dao động cơ',
    subject: 'Vật lí',
    grade: 'Lớp 11',
    school: 'THPT Chuyên Hà Nội - Amsterdam',
    createdAt: '2026-11-08T14:15:00Z',
    questionCount: 28,
    durationMinutes: 50,
    totalPoints: 10,
    preview: 'Một con lắc lò xo dao động điều hòa với chu kỳ T = 2s...',
    listed: true,
    status: 'published',
    removedReason: null,
    moderatedBy: null,
    moderatedAt: null,
    openReports: 2,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000003',
    ownerId: '00000000-0000-4000-8000-000000000003',
    ownerEmail: 'giaovien3@example.com',
    title: 'Đề ôn tập Ngữ văn 12 — Nghị luận văn học (Tây Tiến)',
    subject: 'Ngữ văn',
    grade: 'Lớp 12',
    school: 'THPT Lương Thế Vinh',
    createdAt: '2026-11-07T09:40:00Z',
    questionCount: 6,
    durationMinutes: 90,
    totalPoints: 10,
    preview: 'Phân tích vẻ đẹp người lính Tây Tiến qua ngòi bút Quang Dũng...',
    listed: true,
    status: 'hidden',
    removedReason: null,
    moderatedBy: '00000000-0000-4000-8000-000000000000',
    moderatedAt: '2026-11-08T10:00:00Z',
    openReports: 1,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000004',
    ownerId: '00000000-0000-4000-8000-000000000004',
    ownerEmail: 'giaovien4@example.com',
    title: 'Đề thi trắc nghiệm Hoá học 10 — Bảng tuần hoàn các nguyên tố',
    subject: 'Hóa học',
    grade: 'Lớp 10',
    school: 'THPT Kim Liên',
    createdAt: '2026-11-06T11:20:00Z',
    questionCount: 30,
    durationMinutes: 45,
    totalPoints: 10,
    preview: 'Cấu hình electron nguyên tử của nguyên tố X là 1s2 2s2 2p6 3s1...',
    listed: false,
    status: 'removed',
    removedReason: 'Nội dung trùng lặp tài liệu có bản quyền Nhà xuất bản Giáo dục',
    moderatedBy: '00000000-0000-4000-8000-000000000000',
    moderatedAt: '2026-11-07T08:00:00Z',
    openReports: 0,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000005',
    ownerId: '00000000-0000-4000-8000-000000000005',
    ownerEmail: 'giaovien5@example.com',
    title: 'Kiểm tra 15 phút Tiếng Anh 9 — Unit 3: Teen stress and pressure',
    subject: 'Tiếng Anh',
    grade: 'Lớp 9',
    school: 'THCS Giảng Võ',
    createdAt: '2026-11-05T16:00:00Z',
    questionCount: 15,
    durationMinutes: 15,
    totalPoints: 10,
    preview: 'Choose the word whose underlined part is pronounced differently...',
    listed: true,
    status: 'published',
    removedReason: null,
    moderatedBy: null,
    moderatedAt: null,
    openReports: 0,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000006',
    ownerId: '00000000-0000-4000-8000-000000000006',
    ownerEmail: 'giaovien6@example.com',
    title: 'Đề khảo sát Lịch sử 8 — Cách mạng tư sản Pháp 1789',
    subject: 'Lịch sử',
    grade: 'Lớp 8',
    school: 'THCS Cầu Giấy',
    createdAt: '2026-11-04T07:10:00Z',
    questionCount: 20,
    durationMinutes: 30,
    totalPoints: 10,
    preview: 'Tình hình kinh tế nước Pháp trước năm 1789 có đặc điểm gì nổi bật?...',
    listed: true,
    status: 'published',
    removedReason: null,
    moderatedBy: null,
    moderatedAt: null,
    openReports: 0,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000007',
    ownerId: '00000000-0000-4000-8000-000000000007',
    ownerEmail: 'giaovien7@example.com',
    title: 'Đề ôn Sinh học 11 — Tuần hoàn máu ở động vật',
    subject: 'Sinh học',
    grade: 'Lớp 11',
    school: 'THPT Yên Hòa',
    createdAt: '2026-11-03T13:45:00Z',
    questionCount: 25,
    durationMinutes: 45,
    totalPoints: 10,
    preview: 'Hệ tuần hoàn hở có ở những nhóm động vật nào sau đây?...',
    listed: true,
    status: 'published',
    removedReason: null,
    moderatedBy: null,
    moderatedAt: null,
    openReports: 1,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000008',
    ownerId: '00000000-0000-4000-8000-000000000008',
    ownerEmail: 'giaovien8@example.com',
    title: 'Đề kiểm tra Tin học 10 — Lập trình Python cơ bản',
    subject: 'Tin học',
    grade: 'Lớp 10',
    school: 'THPT Phan Đình Phùng',
    createdAt: '2026-11-02T10:00:00Z',
    questionCount: 20,
    durationMinutes: 45,
    totalPoints: 10,
    preview: 'Cho biết kết quả in ra màn hình của đoạn lệnh print(5 // 2)...',
    listed: true,
    status: 'published',
    removedReason: null,
    moderatedBy: null,
    moderatedAt: null,
    openReports: 0,
  },
]

const MOCK_REPORTS: ContentReport[] = [
  {
    id: 1,
    examId: 'e1000000-0000-4000-8000-000000000002',
    examTitle: 'Đề thi giữa kỳ 1 Vật lí 11 — Dao động cơ',
    reporterId: '00000000-0000-4000-8000-000000000010',
    reporterEmail: 'hocsinh10@example.com',
    reason: 'Sai đáp án',
    detail: 'Câu số 14 câu hỏi tính vận tốc cực đại đáp án C sai, phải là 20pi cm/s (đáp án B).',
    status: 'open',
    createdAt: '2026-11-09T09:12:00Z',
    resolvedBy: null,
    resolvedAt: null,
  },
  {
    id: 2,
    examId: 'e1000000-0000-4000-8000-000000000002',
    examTitle: 'Đề thi giữa kỳ 1 Vật lí 11 — Dao động cơ',
    reporterId: '00000000-0000-4000-8000-000000000011',
    reporterEmail: 'giaovien11@example.com',
    reason: 'Sai đáp án',
    detail: 'Đồng ý với báo cáo trước, câu 14 nhầm lẫn giữa chu kỳ và tần số góc.',
    status: 'open',
    createdAt: '2026-11-09T10:45:00Z',
    resolvedBy: null,
    resolvedAt: null,
  },
  {
    id: 3,
    examId: 'e1000000-0000-4000-8000-000000000003',
    examTitle: 'Đề ôn tập Ngữ văn 12 — Nghị luận văn học (Tây Tiến)',
    reporterId: '00000000-0000-4000-8000-000000000012',
    reporterEmail: 'giaovien12@example.com',
    reason: 'Vi phạm bản quyền',
    detail: 'Sao chép nguyên văn đáp án hướng dẫn chấm của Sở GD&ĐT Hà Nội chưa xin phép.',
    status: 'open',
    createdAt: '2026-11-08T07:20:00Z',
    resolvedBy: null,
    resolvedAt: null,
  },
  {
    id: 4,
    examId: 'e1000000-0000-4000-8000-000000000007',
    examTitle: 'Đề ôn Sinh học 11 — Tuần hoàn máu ở động vật',
    reporterId: '00000000-0000-4000-8000-000000000013',
    reporterEmail: 'hocsinh13@example.com',
    reason: 'Khác',
    detail: 'Hình ảnh sơ đồ tim ở câu 8 bị vỡ hạt, không nhìn rõ chú thích van tim.',
    status: 'open',
    createdAt: '2026-11-07T14:30:00Z',
    resolvedBy: null,
    resolvedAt: null,
  },
  {
    id: 5,
    examId: 'e1000000-0000-4000-8000-000000000004',
    examTitle: 'Đề thi trắc nghiệm Hoá học 10 — Bảng tuần hoàn các nguyên tố',
    reporterId: '00000000-0000-4000-8000-000000000014',
    reporterEmail: 'giaovien14@example.com',
    reason: 'Spam',
    detail: 'Đề chứa link dẫn tới nhóm Zalo bán khoá học ôn thi.',
    status: 'resolved',
    createdAt: '2026-11-06T12:00:00Z',
    resolvedBy: '00000000-0000-4000-8000-000000000000',
    resolvedAt: '2026-11-07T08:00:00Z',
  },
  {
    id: 6,
    examId: 'e1000000-0000-4000-8000-000000000001',
    examTitle: 'Kiểm tra 1 tiết Toán 10 — Đại số & Hệ số góc',
    reporterId: '00000000-0000-4000-8000-000000000015',
    reporterEmail: 'hocsinh15@example.com',
    reason: 'Nội dung không phù hợp',
    detail: 'Câu 2 có từ ngữ đùa cợt không chuẩn mực.',
    status: 'dismissed',
    createdAt: '2026-11-05T09:00:00Z',
    resolvedBy: '00000000-0000-4000-8000-000000000000',
    resolvedAt: '2026-11-05T11:00:00Z',
  },
]

const MOCK_DOCS: ContentDoc[] = [
  {
    id: 'd1000000-0000-4000-8000-000000000001',
    ownerId: '00000000-0000-4000-8000-000000000001',
    ownerEmail: 'giaovien1@example.com',
    name: 'Bo-de-thi-thu-tot-nghiep-THPT-2026-Toan.pdf',
    mime: 'application/pdf',
    size: 4_250_000,
    url: '/api/files/doc/1111111111111111111111111111111111111111.pdf',
    createdAt: '2026-11-09T06:20:00Z',
    subject: 'Toán',
  },
  {
    id: 'd1000000-0000-4000-8000-000000000002',
    ownerId: '00000000-0000-4000-8000-000000000002',
    ownerEmail: 'giaovien2@example.com',
    name: 'Giao-trinh-thi-nghiem-Vat-li-11.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 2_150_000,
    url: '/api/files/doc/2222222222222222222222222222222222222222.docx',
    createdAt: '2026-11-08T11:15:00Z',
    subject: 'Vật lí',
  },
  {
    id: 'd1000000-0000-4000-8000-000000000003',
    ownerId: '00000000-0000-4000-8000-000000000001',
    ownerEmail: 'giaovien1@example.com',
    name: 'So-do-tu-duy-Hinh-hoc-khong-gian-12.pdf',
    mime: 'application/pdf',
    size: 8_900_000,
    url: '/api/files/doc/3333333333333333333333333333333333333333.pdf',
    createdAt: '2026-11-07T15:40:00Z',
    subject: 'Toán',
  },
  {
    id: 'd1000000-0000-4000-8000-000000000004',
    ownerId: '00000000-0000-4000-8000-000000000003',
    ownerEmail: 'giaovien3@example.com',
    name: 'De-cuong-on-tap-Ngu-van-hoc-ki-1.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 980_000,
    url: '/api/files/doc/4444444444444444444444444444444444444444.docx',
    createdAt: '2026-11-06T08:50:00Z',
    subject: 'Ngữ văn',
  },
  {
    id: 'd1000000-0000-4000-8000-000000000005',
    ownerId: '00000000-0000-4000-8000-000000000004',
    ownerEmail: 'giaovien4@example.com',
    name: 'Bang-tuan-hoan-chat-luong-cao.png',
    mime: 'image/png',
    size: 1_450_000,
    url: '/api/files/img/5555555555555555555555555555555555555555.png',
    createdAt: '2026-11-05T13:20:00Z',
    subject: 'Hóa học',
  },
  {
    id: 'd1000000-0000-4000-8000-000000000006',
    ownerId: '00000000-0000-4000-8000-000000000005',
    ownerEmail: 'giaovien5@example.com',
    name: 'Audio-Listening-Practice-Grade-9.pdf',
    mime: 'application/pdf',
    size: 3_120_000,
    url: '/api/files/doc/6666666666666666666666666666666666666666.pdf',
    createdAt: '2026-11-04T17:05:00Z',
    subject: 'Tiếng Anh',
  },
]

const MOCK_TOP_USERS: ContentTopUserStorage[] = [
  {
    ownerId: '00000000-0000-4000-8000-000000000001',
    email: 'giaovien1@example.com',
    name: 'Cô Nguyễn Thu Hà',
    totalSize: 13_150_000,
    docCount: 2,
  },
  {
    ownerId: '00000000-0000-4000-8000-000000000005',
    email: 'giaovien5@example.com',
    name: 'Thầy Trần Đức Nam',
    totalSize: 3_120_000,
    docCount: 1,
  },
  {
    ownerId: '00000000-0000-4000-8000-000000000002',
    email: 'giaovien2@example.com',
    name: 'Thầy Lê Hoàng',
    totalSize: 2_150_000,
    docCount: 1,
  },
  {
    ownerId: '00000000-0000-4000-8000-000000000004',
    email: 'giaovien4@example.com',
    name: 'Cô Phạm Hồng Nhung',
    totalSize: 1_450_000,
    docCount: 1,
  },
  {
    ownerId: '00000000-0000-4000-8000-000000000003',
    email: 'giaovien3@example.com',
    name: 'Cô Đỗ Mai Lan',
    totalSize: 980_000,
    docCount: 1,
  },
]

const MOCK_FEEDBACK: ContentFeedback[] = [
  {
    id: 1,
    userId: '00000000-0000-4000-8000-000000000001',
    email: 'giaovien1@example.com',
    message: 'Ứng dụng soạn đề rất tiện, mong đội ngũ phát triển thêm tính năng tách nhóm câu hỏi có cùng đoạn văn đọc hiểu trong môn Tiếng Anh và Ngữ văn.',
    page: '/soan-de',
    createdAt: '2026-11-09T11:00:00Z',
    read: false,
  },
  {
    id: 2,
    userId: null,
    email: 'khachhang@gmail.com',
    message: 'Tôi là phụ huynh muốn làm thử đề của con trên điện thoại nhưng cỡ chữ công thức toán hơi nhỏ, mong thêm tuỳ chọn phóng to.',
    page: '/lam-de/demo',
    createdAt: '2026-11-08T18:40:00Z',
    read: false,
  },
  {
    id: 3,
    userId: '00000000-0000-4000-8000-000000000002',
    email: 'giaovien2@example.com',
    message: 'Xuất Word rất đẹp và giữ chuẩn lề A4, thầy cô trong tổ chuyên môn trường tôi đều khen. Cảm ơn tác giả nhiều!',
    page: '/de-cong-dong',
    createdAt: '2026-11-07T16:15:00Z',
    read: true,
  },
  {
    id: 4,
    userId: null,
    email: null,
    message: 'Nên thêm tính năng in phiếu trả lời trắc nghiệm 20 câu / 40 câu để học sinh tô chì như thi thật.',
    page: '/cham-trac-nghiem',
    createdAt: '2026-11-06T09:30:00Z',
    read: true,
  },
  {
    id: 5,
    userId: '00000000-0000-4000-8000-000000000005',
    email: 'giaovien5@example.com',
    message: 'Cho tôi hỏi tài khoản miễn phí có giới hạn số lượng đề đăng lên cộng đồng không ạ?',
    page: '/ho-so',
    createdAt: '2026-11-05T14:20:00Z',
    read: true,
  },
]

// ==================== API CLIENT FUNCTIONS ====================

export function listContentExams(opts: {
  q?: string
  status?: string
  subject?: string
  page?: number
  perPage?: number
} = {}): Promise<ContentExamPage> {
  if (isAdminMock()) {
    const q = (opts.q ?? '').toLowerCase()
    const page = opts.page ?? 1
    const perPage = opts.perPage ?? 20
    const filtered = MOCK_EXAMS.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q) && !e.school.toLowerCase().includes(q)) return false
      if (opts.status && e.status !== opts.status) return false
      if (opts.subject && e.subject !== opts.subject) return false
      return true
    })
    return wait({
      exams: filtered.slice((page - 1) * perPage, page * perPage),
      total: filtered.length,
      page,
      perPage,
    })
  }
  return post('content.exams.list', opts)
}

export function getContentExam(examId: string): Promise<{ exam: any }> {
  if (isAdminMock()) {
    const found = MOCK_EXAMS.find((e) => e.id === examId)
    if (!found) return Promise.reject(new Error('Không tìm thấy đề thi.'))
    return wait({
      exam: {
        ...found,
        doc: {
          id: found.id,
          title: found.title,
          subject: found.subject,
          grade: found.grade,
          unit: found.school,
          kind: 'exam',
          blocks: [
            {
              id: 'b1',
              type: 'question',
              prompt: found.preview,
              choices: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
              answer: 'A',
              points: 0.4,
            },
            {
              id: 'b2',
              type: 'question',
              prompt: 'Câu hỏi mẫu tiếp theo trong đề thi...',
              choices: ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3', 'Lựa chọn 4'],
              answer: 'B',
              points: 0.4,
            },
          ],
        },
      },
    })
  }
  return post('content.exams.get', { examId })
}

export function setContentExamStatus(
  examId: string,
  status: 'published' | 'hidden' | 'removed',
  reason?: string,
): Promise<{ ok: boolean }> {
  if (isAdminMock()) {
    const target = MOCK_EXAMS.find((e) => e.id === examId)
    if (target) {
      target.status = status
      target.removedReason = status === 'removed' ? reason || null : null
      target.moderatedBy = 'mock-admin'
      target.moderatedAt = new Date().toISOString()
    }
    return wait({ ok: true })
  }
  return post('content.exams.setStatus', { examId, status, reason }, false)
}

export function deleteContentExam(examId: string): Promise<{ ok: boolean }> {
  if (isAdminMock()) {
    const idx = MOCK_EXAMS.findIndex((e) => e.id === examId)
    if (idx !== -1) MOCK_EXAMS.splice(idx, 1)
    return wait({ ok: true })
  }
  return post('content.exams.delete', { examId }, false)
}

export function listContentReports(opts: {
  status?: string
  page?: number
  perPage?: number
} = {}): Promise<ContentReportPage> {
  if (isAdminMock()) {
    const page = opts.page ?? 1
    const perPage = opts.perPage ?? 20
    const filtered = MOCK_REPORTS.filter((r) => {
      if (opts.status && r.status !== opts.status) return false
      return true
    })
    return wait({
      reports: filtered.slice((page - 1) * perPage, page * perPage),
      total: filtered.length,
      page,
      perPage,
    })
  }
  return post('content.reports.list', opts)
}

export function resolveContentReport(
  reportId: number,
  status: 'resolved' | 'dismissed',
): Promise<{ ok: boolean }> {
  if (isAdminMock()) {
    const rep = MOCK_REPORTS.find((r) => r.id === reportId)
    if (rep) {
      rep.status = status
      rep.resolvedBy = 'mock-moderator'
      rep.resolvedAt = new Date().toISOString()
    }
    return wait({ ok: true })
  }
  return post('content.reports.resolve', { reportId, status }, false)
}

export function listContentDocs(opts: {
  q?: string
  page?: number
  perPage?: number
} = {}): Promise<ContentDocPage> {
  if (isAdminMock()) {
    const q = (opts.q ?? '').toLowerCase()
    const page = opts.page ?? 1
    const perPage = opts.perPage ?? 20
    const filtered = MOCK_DOCS.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q) && !d.ownerEmail.toLowerCase().includes(q)) return false
      return true
    })
    return wait({
      docs: filtered.slice((page - 1) * perPage, page * perPage),
      total: filtered.length,
      page,
      perPage,
      topUsers: MOCK_TOP_USERS,
    })
  }
  return post('content.docs.list', opts)
}

export function deleteContentDoc(docId: string): Promise<{ ok: boolean; r2Removed: boolean }> {
  if (isAdminMock()) {
    const idx = MOCK_DOCS.findIndex((d) => d.id === docId)
    if (idx !== -1) MOCK_DOCS.splice(idx, 1)
    return wait({ ok: true, r2Removed: true })
  }
  return post('content.docs.delete', { docId }, false)
}

export function listContentFeedback(opts: {
  read?: boolean
  page?: number
  perPage?: number
} = {}): Promise<ContentFeedbackPage> {
  if (isAdminMock()) {
    const page = opts.page ?? 1
    const perPage = opts.perPage ?? 20
    const filtered = MOCK_FEEDBACK.filter((f) => {
      if (typeof opts.read === 'boolean' && f.read !== opts.read) return false
      return true
    })
    return wait({
      feedback: filtered.slice((page - 1) * perPage, page * perPage),
      total: filtered.length,
      page,
      perPage,
    })
  }
  return post('content.feedback.list', opts)
}

export function markContentFeedbackRead(
  feedbackId: number,
  read = true,
): Promise<{ ok: boolean }> {
  if (isAdminMock()) {
    const f = MOCK_FEEDBACK.find((item) => item.id === feedbackId)
    if (f) f.read = read
    return wait({ ok: true })
  }
  return post('content.feedback.markRead', { feedbackId, read }, false)
}
