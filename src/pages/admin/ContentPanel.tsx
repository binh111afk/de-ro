/**
 * Admin giai đoạn 3: Quản lý Nội dung (Đề cộng đồng, Báo cáo, Tài liệu, Góp ý).
 * Xem docs/prompt-admin-content.md.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Eye,
  FileText,
  HardDrive,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  inputClass,
} from '@/components/ui'
import { Portal } from '@/components/Portal'
import { Pager } from '@/components/Pager'
import { SiteSelect, type SiteSelectOption } from '@/components/SiteSelect'
import { Segmented } from '@/components/Segmented'
import { dialog } from '@/components/Dialog'
import type { AdminMe } from '@/lib/adminApi'
import {
  deleteContentDoc,
  deleteContentExam,
  getContentExam,
  listContentDocs,
  listContentExams,
  listContentFeedback,
  listContentReports,
  markContentFeedbackRead,
  resolveContentReport,
  setContentExamStatus,
  type ContentDoc,
  type ContentExam,
  type ContentFeedback,
  type ContentReport,
  type ContentTopUserStorage,
} from '@/lib/adminContentApi'
import { formatViDate, formatViDateTime, shortenId } from './adminUtils'

interface ContentPanelProps {
  me: AdminMe
}

type TabKey = 'exams' | 'reports' | 'docs' | 'feedback'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ContentPanel({ me }: ContentPanelProps) {
  const isMod = me.role === 'moderator'
  const [tab, setTab] = useState<TabKey>('exams')

  // Nếu moderator vào tab chỉ admin, tự chuyển về 'exams'
  useEffect(() => {
    if (isMod && (tab === 'docs' || tab === 'feedback')) {
      setTab('exams')
    }
  }, [isMod, tab])

  const tabOptions = isMod
    ? [
        { key: 'exams' as const, label: 'Đề cộng đồng' },
        { key: 'reports' as const, label: 'Báo cáo vi phạm' },
      ]
    : [
        { key: 'exams' as const, label: 'Đề cộng đồng' },
        { key: 'reports' as const, label: 'Báo cáo vi phạm' },
        { key: 'docs' as const, label: 'Tài liệu tải lên' },
        { key: 'feedback' as const, label: 'Hòm thư góp ý' },
      ]

  return (
    <div className="w-full space-y-6">
      {/* Tiêu đề trang & Tabs */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Quản lý nội dung</h1>
          <p className="text-[13.5px] text-ink-3">
            Kiểm duyệt đề thi cộng đồng, xử lý báo cáo, quản lý tệp lưu trữ và góp ý người dùng.
          </p>
        </div>

        <div className="-mb-1 max-w-full overflow-x-auto pb-1">
          <Segmented
            value={tab}
            onChange={(val) => setTab(val)}
            options={tabOptions}
            label="Mục quản lý nội dung"
            className="max-w-none [&>button]:whitespace-nowrap"
          />
        </div>
      </div>

      {/* Nội dung theo từng tab */}
      {tab === 'exams' && <ExamsTab me={me} />}
      {tab === 'reports' && <ReportsTab me={me} />}
      {tab === 'docs' && !isMod && <DocsTab me={me} />}
      {tab === 'feedback' && !isMod && <FeedbackTab me={me} />}
    </div>
  )
}

// ==========================================
// TAB 1: ĐỀ CỘNG ĐỒNG
// ==========================================

const SUBJECTS_LIST = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Tin học',
  'GDCD',
  'Công nghệ',
]

const SUBJECT_FILTER_OPTIONS: ReadonlyArray<SiteSelectOption<string>> = [
  { value: '', label: 'Tất cả môn' },
  ...SUBJECTS_LIST.map((s) => ({ value: s, label: s })),
]
const STATUS_FILTER_OPTIONS: ReadonlyArray<SiteSelectOption<string>> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'hidden', label: 'Tạm ẩn' },
  { value: 'removed', label: 'Đã gỡ' },
]

