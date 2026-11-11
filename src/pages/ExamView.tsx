import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, FileText, Flag, MonitorPlay, Printer, Save, Sparkles, X } from 'lucide-react'
import { Badge, Button, EmptyState, inputClass } from '@/components/ui'
import { SiteSelect } from '@/components/SiteSelect'
import { ExamEditor, A4_PORTRAIT_W } from '@/examEditor/ExamEditor'
import { blocksToTipTap } from '@/examEditor/convert'
import type { ExamBlock } from '@/data/docTypes'
import { useApp } from '@/store/app'
import { COMMUNITY_EXAMS } from '@/data/community'
import { exportDocx } from '@/lib/exportDocx'
import { totalPoints } from '@/data/types'
import { formatPoints } from '@/lib/math'
import { examToDoc } from '@/lib/exportDocx'
import { examToDraft } from '@/lib/onlineExam'
import { isRemoteExamId } from '@/lib/attempts'
import { getCommunityDoc, submitReport } from '@/lib/community'
import { currentSession } from '@/lib/auth'
import { useDocStore } from '@/store/docs'
import { useComposeStore } from '@/store/compose'
import { useOnline } from '@/store/online'
import { dialog } from '@/components/Dialog'
import type { Exam } from '@/data/types'

export default function ExamView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const myExams = useApp((s) => s.myExams)
  const importExam = useApp((s) => s.importExam)
  const startQuiz = useApp((s) => s.startQuiz)

  const exam = useMemo(
    () => myExams.find((e) => e.id === id) ?? COMMUNITY_EXAMS.find((e) => e.id === id),
    [id, myExams],
  )

  if (!exam) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          title="Không tìm thấy đề"
          description="Đề này không tồn tại hoặc đã bị gỡ bỏ."
          action={
            <Link to="/de-cong-dong">
              <Button variant="primary">Về kho đề</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isMine = myExams.some((e) => e.id === id)

  const handleInteractive = () => {
    if (!isMine) {
      const importedId = importExam(exam)
      useApp.getState().startQuiz(importedId)
      navigate(`/lam-de/${importedId}`)
      return
    }
    startQuiz(exam.id)
    navigate(`/lam-de/${exam.id}`)
  }

  return (
    <div className="print-root bg-sunken/35">
      <div className="no-print sticky top-[68px] z-30 border-b border-line/70 bg-canvas/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1140px] flex-wrap items-center gap-2.5 px-5 sm:px-6">
          <Link
            to="/de-cong-dong"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink-2 shadow-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] font-semibold text-ink">{exam.title}</p>
            <p className="mt-0.5 text-[12px] font-medium text-ink-3 tnum">
              {exam.sections.reduce((n, s) => n + s.questions.length, 0)} câu ·{' '}
              {formatPoints(totalPoints(exam))}đ · {exam.durationMinutes} phút
            </p>
          </div>

          <Badge tone="neutral" className="hidden shrink-0 sm:inline-flex">
            {exam.subject}
          </Badge>

          <SaveMenu exam={exam} />

          <Button variant="soft" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            <span className="hidden md:inline">In</span>
          </Button>

          <Button variant="soft" size="sm" onClick={() => void exportDocx(exam)}>
            <Download className="size-3.5" />
            <span className="hidden md:inline">Word</span>
          </Button>

          <Button variant="clay" size="sm" onClick={handleInteractive}>
            <MonitorPlay className="size-3.5" />
            <span className="hidden sm:inline">Chuyển sang đề tương tác</span>
            <span className="sm:hidden">Làm đề</span>
          </Button>

          {id && isRemoteExamId(id) ? <ReportExamButton examId={id} /> : null}
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6">
        <DocView exam={exam} />
      </div>
    </div>
  )
}

