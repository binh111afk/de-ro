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
import { QuestionBody } from '@/components/QuestionBody'
import { dialog } from '@/components/Dialog'
import { getSession } from '@/lib/auth'
import { isRemoteExamId, submitAttempt } from '@/lib/attempts'
import { useApp } from '@/store/app'
import { QUESTION_STATES } from '@/data/questions'
import { cn } from '@/lib/cn'
import { formatPoints } from '@/lib/math'
import type { Question } from '@/data/types'
import {
  SHORT_MAX_CHARS,
  describeAnswer,
  formatTrueFalse,
  isAutoGraded,
  isFullyCorrect,
  parseTrueFalse,
  readTrueFalseAnswer,
  scoreQuestion,
} from '@/lib/grading'

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
  const startedAt = useApp((s) => s.quizStartedAt)

  const exam = myExams.find((e) => e.id === id)

  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [showGrid, setShowGrid] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  /** câu đã bấm kiểm tra (chế độ hiện đáp án ngay) — chỉ có hiệu lực khi đề bật `instantFeedback` */
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [shuffleKey, setShuffleKey] = useState(0)
  const timerRef = useRef<number | null>(null)

  const shuffle = Boolean(exam?.settings?.shuffleQuestions)
  const questions = useMemo(() => {
    const all = exam ? exam.sections.flatMap((s) => s.questions) : []
    if (!shuffle) return all
    const out = [...all]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
    // shuffleKey: bấm Làm lại thì đảo lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, shuffle, shuffleKey])

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
    if (!exam || submitted || exam.settings?.noTimeLimit) return
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

  /** Đề lấy từ link/cộng đồng thì gửi kết quả về cho giáo viên khi nộp bài (mỗi lượt một lần). */
  const sentFor = useRef<number | null>(null)
  const [sent, setSent] = useState<'sent' | 'failed' | null>(null)
  useEffect(() => {
    if (!submitted || !lastResult || !exam || sentFor.current === lastResult.at) return
    if (!isRemoteExamId(exam.importedFrom) || lastResult.examId !== exam.id) return
    sentFor.current = lastResult.at
    const result = lastResult
    void (async () => {
      const user = getSession()?.user
      let name = user?.name ?? user?.email.split('@')[0] ?? ''
      if (!name) {
        const saved = (() => {
          try {
            return localStorage.getItem('dethinhbien-student-name') ?? ''
          } catch {
            return ''
          }
        })()
        const typed = await dialog.prompt('Nhập tên của em để thầy cô xem được điểm và xếp hạng bài làm này.', {
          title: 'Gửi kết quả cho giáo viên',
          label: 'Tên của em',
          defaultValue: saved,
          confirmLabel: 'Gửi kết quả',
          cancelLabel: 'Không gửi',
        })
        name = typed?.trim() ?? ''
        if (!name) return
        try {
          localStorage.setItem('dethinhbien-student-name', name)
        } catch {
          /* không nhớ được tên: lần sau hỏi lại */
        }
      }
      try {
        await submitAttempt({
          examId: exam.importedFrom!,
          name,
          score: result.score,
          max: result.total,
          seconds: startedAt ? (result.at - startedAt) / 1000 : 0,
        })
        setSent('sent')
      } catch {
        setSent('failed')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, lastResult])

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
    setReviewing(false)
    setChecked(new Set())
    setSent(null)
    setShuffleKey((k) => k + 1)
    startQuiz(exam.id)
  }

  if (submitted && lastResult) {
    return reviewing ? (
      <ReviewView
        questions={questions}
        answers={answers}
        index={index}
        setIndex={setIndex}
        onBack={() => setReviewing(false)}
        onRestart={handleRestart}
      />
    ) : (
      <ResultView
        examTitle={exam.title}
        score={lastResult.score}
        totalPoints={totalPoints}
        questions={questions}
        answers={answers}
        note={sent === 'sent' ? 'Đã gửi kết quả cho giáo viên.' : sent === 'failed' ? 'Chưa gửi được kết quả cho giáo viên, kiểm tra mạng rồi bấm Làm lại nếu cần.' : undefined}
        onRestart={handleRestart}
        onReview={() => {
          setIndex(0)
          setReviewing(true)
        }}
      />
    )
  }

  const mm = String(Math.floor((remaining ?? 0) / 60)).padStart(2, '0')
  const ss = String((remaining ?? 0) % 60).padStart(2, '0')
  const low = (remaining ?? 0) <= 60
  const noLimit = Boolean(exam.settings?.noTimeLimit)
  const instant = Boolean(exam.settings?.instantFeedback)
  const isChecked = instant && checked.has(current.id)
  const markChecked = () => setChecked((c) => new Set(c).add(current.id))

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

          {noLimit ? (
            <div className="flex items-center gap-2 rounded-full bg-cream px-3.5 py-2 text-[13px] font-semibold text-ink-3 shadow-soft">
              <Clock className="size-3.5" />
              Không giới hạn
            </div>
          ) : (
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
          )}

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
              onAnswer={(v) => {
                setAnswer(current.id, v)
                if (instant && current.type === 'trac-nghiem') markChecked()
              }}
              flagged={flagged.has(current.id)}
              onToggleFlag={() =>
                setFlagged((f) => {
                  const next = new Set(f)
                  if (next.has(current.id)) next.delete(current.id)
                  else next.add(current.id)
                  return next
                })
              }
              review={isChecked}
            />

            {instant && !isChecked && current.type !== 'trac-nghiem' ? (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="soft"
                  size="sm"
                  onClick={markChecked}
                  disabled={isAutoGraded(current) && !answers[current.id]}
                >
                  {isAutoGraded(current) ? 'Kiểm tra đáp án' : 'Xem lời giải'}
                </Button>
              </div>
            ) : null}

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
                      'tnum relative flex h-10 w-full items-center justify-center rounded-[6px] text-[12.5px] font-bold transition-all duration-200',
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
  review = false,
}: {
  question: Question
  index: number
  total: number
  chosen?: string
  onAnswer: (v: string) => void
  flagged: boolean
  onToggleFlag: () => void
  /** xem lại sau khi nộp: khoá bài làm, đánh dấu đáp án đúng/sai */
  review?: boolean
}) {
  const graded = isAutoGraded(question)
  const ok = isFullyCorrect(question, chosen)
  return (
    <div className="rounded-[28px] bg-surface p-7 shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-9">
      <div className="mb-5 flex items-center justify-between">
        <Badge tone="neutral">
          Câu {index + 1} / {total}
        </Badge>
        {review ? (
          graded ? (
            <span
              className={cn(
                'rounded-full px-3 py-1.5 text-[12.5px] font-semibold',
                !chosen ? 'bg-sunken text-ink-3' : ok ? 'bg-sage-soft text-sage' : 'bg-clay-soft text-clay',
              )}
            >
              {!chosen ? 'Chưa làm' : ok ? 'Đúng' : 'Sai'}
            </span>
          ) : null
        ) : (
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
        )}
      </div>

      <QuestionBody q={question} className="prose-exam text-[17px]" />
      <p className="mt-2.5 text-[12.5px] font-semibold text-ink-3 tnum">
        {formatPoints(question.points)} điểm
      </p>

      {question.type === 'dung-sai' && question.options ? (
        <TrueFalseInput question={question} chosen={chosen} onAnswer={onAnswer} review={review} />
      ) : question.type === 'tra-loi-ngan' ? (
        review ? (
          <div className="mt-6 flex flex-wrap gap-3 font-mono text-[18px]">
            <span
              className={cn(
                'rounded-[8px] px-4 py-2.5',
                ok ? 'bg-sage-soft text-sage' : 'bg-clay-soft text-clay',
              )}
            >
              Bạn điền: {chosen || 'không trả lời'}
            </span>
            {!ok && question.answer ? (
              <span className="rounded-[8px] bg-sage-soft px-4 py-2.5 text-sage">
                Đáp án: {question.answer}
              </span>
            ) : null}
          </div>
        ) : (
          <ShortAnswerInput chosen={chosen} onAnswer={onAnswer} />
        )
      ) : question.options ? (
        <ul className="mt-6 space-y-2.5">
          {question.options.map((opt) => {
            const active = chosen === opt.key
            const right = review && opt.key === question.answer
            const wrong = review && active && !right
            return (
              <li key={opt.key}>
                <button
                  type="button"
                  onClick={review ? undefined : () => onAnswer(opt.key)}
                  className={cn(
                    'group flex w-full items-start gap-3.5 rounded-[8px] px-4 py-3.5 text-left transition-all duration-200',
                    review && 'cursor-default',
                    right
                      ? 'bg-sage-soft ring-2 ring-sage'
                      : wrong
                        ? 'bg-clay-soft ring-2 ring-clay'
                        : active
                          ? 'bg-sunken shadow-[inset_0_0_0_1.5px_rgba(35,32,28,0.85)]'
                          : !review && 'hover:bg-sunken/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-[12.5px] font-bold transition-all duration-200',
                      right
                        ? 'border-sage bg-sage text-white'
                        : wrong
                          ? 'border-clay bg-clay text-white'
                          : active
                            ? 'border-ink bg-ink text-paper'
                            : 'border-line-2 bg-white text-ink-3 group-hover:border-ink-4',
                    )}
                  >
                    {right ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : wrong ? (
                      <X className="size-3.5" strokeWidth={3} />
                    ) : active ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : (
                      opt.key
                    )}
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
      ) : review ? (
        <div className="mt-6 space-y-1.5 rounded-[8px] bg-sage-soft px-5 py-4 text-[14px] text-ink">
          {question.solution?.length ? (
            question.solution.map((line, i) => (
              <MathText key={i} as="div">
                {line}
              </MathText>
            ))
          ) : (
            <span className="italic text-ink-3">Câu tự luận — chưa có lời giải chi tiết.</span>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[8px] border border-dashed border-line-2 bg-canvas/50 px-5 py-8 text-center text-[13.5px] italic text-ink-3">
          Câu tự luận — hãy viết lời giải ra giấy rồi đối chiếu với lời giải chi tiết sau khi
          nộp bài.
        </div>
      )}

      {review && question.explanation ? (
        <div className="mt-5 rounded-[8px] bg-sunken px-5 py-4 text-[13.5px] leading-relaxed text-ink-2">
          <span className="font-semibold text-ink">Giải thích: </span>
          <MathText as="span" className="inline">
            {question.explanation}
          </MathText>
        </div>
      ) : null}
    </div>
  )
}

function ReviewView({
  questions,
  answers,
  index,
  setIndex,
  onBack,
  onRestart,
}: {
  questions: Question[]
  answers: Record<string, string>
  index: number
  setIndex: (i: number | ((i: number) => number)) => void
  onBack: () => void
  onRestart: () => void
}) {
  const q = questions[index]
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-sunken/35">
      <div className="mx-auto max-w-[900px] px-5 py-9 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="soft" size="sm" onClick={onBack}>
            <ArrowLeft className="size-3.5" />
            Về kết quả
          </Button>
          <p className="font-display text-[15px] font-semibold text-ink">Xem lại bài</p>
          <Button variant="clay" size="sm" onClick={onRestart}>
            <RotateCcw className="size-3.5" />
            Làm lại
          </Button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {questions.map((x, i) => {
            const given = answers[x.id]
            const tone = !given
              ? 'bg-sunken text-ink-3'
              : !isAutoGraded(x)
                ? 'bg-sunken text-ink-2'
                : isFullyCorrect(x, given)
                  ? 'bg-sage text-white'
                  : 'bg-clay text-white'
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  'tnum flex size-9 items-center justify-center rounded-[5px] text-[12px] font-bold transition-all duration-200',
                  tone,
                  i === index && 'ring-2 ring-ink ring-offset-2 ring-offset-canvas',
                )}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <div className="mb-6 flex flex-wrap gap-x-5 gap-y-1">
          <LegendRow className="bg-sage" label="Đúng" />
          <LegendRow className="bg-clay" label="Sai" />
          <LegendRow className="bg-sunken ring-1 ring-line-2" label="Chưa làm / tự luận" />
        </div>

        <QuestionCard
          question={q}
          index={index}
          total={questions.length}
          chosen={answers[q.id]}
          onAnswer={() => {}}
          flagged={false}
          onToggleFlag={() => {}}
          review
        />

        <div className="mt-6 flex items-center justify-between">
          <Button variant="soft" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
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
    </div>
  )
}

/** Câu đúng/sai: mỗi ý a) b) c) d) chọn Đúng hoặc Sai; bài làm là chuỗi Đ/S/_ theo thứ tự ý. */
function TrueFalseInput({
  question,
  chosen,
  onAnswer,
  review = false,
}: {
  question: Question
  chosen?: string
  onAnswer: (v: string) => void
  review?: boolean
}) {
  const options = question.options ?? []
  const values = readTrueFalseAnswer(chosen, options.length)
  const correct = review ? parseTrueFalse(question.answer, options.length) : null
  const set = (i: number, v: boolean) => onAnswer(formatTrueFalse(values.map((x, j) => (j === i ? v : x))))
  return (
    <ul className="mt-6 space-y-2.5">
      {options.map((opt, i) => (
        <li key={opt.key} className="flex items-start gap-3.5 rounded-[8px] px-4 py-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line-2 bg-white text-[12.5px] font-bold text-ink-3">
            {opt.key}
          </span>
          <span className="prose-exam min-w-0 flex-1 text-[15px]">
            <MathText as="span" className="inline">
              {opt.text}
            </MathText>
          </span>
          <span className="flex shrink-0 gap-1.5">
            {([true, false] as const).map((v) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={values[i] === v}
                onClick={review ? undefined : () => set(i, v)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-200',
                  review && 'cursor-default',
                  correct?.[i] === v
                    ? 'border-sage bg-sage text-white'
                    : review && values[i] === v
                      ? 'border-clay bg-clay text-white'
                      : values[i] === v
                        ? 'border-ink bg-ink text-paper'
                        : review
                          ? 'border-line-2 bg-white text-ink-3'
                          : 'border-line-2 bg-white text-ink-3 hover:border-ink-4 hover:text-ink',
                )}
              >
                {v ? 'Đúng' : 'Sai'}
              </button>
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Câu trả lời ngắn: một số, tối đa 4 ký tự (chữ số, dấu âm, dấu phẩy) như phiếu trả lời. */
function ShortAnswerInput({ chosen, onAnswer }: { chosen?: string; onAnswer: (v: string) => void }) {
  return (
    <div className="mt-6">
      <input
        value={chosen ?? ''}
        inputMode="decimal"
        maxLength={SHORT_MAX_CHARS}
        autoComplete="off"
        aria-label="Đáp án trả lời ngắn"
        placeholder="…"
        onChange={(e) =>
          onAnswer(
            e.target.value
              .replace(/\./g, ',')
              .replace(/[^0-9,-]/g, '')
              .slice(0, SHORT_MAX_CHARS),
          )
        }
        className="w-44 rounded-[8px] border border-line-2 bg-white px-4 py-3 text-center font-mono text-[22px] tracking-[0.35em] text-ink outline-none focus:border-ink"
      />
      <p className="mt-2.5 text-[12.5px] text-ink-3">
        Điền một số, tối đa {SHORT_MAX_CHARS} ký tự (kể cả dấu âm và dấu phẩy), ví dụ 12, -3,5, 0,25.
      </p>
    </div>
  )
}

function ResultView({
  examTitle,
  score,
  totalPoints,
  questions,
  answers,
  note,
  onRestart,
  onReview,
}: {
  note?: string
  examTitle: string
  score: number
  totalPoints: number
  questions: Question[]
  answers: Record<string, string>
  onRestart: () => void
  onReview: () => void
}) {
  const pct = totalPoints > 0 ? (score / totalPoints) * 100 : 0
  const correct = questions.filter((q) => isFullyCorrect(q, answers[q.id])).length
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
          {note ? <p role="status" className="mt-2 text-[12.5px] text-ink-4">{note}</p> : null}

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
          const got = scoreQuestion(q, given)
          const ok = isFullyCorrect(q, given)
          // tự luận không có đáp án tự chấm: chỉ hiện lời giải để đối chiếu
          const graded = isAutoGraded(q)
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
                {q.image?.src ? <img src={q.image.src} alt={q.image.alt ?? ''} className="mt-2 max-h-40 max-w-full rounded-[6px] bg-white object-contain" /> : null}
                <p className="mt-1.5 text-[12.5px] text-ink-3">
                  Bạn chọn:{' '}
                  <span className="font-semibold text-ink-2">{describeAnswer(q, given) || 'không trả lời'}</span> ·
                  Đáp án: <span className="font-semibold text-ink">{describeAnswer(q, q.answer) || '—'}</span>
                  {graded && q.type === 'dung-sai' ? (
                    <span className="ml-1">
                      · Được <span className="font-semibold text-ink-2 tnum">{formatPoints(got)}</span>/{formatPoints(q.points)}đ
                    </span>
                  ) : null}
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
