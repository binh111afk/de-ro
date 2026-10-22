import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, MonitorPlay, Printer } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui'
import { ExamSheet } from '@/components/ExamSheet'
import { useApp } from '@/store/app'
import { COMMUNITY_EXAMS } from '@/data/community'
import { exportDocx } from '@/lib/exportDocx'
import { totalPoints } from '@/data/types'
import { formatPoints } from '@/lib/math'

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
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6">
        <ExamSheet exam={exam} />
      </div>
    </div>
  )
}