/** Nút Lưu: sao đề về Tạo đề online hoặc về trình soạn để chỉnh sửa. Luôn là bản sao, đề gốc không đổi. */
function SaveMenu({ exam }: { exam: Exam }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const toOnline = () => {
    const draft = examToDraft(exam)
    navigate(`/tao-de-online/${useOnline.getState().create(draft)}`)
  }

  const toEditor = async () => {
    setBusy(true)
    try {
      // đề đăng từ trình soạn: lấy nguyên khối gốc để giữ định dạng; đề tạo online thì dựng lại từ câu hỏi
      const remote = isRemoteExamId(exam.importedFrom) ? await getCommunityDoc(exam.importedFrom).catch(() => null) : null
      const base = remote?.blocks.length ? remote : examToDoc(exam, { withAnswers: true })
      const now = new Date().toISOString()
      const doc = { ...base, id: Math.random().toString(36).slice(2, 10), online: undefined, kind: 'exam' as const, createdAt: now, updatedAt: now }
      useDocStore.getState().saveDocById(doc)
      useComposeStore.getState().openDoc(doc)
      navigate('/soan-de', { state: { openTab: true } })
    } catch (err) {
      void dialog.alert(err instanceof Error ? err.message : 'Không lưu được đề, thử lại sau.')
    } finally {
      setBusy(false)
    }
  }

  const item = 'flex w-full items-start gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors hover:bg-sunken disabled:opacity-50'
  return (
    <div ref={ref} className="relative">
      <Button variant="soft" size="sm" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} disabled={busy}>
        <Save className="size-3.5" />
        <span className="hidden md:inline">{busy ? 'Đang lưu…' : 'Lưu'}</span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open ? (
        <div role="menu" className="anim-sheet absolute right-0 top-full z-40 mt-2 w-[280px] rounded-[8px] bg-surface p-1.5 shadow-float">
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); toOnline() }}>
            <Sparkles className="mt-0.5 size-4 shrink-0 text-clay" />
            <span>
              <span className="block text-[13.5px] font-semibold text-ink">Lưu vào đề online</span>
              <span className="block text-[12px] text-ink-3">Bản sao trong Tạo đề online, sửa rồi cho học sinh làm.</span>
            </span>
          </button>
          <button type="button" role="menuitem" className={item} disabled={busy} onClick={() => { setOpen(false); void toEditor() }}>
            <FileText className="mt-0.5 size-4 shrink-0 text-clay" />
            <span>
              <span className="block text-[13.5px] font-semibold text-ink">Lưu vào trình soạn thảo</span>
              <span className="block text-[12px] text-ink-3">Mở bản sao trong trình soạn để chỉnh sửa, in, xuất Word.</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Đề hiển thị đúng như trong trình soạn (giấy A4, kiểu chữ Word), chỉ đọc.
 * Đề đăng từ trình soạn: dùng nguyên khối gốc; đề tạo online/đề mẫu: dựng khối từ câu hỏi như khi xuất Word.
 */
function DocView({ exam }: { exam: Exam }) {
  const [blocks, setBlocks] = useState<ExamBlock[] | null>(null)
  const [zoom, setZoom] = useState(1)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    const fallback = () => examToDoc(exam).blocks
    if (!isRemoteExamId(exam.importedFrom)) setBlocks(fallback())
    else
      getCommunityDoc(exam.importedFrom)
        .then((d) => alive && setBlocks(d.blocks.length ? d.blocks : fallback()))
        .catch(() => alive && setBlocks(fallback()))
    return () => {
      alive = false
    }
  }, [exam])

  // co trang A4 cho vừa khung hẹp, giống auto-fit của trình soạn
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(() => setZoom(Math.min(1, box.clientWidth / A4_PORTRAIT_W)))
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  const content = useMemo(() => (blocks ? blocksToTipTap(blocks) : null), [blocks])
  return (
    <div ref={boxRef} className="flex justify-center">
      {content ? (
        // trang giấy và lớp chữ đều absolute → phải đặt bề rộng A4 cho khung, không thì nó co về 0
        <div style={{ zoom, width: A4_PORTRAIT_W }}>
          <ExamEditor content={content} onChange={() => {}} readOnly />
        </div>
      ) : (
        <div className="h-[1123px] w-full max-w-[794px] animate-pulse rounded-[4px] bg-surface" />
      )}
    </div>
  )
}

/** Nút báo cáo vi phạm nhỏ, kín đáo ở trang xem đề cộng đồng */
function ReportExamButton({ examId }: { examId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('Sai đáp án')
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleOpen = async () => {
    const s = await currentSession()
    if (!s) {
      void dialog.alert('Bạn cần đăng nhập để gửi báo cáo vi phạm.', { title: 'Yêu cầu đăng nhập' })
      return
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitReport({ examId, reason, detail })
      setOpen(false)
      setDetail('')
      void dialog.alert('Cảm ơn bạn đã gửi báo cáo. Ban quản trị sẽ sớm xem xét và xử lý.', {
        title: 'Đã gửi báo cáo',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không gửi được báo cáo.'
      void dialog.alert(msg, { title: 'Lỗi' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        title="Báo cáo đề này"
        className="text-ink-4 hover:text-clay"
      >
        <Flag className="size-3.5" />
        <span className="hidden xl:inline">Báo cáo</span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-[10px] border border-line bg-surface p-6 shadow-float anim-sheet"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-[16px] font-bold text-ink">Báo cáo vi phạm đề thi</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-ink-3 hover:bg-sunken hover:text-ink"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-[13.5px]">
              <div>
                <label className="mb-1 block font-medium text-ink-2">Lý do báo cáo</label>
                <SiteSelect
                  label="Lý do báo cáo"
                  value={reason}
                  options={['Sai đáp án', 'Nội dung không phù hợp', 'Spam', 'Vi phạm bản quyền', 'Khác'].map((r) => ({ value: r, label: r }))}
                  onChange={setReason}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink-2">
                  Chi tiết vi phạm <span className="font-normal text-ink-4">(tùy chọn)</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Mô tả cụ thể câu hỏi bị sai hoặc vấn đề gặp phải..."
                  className={`${inputClass} w-full resize-none py-2`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={submitting}>
                  Huỷ
                </Button>
                <Button type="submit" variant="clay" size="sm" disabled={submitting}>
                  {submitting ? 'Đang gửi…' : 'Gửi báo cáo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
