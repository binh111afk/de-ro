import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Clock,
  Flag,
  LayoutGrid,
  RotateCcw,
  Send,
  Trophy,
  X,
} from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui'
import { MathText } from '@/components/MathText'
import { useApp } from '@/store/app'
import { QUESTION_STATES } from '@/data/questions'
import { cn } from '@/lib/cn'
import { formatPoints } from '@/lib/math'
import type { Question } from '@/data/types'

export default function Quiz() {
  const { id } = useParams<{ id: string }>()
  const myExams = useApp((s) => s.myExams)
  const answers = useApp((s) => s.quizAnswers)
  const setAnswer = useApp((s) => s.setAnswer)
  const submitted = useApp((s) => s.quizSubmitted)
  const lastResult = useApp((s) => s.lastResult)
  const submitQuiz = useApp((s) => s.submitQuiz)
  const resetQuiz = useApp((s) => s.resetQuiz)
  const startQuiz = useApp((s) => s.startQuiz)

  const exam = myExams.find((e) => e.id === id)

  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [showGrid, setShowGrid] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const timerRef = useRef<number | null>(null)

  const questions = useMemo(
    () => (exam ? exam.sections.flatMap((s) => s.questions) : []),
    [exam],
  )

  useEffect(() => {
    if (!showGrid) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGrid(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showGrid])

  useEffect(() => {
    if (!exam || questions.length === 0) return
    if (!submitted) startQuiz(exam.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id])

  useEffect(() => {
    if (!exam || submitted) return
    const total = exam.durationMinutes * 60
    setRemaining((r) => r ?? total)

    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r === null) return r
        if (r <= 1) {
          window.clearInterval(timerRef.current!)
          submitQuiz()
          return 0
        }
        return r - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id, submitted])

  if (!exam) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          icon={<AlertCircle className="size-6" strokeWidth={1.6} />}
          title="Không tìm thấy đề thi"
          description="Đề có thể đã bị xoá, hoặc bạn chưa mở đề này trong danh sách của mình."
          action={
            <Link to="/de-cong-dong">
              <Button variant="primary">Xem đề cộng đồng</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          icon={<CircleHelp className="size-6" strokeWidth={1.6} />}
          title="Đề chưa có câu hỏi"
          description="Hãy soạn đề trước khi chuyển sang chế độ làm bài."
          action={
            <Link to="/soan-de">
              <Button variant="primary">Đi soạn đề</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const current = questions[index]
  const answered = Object.keys(answers).length
  const totalPoints = questions.reduce((n, q) => n + q.points, 0)

  const handleSubmit = () => {
    submitQuiz()
    setConfirm(false)
  }

  const handleRestart = () => {
    resetQuiz()
    setIndex(0)
    setFlagged(new Set())
    setConfirm(false)
    startQuiz(exam.id)
  }

  if (submitted && lastResult) {
    return (
      <ResultView
        examTitle={exam.title}
        score={lastResult.score}
        totalPoints={totalPoints}
        questions={questions}
        answers={answers}
        onRestart={handleRestart}
        onReview={() => {
          resetQuiz()
          setIndex(0)
        }}
      />
    )
  }

  const mm = String(Math.floor((remaining ?? 0) / 60)).padStart(2, '0')
  const ss = String((remaining ?? 0) % 60).padStart(2, '0')
  const low = (remaining ?? 0) <= 60

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-sunken/35">
      {/* status bar */}
      <div className="sticky top-[68px] z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1140px] items-center gap-3 px-5 sm:px-6">
          <Link
            to="/de-cong-dong"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink-2 shadow-soft transition-colors hover:text-ink"
            title="Thoát"
          >
            <X className="size-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] font-semibold text-ink">{exam.title}</p>
            <p className="mt-0.5 text-[12px] font-medium text-ink-3 tnum">
              Câu {index + 1}/{questions.length} · {answered} đã trả lời
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGrid(true)}
            className="hidden items-center gap-2 rounded-full bg-cream px-3.5 py-2 text-[13px] font-semibold text-ink-2 shadow-soft transition-colors hover:text-ink sm:flex"
          >
            <LayoutGrid className="size-3.5" />
            Lưới câu
          </button>

          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[13.5px] font-bold tabular-nums transition-colors duration-500',
              low ? 'bg-clay-soft text-clay' : 'bg-cream text-ink shadow-soft',
            )}
            title="Thời gian còn lại"
          >
            <Clock className="size-3.5" />
            {mm}:{ss}
          </div>

          <Button variant="clay" size="sm" onClick={() => setConfirm(true)}>
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Nộp bài</span>
          </Button>
        </div>

        <div className="h-1 w-full bg-veil">
          <div
            className="h-full rounded-r-full bg-clay transition-[width] duration-500 ease-out"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1140px] px-5 py-9 sm:px-6">
        <div className="grid gap-7 lg:grid-cols-[1fr_272px]">
          <div>
            <QuestionCard
              question={current}
              index={index}
              total={questions.length}
              chosen={answers[current.id]}
              onAnswer={(v) => setAnswer(current.id, v)}
              flagged={flagged.has(current.id)}
              onToggleFlag={() =>
                setFlagged((f) => {
                  const next = new Set(f)
                  if (next.has(current.id)) next.delete(current.id)
                  else next.add(current.id)
                  return next
                })
              }
            />

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="soft"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                <ArrowLeft className="size-4" />
                Câu trước
              </Button>
              <Button
                variant="primary"
                onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={index === questions.length - 1}
              >
                Câu sau
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-[148px] rounded-[6px] bg-surface p-5 shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
              <p className="eyebrow mb-4">Lưới câu hỏi</p>
              <div className="grid grid-cols-6 gap-1.5">
                {questions.map((q, i) => {
                  const state = QUESTION_STATES.answered(answers[q.id])
                    ? 'answered'
                    : i === index
                      ? 'current'
                      : 'blank'
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={cn(
                        'tnum flex size-9 items-center justify-center rounded-[5px] text-[12px] font-bold transition-all duration-200',
                        state === 'answered'
                          ? 'bg-sage-soft text-sage'
                          : state === 'current'
                            ? 'bg-ink text-paper shadow-[0_4px_12px_-4px_rgba(35,32,28,0.6)]'
                            : 'bg-sunken text-ink-3 hover:bg-veil',
                      )}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 space-y-2 border-t border-line-2 pt-4">
                <LegendRow className="bg-sage-soft text-sage" label="Đã trả lời" />
                <LegendRow className="bg-ink text-paper" label="Đang xem" />
                <LegendRow className="bg-sunken text-ink-3" label="Chưa làm" />
              </div>

              <div className="mt-5 space-y-2 border-t border-line-2 pt-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-ink-3">Đã làm</span>
                  <span className="tnum font-bold text-ink">
                    {answered}/{questions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-3">Tổng điểm</span>
                  <span className="tnum font-bold text-ink">{formatPoints(totalPoints)}đ</span>
                </div>
              </div>

              <Button variant="soft" size="sm" className="mt-5 w-full" onClick={() => setShowGrid(true)}>
                <LayoutGrid className="size-3.5" />
                Mở lưới câu hỏi
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* question grid drawer */}
      {showGrid ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowGrid(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-t-[28px] bg-canvas p-6 shadow-float anim-sheet sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-display text-[19px] font-semibold text-ink">Lưới câu hỏi</p>
                <p className="mt-1 text-[12.5px] font-medium text-ink-3 tnum">
                  {answered}/{questions.length} đã trả lời
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGrid(false)}
                className="flex size-9 items-center justify-center rounded-full bg-sunken text-ink-2 transition-colors hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
              {questions.map((q, i) => {
                const isAnswered = Boolean(answers[q.id])
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setIndex(i)
                      setShowGrid(false)
                    }}
                    className={cn(
                      'tnum relative flex size-10 items-center justify-center rounded-[6px] text-[12.5px] font-bold transition-all duration-200',
                      isAnswered
                        ? 'bg-sage-soft text-sage'
                        : i === index
                          ? 'bg-ink text-paper'
                          : 'bg-sunken text-ink-3 hover:bg-veil',
                    )}
                  >
                    {i + 1}
                    {flagged.has(q.id) ? (
                      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-paper bg-clay" />
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex gap-2.5">
              <Button variant="soft" className="flex-1" onClick={() => setShowGrid(false)}>
                Đóng
              </Button>
              <Button variant="clay" className="flex-1" onClick={() => setConfirm(true)}>
                <Send className="size-4" />
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* submit confirm */}
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[400px] rounded-[8px] bg-canvas p-6 shadow-float anim-sheet">
            <p className="font-display text-[20px] font-semibold text-ink">Nộp bài thi?</p>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">
              Bạn đã trả lời{' '}
              <span className="font-bold text-ink tnum">
                {answered}/{questions.length}
              </span>{' '}
              câu.
              {answered < questions.length ? (
                <span className="text-clay"> Còn {questions.length - answered} câu chưa làm.</span>
              ) : null}
            </p>
            <div className="mt-6 flex gap-2.5">
              <Button variant="soft" className="flex-1" onClick={() => setConfirm(false)}>
                Làm tiếp
              </Button>
              <Button variant="clay" className="flex-1" onClick={handleSubmit}>
                Nộp &amp; xem điểm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LegendRow({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn('size-4 rounded-[5px]', className)} />
      <span className="text-[12.5px] font-medium text-ink-3">{label}</span>
    </div>
  )
}

function QuestionCard({
  question,
  index,
  total,
  chosen,
  onAnswer,
  flagged,
  onToggleFlag,
}: {
  question: Question
  index: number
  total: number
  chosen?: string
  onAnswer: (v: string) => void
  flagged: boolean
  onToggleFlag: () => void
}) {
  return (
    <div className="rounded-[28px] bg-surface p-7 shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-9">
      <div className="mb-5 flex items-center justify-between">
        <Badge tone="neutral">
          Câu {index + 1} / {total}
        </Badge>
        <button
          type="button"
          onClick={onToggleFlag}
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-200',
            flagged ? 'bg-clay-soft text-clay' : 'text-ink-3 hover:bg-sunken',
          )}
        >
          <Flag className="size-3.5" />
          {flagged ? 'Đã đánh dấu' : 'Đánh dấu'}
        </button>
      </div>

      <div className="prose-exam text-[17px]">
        <MathText as="div">{question.prompt}</MathText>
      </div>
      <p className="mt-2.5 text-[12.5px] font-semibold text-ink-3 tnum">
        {formatPoints(question.points)} điểm
      </p>

      {question.options ? (
        <ul className="mt-6 space-y-2.5">
          {question.options.map((opt) => {
            const active = chosen === opt.key
            return (
              <li key={opt.key}>
                <button
                  type="button"
                  onClick={() => onAnswer(opt.key)}
                  className={cn(
                    'group flex w-full items-start gap-3.5 rounded-[8px] px-4 py-3.5 text-left transition-all duration-200',
                    active
                      ? 'bg-sunken shadow-[inset_0_0_0_1.5px_rgba(35,32,28,0.85)]'
                      : 'hover:bg-sunken/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-[12.5px] font-bold transition-all duration-200',
                      active
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line-2 bg-white text-ink-3 group-hover:border-ink-4',
                    )}
                  >
                    {active ? <Check className="size-3.5" strokeWidth={3} /> : opt.key}
                  </span>
                  <span className="prose-exam min-w-0 flex-1 text-[15px]">
                    <MathText as="span" className="inline">
                      {opt.text}
                    </MathText>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-[8px] border border-dashed border-line-2 bg-canvas/50 px-5 py-8 text-center text-[13.5px] italic text-ink-3">
          Câu tự luận — hãy viết lời giải ra giấy rồi đối chiếu với lời giải chi tiết sau khi
          nộp bài.
        </div>
      )}
    </div>
  )
}

function ResultView({
  examTitle,
  score,
  totalPoints,
  questions,
  answers,
  onRestart,
  onReview,
}: {
  examTitle: string
  score: number
  totalPoints: number
  questions: Question[]
  answers: Record<string, string>
  onRestart: () => void
  onReview: () => void
}) {
  const pct = totalPoints > 0 ? (score / totalPoints) * 100 : 0
  const correct = questions.filter((q) => answers[q.id] === q.answer).length
  const grade =
    pct >= 85
      ? 'Xuất sắc'
      : pct >= 70
        ? 'Giỏi'
        : pct >= 50
          ? 'Khá'
          : pct >= 30
            ? 'Trung bình'
            : 'Cần cố gắng'
  const tone =
    pct >= 70 ? 'text-sage' : pct >= 50 ? 'text-honey' : 'text-clay'

  return (
    <div className="mx-auto max-w-[900px] px-5 py-14 sm:px-6">
      <div className="relative overflow-hidden rounded-[32px] bg-surface p-9 text-center shadow-lift sm:p-14">
        <div
          className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full opacity-40 blur-[60px]"
          style={{ background: 'radial-gradient(circle, rgba(91,122,94,0.4), transparent 70%)' }}
        />
        <div className="relative">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-sunken text-ink-2">
            <Trophy className="size-7" strokeWidth={1.5} />
          </span>

          <p className="eyebrow mt-6">Kết quả</p>
          <p className="mt-2.5 font-display text-[56px] font-semibold leading-none tracking-[-0.03em] text-ink tnum">
            {formatPoints(score)}
            <span className="text-[26px] text-ink-4">/{formatPoints(totalPoints)}</span>
          </p>
          <p className={cn('mt-3 font-display text-[21px] font-semibold', tone)}>{grade}</p>
          <p className="mt-1.5 text-[13.5px] text-ink-3">
            Đúng {correct}/{questions.length} câu · {pct.toFixed(1)}%
          </p>

          <div className="mx-auto mt-8 h-2.5 w-full max-w-[380px] overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-clay transition-[width] duration-700 ease-out"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>

          <p className="mt-7 text-[13.5px] text-ink-3">{examTitle}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Button variant="soft" onClick={onReview}>
              <ArrowLeft className="size-4" />
              Xem lại bài
            </Button>
            <Button variant="clay" onClick={onRestart}>
              <RotateCcw className="size-4" />
              Làm lại
            </Button>
            <Link to="/de-cong-dong">
              <Button variant="ghost">Về kho đề</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-9 space-y-3">
        <p className="eyebrow">Chi tiết từng câu</p>
        {questions.map((q, i) => {
          const given = answers[q.id]
          const ok = given === q.answer
          return (
            <div
              key={q.id}
              className={cn(
                'flex items-start gap-3.5 rounded-[10px] px-5 py-4',
                ok ? 'bg-sage-soft/70' : 'bg-clay-soft/60',
              )}
            >
              <span
                className={cn(
                  'tnum mt-px flex size-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold',
                  ok ? 'bg-sage text-white' : 'bg-clay text-white',
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] leading-relaxed text-ink">
                  <MathText as="span" className="inline">
                    {q.prompt}
                  </MathText>
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink-3">
                  Bạn chọn: <span className="font-semibold text-ink-2">{given ?? 'không trả lời'}</span>{' '}
                  · Đáp án: <span className="font-semibold text-ink">{q.answer ?? '—'}</span>
                </p>
                {q.explanation ? (
                  <p className="mt-1.5 text-[12.5px] italic leading-relaxed text-ink-3">
                    <MathText as="span" className="inline">
                      {q.explanation}
                    </MathText>
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