function ExamsTab({ me }: { me: AdminMe }) {
  const [exams, setExams] = useState<ContentExam[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<ContentExam | null>(null)
  const perPage = 20

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const loadExams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listContentExams({
        q: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        subject: subjectFilter || undefined,
        page,
        perPage,
      })
      setExams(res.exams)
      setTotal(res.total)
      if (selectedExam) {
        const found = res.exams.find((e) => e.id === selectedExam.id)
        if (found) setSelectedExam(found)
      }
    } catch (err: unknown) {
      console.error('Lỗi tải danh sách đề:', err)
      const msg = err instanceof Error ? err.message : 'Không tải được đề thi'
      void dialog.alert(msg, { title: 'Lỗi nạp dữ liệu' })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, subjectFilter, page, selectedExam])

  useEffect(() => {
    void loadExams()
  }, [debouncedSearch, statusFilter, subjectFilter, page])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-4">
      {/* Bộ lọc */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-[8px] border border-line bg-surface p-3.5 shadow-xs lg:flex">
        <div className="relative min-w-0 lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc trường…"
            className={`${inputClass} h-11 pl-9 pr-9 text-[13.5px]`}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-4 hover:bg-sunken hover:text-ink"
              aria-label="Xoá tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <SiteSelect
          label="Lọc theo môn"
          value={subjectFilter}
          options={SUBJECT_FILTER_OPTIONS}
          onChange={(v) => {
            setSubjectFilter(v)
            setPage(1)
          }}
          className="col-span-2 min-w-0 lg:w-[180px]"
        />
        <SiteSelect
          label="Lọc theo trạng thái"
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
          className="col-span-2 min-w-0 lg:w-[200px]"
        />
        <Button variant="outline" size="icon" onClick={() => void loadExams()} title="Làm mới" aria-label="Làm mới" className="col-start-2 row-start-1 h-11 w-11 lg:order-last">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* Bảng danh sách đề */}
      <Card className="overflow-hidden border border-line shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
            <thead className="border-b border-line bg-sunken/80 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-4 py-3">Tiêu đề đề thi</th>
                <th className="px-4 py-3">Môn / Lớp</th>
                <th className="px-4 py-3">Người đăng</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Số câu</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Báo cáo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {loading && exams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-ink-3">
                    <Spinner className="mr-2 text-ink-3" />
                    <span>Đang nạp danh sách đề thi…</span>
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <EmptyState
                      title="Không tìm thấy đề thi"
                      description="Thử đổi từ khoá tìm kiếm hoặc bộ lọc trạng thái."
                    />
                  </td>
                </tr>
              ) : (
                exams.map((ex) => (
                  <tr
                    key={ex.id}
                    onClick={() => setSelectedExam(ex)}
                    className="cursor-pointer transition-colors hover:bg-sunken/50"
                  >
                    <td className="px-4 py-3">
                      <div className="max-w-[280px]">
                        <p className="truncate font-semibold text-ink" title={ex.title}>
                          {ex.title}
                        </p>
                        {ex.school ? (
                          <p className="truncate text-[12px] text-ink-3">{ex.school}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">
                      <span className="font-medium text-ink">{ex.subject}</span>
                      {ex.grade ? <span className="text-ink-3"> · {ex.grade}</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-3">
                      <span className="font-mono text-[12px]" title={ex.ownerEmail ?? ex.ownerId ?? ''}>
                        {ex.ownerEmail || (ex.ownerId ? shortenId(ex.ownerId) : 'Khách')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink-3">
                      {formatViDate(ex.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink tnum">
                      {ex.questionCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {ex.status === 'published' ? (
                        <Badge tone="sage">Đã xuất bản</Badge>
                      ) : ex.status === 'hidden' ? (
                        <Badge tone="honey">Tạm ẩn</Badge>
                      ) : (
                        <Badge tone="clay">Đã gỡ</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {ex.openReports > 0 ? (
                        <Badge tone="clay" className="inline-flex items-center gap-1 font-bold">
                          <AlertTriangle className="size-3" />
                          <span>{ex.openReports}</span>
                        </Badge>
                      ) : (
                        <span className="text-ink-4">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 ? (
          <div className="border-t border-line px-4 py-3">
            <Pager page={page} pages={totalPages} go={setPage} />
          </div>
        ) : null}
      </Card>

      {/* Drawer xem & kiểm duyệt đề thi */}
      {selectedExam ? (
        <ExamDrawer
          exam={selectedExam}
          me={me}
          onClose={() => setSelectedExam(null)}
          onUpdated={() => {
            void loadExams()
          }}
        />
      ) : null}
    </div>
  )
}

/** Ngăn kéo xem chi tiết & duyệt đề */
function ExamDrawer({
  exam,
  me,
  onClose,
  onUpdated,
}: {
  exam: ContentExam
  me: AdminMe
  onClose: () => void
  onUpdated: () => void
}) {
  const [detail, setDetail] = useState<any>(null)
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)

  useEffect(() => {
    let alive = true
    setLoadingDoc(true)
    getContentExam(exam.id)
      .then((res) => {
        if (!alive) return
        setDetail(res.exam)
      })
      .catch((err) => {
        if (!alive) return
        console.error('Lỗi tải chi tiết đề:', err)
      })
      .finally(() => {
        if (alive) setLoadingDoc(false)
      })
    return () => {
      alive = false
    }
  }, [exam.id])

  // Chuyển trạng thái: published / hidden
  const handleSetStatus = async (status: 'published' | 'hidden') => {
    setActionBusy(true)
    try {
      await setContentExamStatus(exam.id, status)
      onUpdated()
      void dialog.alert(
        status === 'published' ? 'Đề thi đã được hiển thị công khai.' : 'Đề thi đã được chuyển sang chế độ tạm ẩn.',
        { title: 'Thành công' },
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái'
      void dialog.alert(msg, { title: 'Thất bại' })
    } finally {
      setActionBusy(false)
    }
  }

  // Gỡ đề: bắt buộc hỏi lý do
  const handleRemove = async () => {
    const reason = await dialog.prompt('Nhập lý do gỡ bỏ đề thi này (bắt buộc):', {
      title: 'Gỡ đề thi khỏi cộng đồng',
      danger: true,
      placeholder: 'Ví dụ: Vi phạm bản quyền, nội dung không phù hợp...',
    })
    if (reason === null) return
    if (!reason.trim()) {
      void dialog.alert('Bạn cần cung cấp lý do cụ thể khi gỡ đề.', { title: 'Lỗi' })
      return
    }

    setActionBusy(true)
    try {
      await setContentExamStatus(exam.id, 'removed', reason.trim())
      onUpdated()
      void dialog.alert('Đã gỡ bỏ đề thi khỏi cộng đồng.', { title: 'Thành công' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi gỡ đề thi'
      void dialog.alert(msg, { title: 'Thất bại' })
    } finally {
      setActionBusy(false)
    }
  }

  // Xoá hẳn đề thi (chỉ admin)
  const handleDelete = async () => {
    const ok = await dialog.confirm(
      `Xoá vĩnh viễn đề thi "${exam.title}" khỏi cơ sở dữ liệu? Toàn bộ bài làm của học sinh cho đề này cũng sẽ bị xóa. Thao tác không thể hoàn tác.`,
      {
        title: 'Xoá vĩnh viễn đề thi',
        danger: true,
        confirmLabel: 'Xoá vĩnh viễn',
      },
    )
    if (!ok) return

    setActionBusy(true)
    try {
      await deleteContentExam(exam.id)
      onUpdated()
      onClose()
      void dialog.alert('Đã xoá hẳn đề thi khỏi hệ thống.', { title: 'Đã xoá' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xoá đề thi'
      void dialog.alert(msg, { title: 'Thất bại' })
    } finally {
      setActionBusy(false)
    }
  }

  const questions = detail?.doc?.blocks?.filter((b: any) => b.type === 'question') ?? []

  return (
    <Portal>
      <div
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-line bg-surface shadow-2xl transition-transform sm:w-[540px] md:w-[640px]"
        role="dialog"
        aria-label="Chi tiết đề thi"
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[16px] font-bold text-ink" title={exam.title}>
                {exam.title}
              </h2>
              {exam.status === 'published' ? (
                <Badge tone="sage">Đã xuất bản</Badge>
              ) : exam.status === 'hidden' ? (
                <Badge tone="honey">Tạm ẩn</Badge>
              ) : (
                <Badge tone="clay">Đã gỡ</Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-[12.5px] text-ink-3">
              Môn: {exam.subject} · {exam.grade} · {exam.school || 'Chưa ghi trường'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-ink-3 hover:bg-sunken hover:text-ink"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Thanh tác vụ kiểm duyệt */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line-2 bg-sunken/40 px-6 py-3">
          {exam.status === 'published' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSetStatus('hidden')}
                disabled={actionBusy}
              >
                Tạm ẩn
              </Button>
              <Button
                variant="soft"
                size="sm"
                onClick={() => void handleRemove()}
                disabled={actionBusy}
                className="text-clay hover:bg-clay-soft"
              >
                Gỡ đề
              </Button>
            </>
          ) : exam.status === 'hidden' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSetStatus('published')}
                disabled={actionBusy}
              >
                Hiện lại
              </Button>
              <Button
                variant="soft"
                size="sm"
                onClick={() => void handleRemove()}
                disabled={actionBusy}
                className="text-clay hover:bg-clay-soft"
              >
                Gỡ đề
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSetStatus('published')}
              disabled={actionBusy}
            >
              Phục hồi (Hiện lại)
            </Button>
          )}

          {me.role === 'admin' ? (
            <div className="ml-auto">
              <Button
                variant="clay"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={actionBusy}
              >
                <Trash2 className="size-3.5" />
                <span>Xoá hẳn</span>
              </Button>
            </div>
          ) : null}
        </div>

        {/* Thân Drawer */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-[13.5px]">
          {/* Thông tin kiểm duyệt nếu bị gỡ */}
          {exam.status === 'removed' ? (
            <div className="rounded-[8px] border border-clay/30 bg-clay-soft/40 p-4 text-[13px] text-clay">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4" />
                <span>Đề thi đã bị gỡ khỏi cộng đồng</span>
              </div>
              <p className="mt-1 text-ink-2">
                <strong>Lý do:</strong> {exam.removedReason || 'Vi phạm điều khoản cộng đồng'}
              </p>
              {exam.moderatedAt ? (
                <p className="mt-1 text-[11.5px] text-ink-3">
                  Thời gian gỡ: {formatViDateTime(exam.moderatedAt)}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Thông tin tổng quan */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
              Thông tin đề thi
            </h3>
            <div className="grid grid-cols-2 gap-3 rounded-[8px] border border-line-2 bg-sunken/40 p-4">
              <div>
                <span className="block text-[12px] text-ink-3">Người đăng</span>
                <span className="font-mono text-[12px] font-medium text-ink">
                  {exam.ownerEmail || (exam.ownerId ? shortenId(exam.ownerId) : 'Khách')}
                </span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Ngày tạo</span>
                <span className="font-medium text-ink">{formatViDateTime(exam.createdAt)}</span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Thời gian làm bài</span>
                <span className="font-medium text-ink">{exam.durationMinutes} phút</span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Tổng điểm</span>
                <span className="font-medium text-ink">{exam.totalPoints} điểm</span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Số lượng câu</span>
                <span className="font-medium text-ink">{exam.questionCount} câu</span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Số báo cáo mở</span>
                <span className="font-medium text-ink">
                  {exam.openReports > 0 ? (
                    <span className="font-bold text-clay">{exam.openReports} báo cáo</span>
                  ) : (
                    '0'
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Xem trước nội dung câu hỏi */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
              Nội dung đề thi
            </h3>

            {loadingDoc ? (
              <div className="flex items-center justify-center py-8 text-ink-3">
                <Spinner className="mr-2" />
                <span>Đang tải nội dung đề…</span>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((q: any, idx: number) => (
                  <div
                    key={q.id || idx}
                    className="rounded-[8px] border border-line bg-surface p-4 text-[13px]"
                  >
                    <p className="font-semibold text-ink">
                      Câu {idx + 1}: {q.prompt}
                    </p>
                    {Array.isArray(q.choices) ? (
                      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {q.choices.map((c: string, ci: number) => {
                          const letter = String.fromCharCode(65 + ci)
                          const isCorrect = q.answer === letter || q.answer === c
                          return (
                            <div
                              key={ci}
                              className={`rounded-[4px] px-2.5 py-1 text-[12.5px] ${
                                isCorrect
                                  ? 'bg-sage-soft font-semibold text-sage border border-sage/30'
                                  : 'bg-sunken text-ink-2'
                              }`}
                            >
                              <span className="font-bold mr-1">{letter}.</span> {c}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[8px] border border-line-2 bg-sunken/40 p-4">
                <p className="text-ink-2 font-medium">Trích đoạn xem trước:</p>
                <p className="mt-1 text-ink-3">{exam.preview || 'Không có bản xem trước'}</p>
              </div>
            )}
          </section>
        </div>
      </aside>
    </Portal>
  )
}

// ==========================================
// TAB 2: BÁO CÁO VI PHẠM
// ==========================================

function ReportsTab({ me: _me }: { me: AdminMe }) {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'dismissed' | ''>('open')
  const [loading, setLoading] = useState(true)
  const perPage = 20

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listContentReports({
        status: statusFilter || undefined,
        page,
        perPage,
      })
      setReports(res.reports)
      setTotal(res.total)
    } catch (err: unknown) {
      console.error('Lỗi tải báo cáo:', err)
      const msg = err instanceof Error ? err.message : 'Không tải được báo cáo'
      void dialog.alert(msg, { title: 'Lỗi nạp dữ liệu' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    void loadReports()
  }, [statusFilter, page])

  const handleResolve = async (reportId: number, status: 'resolved' | 'dismissed') => {
    try {
      await resolveContentReport(reportId, status)
      void loadReports()
      void dialog.alert(
        status === 'resolved' ? 'Đã đánh dấu báo cáo là đã xử lý.' : 'Đã bỏ qua báo cáo.',
        { title: 'Thành công' },
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật'
      void dialog.alert(msg, { title: 'Thất bại' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-4">
      {/* Bộ lọc trạng thái báo cáo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-line bg-surface p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-ink-3">Trạng thái:</span>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('open')
              setPage(1)
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              statusFilter === 'open' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            Chờ xử lý (Mở)
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('resolved')
              setPage(1)
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              statusFilter === 'resolved' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            Đã xử lý
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('dismissed')
              setPage(1)
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              statusFilter === 'dismissed' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            Đã bỏ qua
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('')
              setPage(1)
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              statusFilter === '' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            Tất cả
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={() => void loadReports()} title="Làm mới">
          <RefreshCw className="size-3.5" />
          <span>Tải lại</span>
        </Button>
      </div>

      {/* Bảng danh sách báo cáo */}
      <Card className="overflow-hidden border border-line shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
            <thead className="border-b border-line bg-sunken/80 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-4 py-3">Ngày gửi</th>
                <th className="px-4 py-3">Đề thi bị báo cáo</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Chi tiết</th>
                <th className="px-4 py-3">Người báo cáo</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {loading && reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-ink-3">
                    <Spinner className="mr-2 text-ink-3" />
                    <span>Đang tải danh sách báo cáo…</span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <EmptyState
                      title="Không có báo cáo nào"
                      description="Hàng đợi báo cáo hiện đang trống."
                    />
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-sunken/40">
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-ink-3">
                      {formatViDateTime(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[220px]">
                        <p className="truncate font-semibold text-ink" title={r.examTitle}>
                          {r.examTitle}
                        </p>
                        <a
                          href={`/de/${r.examId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11.5px] text-clay hover:underline"
                        >
                          <Eye className="size-3" />
                          <span>Mở trang đề</span>
                        </a>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={r.reason === 'Sai đáp án' ? 'honey' : 'clay'}>
                        {r.reason}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[260px] line-clamp-2 text-[12.5px] text-ink-2" title={r.detail || ''}>
                        {r.detail || '—'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-ink-3">
                      {r.reporterEmail || (r.reporterId ? shortenId(r.reporterId) : 'Ẩn danh')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {r.status === 'open' ? (
                        <Badge tone="clay">Chờ xử lý</Badge>
                      ) : r.status === 'resolved' ? (
                        <Badge tone="sage">Đã xử lý</Badge>
                      ) : (
                        <Badge tone="neutral">Đã bỏ qua</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {r.status === 'open' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => void handleResolve(r.id, 'resolved')}
                            className="text-[12px]"
                          >
                            <Check className="size-3" />
                            <span>Đã xử lý</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleResolve(r.id, 'dismissed')}
                            className="text-[12px]"
                          >
                            Bỏ qua
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-ink-4">Hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="border-t border-line px-4 py-3">
            <Pager page={page} pages={totalPages} go={setPage} />
          </div>
        ) : null}
      </Card>
    </div>
  )
}

// ==========================================
// TAB 3: TÀI LIỆU TẢI LÊN (CHỈ ADMIN)
// ==========================================

function DocsTab({ me: _me }: { me: AdminMe }) {
  const [docs, setDocs] = useState<ContentDoc[]>([])
  const [topUsers, setTopUsers] = useState<ContentTopUserStorage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const perPage = 20

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listContentDocs({
        q: debouncedSearch.trim() || undefined,
        page,
        perPage,
      })
      setDocs(res.docs)
      setTotal(res.total)
      setTopUsers(res.topUsers || [])
    } catch (err: unknown) {
      console.error('Lỗi tải danh sách tài liệu:', err)
      const msg = err instanceof Error ? err.message : 'Không tải được tài liệu'
      void dialog.alert(msg, { title: 'Lỗi nạp dữ liệu' })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    void loadDocs()
  }, [debouncedSearch, page])

  const handleDelete = async (doc: ContentDoc) => {
    const ok = await dialog.confirm(
      `Xoá tài liệu "${doc.name}" khỏi hệ thống? Nếu không còn ai dùng chung tệp, file trên đám mây R2 cũng sẽ bị xoá.`,
      {
        title: 'Xoá tài liệu',
        danger: true,
        confirmLabel: 'Xoá tài liệu',
      },
    )
    if (!ok) return

    try {
      const res = await deleteContentDoc(doc.id)
      void loadDocs()
      const extra = res.r2Removed ? ' (đã dọn sạch tệp trên R2)' : ' (vẫn còn bản sao dùng chung)'
      void dialog.alert(`Đã xoá tài liệu${extra}.`, { title: 'Đã xoá' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xoá tài liệu'
      void dialog.alert(msg, { title: 'Thất bại' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      {/* Khối Dung lượng theo người (Top 20) */}
      <Card className="border border-line p-5 shadow-soft">
        <div className="flex items-center gap-2 pb-3">
          <HardDrive className="size-4.5 text-clay" />
          <h2 className="text-[15px] font-bold text-ink">
            Dung lượng lưu trữ theo người dùng (Top 20)
          </h2>
        </div>

        {topUsers.length === 0 ? (
          <p className="text-[13px] text-ink-3">Chưa có người dùng nào tải lên tài liệu.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2 pt-1">
              {topUsers.map((u, i) => (
                <div
                  key={u.ownerId}
                  className="flex shrink-0 min-w-[200px] flex-col justify-between rounded-[8px] border border-line-2 bg-sunken/40 p-3 text-[12.5px]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink-3">#{i + 1}</span>
                      <span className="font-semibold text-clay">{formatBytes(u.totalSize)}</span>
                    </div>
                    <p className="mt-1 truncate font-medium text-ink" title={u.name || u.email}>
                      {u.name || u.email}
                    </p>
                    <p className="truncate text-[11px] text-ink-3">{u.email}</p>
                  </div>
                  <div className="mt-2 border-t border-line-2 pt-1 text-[11px] text-ink-3">
                    {u.docCount} tệp tải lên
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Tìm kiếm & Bảng danh sách tệp */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 rounded-[8px] border border-line bg-surface p-3.5 shadow-xs">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên tệp hoặc email…"
              className={`${inputClass} h-11 pl-9 pr-9 text-[13.5px]`}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-4 hover:bg-sunken hover:text-ink"
                aria-label="Xoá tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <Button variant="outline" size="icon" onClick={() => void loadDocs()} title="Làm mới" aria-label="Làm mới" className="h-11 w-11">
            <RefreshCw className="size-4" />
            <span>Tải lại</span>
          </Button>
        </div>

        <Card className="overflow-hidden border border-line shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
              <thead className="border-b border-line bg-sunken/80 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
                <tr>
                  <th className="px-4 py-3">Tên tệp</th>
                  <th className="px-4 py-3">Người tải</th>
                  <th className="px-4 py-3">Môn học</th>
                  <th className="px-4 py-3 text-right">Dung lượng</th>
                  <th className="px-4 py-3">Ngày tải</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {loading && docs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-ink-3">
                      <Spinner className="mr-2 text-ink-3" />
                      <span>Đang nạp danh sách tài liệu…</span>
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <EmptyState
                        title="Không có tài liệu nào"
                        description="Chưa có tệp tải lên hoặc không khớp từ khóa tìm kiếm."
                      />
                    </td>
                  </tr>
                ) : (
                  docs.map((d) => (
                    <tr key={d.id} className="transition-colors hover:bg-sunken/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <FileText className="size-4 shrink-0 text-clay" />
                          <div className="max-w-[280px]">
                            <p className="truncate font-semibold text-ink" title={d.name}>
                              {d.name}
                            </p>
                            <span className="text-[11px] text-ink-3 font-mono">{d.mime}</span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink-2">
                        {d.ownerEmail}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-3">
                        {d.subject || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink tnum">
                        {formatBytes(d.size)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-ink-3">
                        {formatViDate(d.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(d)}
                          className="text-ink-3 hover:text-clay"
                          title="Xoá tài liệu"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="hidden sm:inline">Xoá</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="border-t border-line px-4 py-3">
              <Pager page={page} pages={totalPages} go={setPage} />
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

// ==========================================
// TAB 4: HÒM THƯ GÓP Ý (CHỈ ADMIN)
// ==========================================

function FeedbackTab({ me: _me }: { me: AdminMe }) {
  const [feedback, setFeedback] = useState<ContentFeedback[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [loading, setLoading] = useState(true)
  const perPage = 20

  const loadFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const readParam = readFilter === 'all' ? undefined : readFilter === 'read'
      const res = await listContentFeedback({
        read: readParam,
        page,
        perPage,
      })
      setFeedback(res.feedback)
      setTotal(res.total)
    } catch (err: unknown) {
      console.error('Lỗi tải góp ý:', err)
      const msg = err instanceof Error ? err.message : 'Không tải được hòm thư góp ý'
      void dialog.alert(msg, { title: 'Lỗi nạp dữ liệu' })
    } finally {
      setLoading(false)
    }
  }, [readFilter, page])

  useEffect(() => {
    void loadFeedback()
  }, [readFilter, page])

  const handleToggleRead = async (f: ContentFeedback) => {
    const nextRead = !f.read
    try {
      await markContentFeedbackRead(f.id, nextRead)
      setFeedback((prev) =>
        prev.map((item) => (item.id === f.id ? { ...item, read: nextRead } : item)),
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đánh dấu'
      void dialog.alert(msg, { title: 'Thất bại' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-4">
      {/* Bộ lọc đã đọc / chưa đọc */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-line bg-surface p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-ink-3">Trạng thái:</span>
          <button
            type="button"
            onClick={() => {
              setReadFilter('all')
              setPage(1)
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              readFilter === 'all' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => {
              setReadFilter('unread')
              setPage(1)
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              readFilter === 'unread' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            Chưa đọc
          </button>
          <button
            type="button"
            onClick={() => {
              setReadFilter('read')
              setPage(1)
            }}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              readFilter === 'read' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            Đã đọc
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={() => void loadFeedback()} title="Làm mới">
          <RefreshCw className="size-3.5" />
          <span>Tải lại</span>
        </Button>
      </div>

      {/* Danh sách góp ý */}
      <Card className="overflow-hidden border border-line shadow-soft">
        <div className="divide-y divide-line-2">
          {loading && feedback.length === 0 ? (
            <div className="py-16 text-center text-ink-3">
              <Spinner className="mr-2 text-ink-3" />
              <span>Đang tải danh sách góp ý…</span>
            </div>
          ) : feedback.length === 0 ? (
            <div className="py-12 text-center">
              <EmptyState
                title="Hòm thư góp ý trống"
                description="Chưa có phản hồi hoặc góp ý nào từ người dùng."
              />
            </div>
          ) : (
            feedback.map((f) => (
              <div
                key={f.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between transition-colors ${
                  !f.read ? 'bg-clay-soft/15 hover:bg-clay-soft/25' : 'hover:bg-sunken/40'
                }`}
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {!f.read ? (
                      <span className="inline-block size-2 rounded-full bg-clay" title="Chưa đọc" />
                    ) : null}
                    <span className={`text-[13.5px] ${!f.read ? 'font-bold text-ink' : 'font-medium text-ink-2'}`}>
                      {f.email || 'Khách ẩn danh'}
                    </span>
                    {f.page ? (
                      <span className="rounded bg-sunken px-2 py-0.5 text-[11px] font-mono text-ink-3">
                        {f.page}
                      </span>
                    ) : null}
                    <span className="text-[12px] text-ink-4">
                      {formatViDateTime(f.createdAt)}
                    </span>
                  </div>

                  <p
                    className={`whitespace-pre-wrap text-[13.5px] leading-relaxed ${
                      !f.read ? 'font-medium text-ink' : 'text-ink-2'
                    }`}
                  >
                    {f.message}
                  </p>
                </div>

                <div className="shrink-0 pt-1 sm:pt-0">
                  <Button
                    variant={f.read ? 'outline' : 'soft'}
                    size="sm"
                    onClick={() => void handleToggleRead(f)}
                    className="text-[12px]"
                  >
                    {f.read ? (
                      <span>Đánh dấu chưa đọc</span>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        <span>Đã đọc</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <div className="border-t border-line px-4 py-3">
            <Pager page={page} pages={totalPages} go={setPage} />
          </div>
        ) : null}
      </Card>
    </div>
  )
}
