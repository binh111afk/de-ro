import { MathText } from './MathText'
import type { Exam, Question } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatPoints } from '@/lib/math'

/**
 * The printable A4 exam document.
 * `interactive` switches the option list from a rendered sheet into clickable answers.
 */
export function ExamSheet({
  exam,
  answers,
  reveal,
  onAnswer,
  className,
  showMeta = true,
}: {
  exam: Exam
  answers?: Record<string, string>
  reveal?: boolean
  onAnswer?: (questionId: string, value: string) => void
  className?: string
  showMeta?: boolean
}) {
  const all = exam.sections.flatMap((s) => s.questions)
  const total = all.reduce((n, q) => n + q.points, 0)

  return (
    <div
      className={cn(
        'print-sheet mx-auto w-full max-w-[794px] rounded-[10px] bg-white px-[18mm] py-[15mm] shadow-[0_1px_2px_rgba(60,48,32,0.04),0_14px_40px_-18px_rgba(60,48,32,0.25)]',
        className,
      )}
    >
      {showMeta ? <ExamHeader exam={exam} /> : null}

      {exam.sections.map((section) => (
        <section key={section.id} className="mb-8 last:mb-0">
          <h2
            className="mb-4 border-b border-line-2 pb-2 text-center font-display text-[15px] font-semibold tracking-[0.02em] text-ink"
            style={{ pageBreakAfter: 'avoid' }}
          >
            {section.title}
          </h2>

          {section.questions.map((q) => (
            <QuestionBlock
              key={q.id}
              question={q}
              answers={answers}
              reveal={reveal}
              onAnswer={onAnswer}
            />
          ))}

          {section.questions.length === 0 ? (
            <p className="py-3 text-center text-[13px] italic text-ink-4">Phần này chưa có câu hỏi.</p>
          ) : null}
        </section>
      ))}

      <div className="mt-9 flex items-center justify-between border-t border-line-2 pt-3.5">
        <span className="text-[11.5px] font-semibold text-ink-3">
          {exam.subject} · {exam.grade}
        </span>
        <span className="text-[11.5px] font-semibold text-ink-3 tnum">
          {all.length} câu · {formatPoints(total)} điểm
        </span>
      </div>
    </div>
  )
}

export function ExamHeader({ exam }: { exam: Exam }) {
  return (
    <header className="mb-8 text-center" style={{ pageBreakAfter: 'avoid' }}>
      <p className="mb-1.5 text-[13px] font-semibold text-ink-2">
        {exam.school || 'TRƯỜNG THCS ...'}
      </p>
      <h1
        className="font-display text-[20px] font-semibold leading-snug tracking-[-0.005em] text-ink"
        style={{ pageBreakAfter: 'avoid' }}
      >
        {exam.title}
      </h1>
      <p className="mt-2 text-[13px] italic text-ink-2">
        Môn: {exam.subject} — Lớp: {exam.grade} — Thời gian: {exam.durationMinutes} phút
      </p>
      <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
        Năm học {exam.year} · {exam.term}
      </p>
      <div className="mx-auto mt-4 h-px w-full bg-line-2" />
      <p className="mt-3 text-left text-[12.5px] italic leading-relaxed text-ink-2">
        Hãy đọc kỹ đề trước khi làm bài. Bài làm trắc nghiệm có thể trả lời bằng cách chọn một
        phương án đúng nhất.
      </p>
    </header>
  )
}

function QuestionBlock({
  question,
  answers,
  reveal,
  onAnswer,
}: {
  question: Question
  answers?: Record<string, string>
  reveal?: boolean
  onAnswer?: (qid: string, value: string) => void
}) {
  const chosen = answers?.[question.id]
  const isCorrect = reveal && chosen === question.answer

  return (
    <div className="mb-5" style={{ pageBreakInside: 'avoid' }}>
      <div className="flex gap-2.5">
        <span className="tnum shrink-0 font-display text-[15px] font-semibold text-ink">
          Câu {question.number}.
        </span>
        <div className="min-w-0 flex-1">
          <div className="prose-exam">
            <MathText as="span" className="inline">
              {question.prompt}
            </MathText>
            <span className="ml-1.5 whitespace-nowrap align-super text-[11px] font-semibold text-ink-3">
              ({formatPoints(question.points)}đ)
            </span>
          </div>

          {question.options ? (
            <ul className="mt-2.5 space-y-1">
              {question.options.map((opt) => {
                const active = chosen === opt.key
                const correct = reveal && question.answer === opt.key
                const wrongPick = reveal && active && !correct
                return (
                  <li key={opt.key}>
                    <button
                      type="button"
                      onClick={() => onAnswer?.(question.id, opt.key)}
                      disabled={!onAnswer}
                      className={cn(
                        'group flex w-full items-start gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors duration-200',
                        onAnswer && 'cursor-pointer hover:bg-sunken/70',
                        correct && 'bg-sage-soft',
                        wrongPick && 'bg-clay-soft',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-[3px] flex size-[21px] shrink-0 items-center justify-center rounded-full border text-[11.5px] font-bold transition-colors duration-200',
                          correct
                            ? 'border-sage bg-sage text-white'
                            : wrongPick
                              ? 'border-clay bg-clay text-white'
                              : active
                                ? 'border-ink bg-ink text-paper'
                                : 'border-line-2 bg-white text-ink-3 group-hover:border-ink-4',
                        )}
                      >
                        {opt.key}
                      </span>
                      <span className="prose-exam min-w-0 flex-1">
                        <MathText as="span" className="inline">
                          {opt.text}
                        </MathText>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : question.type === 'tra-loi-ngan' ? (
            <div className="mt-3 flex items-center gap-2.5">
              <span className="text-[12.5px] italic text-ink-4">Đáp số:</span>
              <span className="flex divide-x divide-ink-3 overflow-hidden rounded-[3px] border border-ink-3">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="size-8" />
                ))}
              </span>
            </div>
          ) : (
            <div className="mt-3">
              <div className="h-20 rounded-[10px] border border-dashed border-line-2 bg-canvas/50 px-4 py-3">
                <span className="text-[12.5px] italic text-ink-4">
                  {question.type === 'tu-luan-dong'
                    ? 'Học sinh viết lời giải tự do'
                    : 'Học sinh trình bày lời giải'}
                </span>
              </div>
            </div>
          )}

          {reveal ? (
            <div className="mt-3 rounded-[6px] border border-clay-line/60 bg-clay-soft/45 py-3 pl-3.5 pr-4 anim-pop">
              {question.answer ? (
                <p className="text-[13.5px] text-ink">
                  <span className="eyebrow mr-2">Đáp án</span>
                  <MathText as="span" className="inline font-bold text-clay">
                    {question.answer}
                  </MathText>
                  {isCorrect ? (
                    <span className="ml-2 text-[12.5px] font-semibold text-sage">✓ Bạn đã đúng</span>
                  ) : chosen ? (
                    <span className="ml-2 text-[12.5px] font-semibold text-clay">✕ Bạn đã sai</span>
                  ) : null}
                </p>
              ) : null}

              {question.solution?.length ? (
                <ol className="mt-2 space-y-1.5">
                  {question.solution.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-[13px] leading-relaxed text-ink-2"
                    >
                      <span className="tnum mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-white/70 text-[10.5px] font-bold text-ink-3">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <MathText as="span" className="inline">
                          {step}
                        </MathText>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}

              {question.explanation ? (
                <p className="mt-2 text-[13px] italic leading-relaxed text-ink-3">
                  <MathText as="span" className="inline">
                    {question.explanation}
                  </MathText>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
