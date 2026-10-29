import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Copy, MonitorPlay, Plus, Trash2, Upload } from 'lucide-react'
import { Button, EmptyState, Field, inputClass } from '@/components/ui'
import { CopyLink } from '@/components/CopyLink'
import { MathText } from '@/components/MathText'
import { SiteSelect } from '@/components/SiteSelect'
import { cn } from '@/lib/cn'
import { formatPoints } from '@/lib/math'
import { GRADES, SUBJECTS, TYPE_LABEL, type ExamSettings, type Question, type QuestionType, type Subject } from '@/data/types'
import { formatTrueFalse, readTrueFalseAnswer, SHORT_MAX_CHARS } from '@/lib/grading'
import {
  convertQuestion,
  evenPoints,
  loadForQuiz,
  newQuestion,
  ONLINE_TYPES,
  questionIssue,
  sortQuestions,
  totalOf,
  type OnlineMeta,
} from '@/lib/onlineExam'
import { publishItem, shareUrl } from '@/lib/onlinePublish'
import { useOnline } from '@/store/online'

const STEPS = ['Soạn câu hỏi', 'Thông tin & cài đặt', 'Hoàn tất']
const KEYS = ['A', 'B', 'C', 'D', 'E', 'F']
const SUBJECT_OPTIONS = SUBJECTS.map((s) => ({ value: s, label: s }))
const GRADE_OPTIONS = GRADES.map((g) => ({ value: g, label: g }))
const textareaClass = inputClass + ' resize-y leading-relaxed'
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

export default function OnlineBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const item = useOnline((s) => s.items.find((it) => it.id === id))
  const update = useOnline((s) => s.update)

  const [step, setStep] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!item) return <Navigate to="/tao-de-online" replace />

  const questions = item.questions
  const issues = questions.map(questionIssue)
  const issueCount = issues.filter(Boolean).length
  const current = questions.find((q) => q.id === selectedId) ?? questions[0]
  const currentIdx = current ? questions.indexOf(current) : -1

  const setQuestions = (qs: Question[]) => update(item.id, { questions: sortQuestions(qs) })
  const setMeta = (p: Partial<OnlineMeta>) => update(item.id, { meta: { ...item.meta, ...p } })
  const setSettings = (p: Partial<ExamSettings>) => update(item.id, { settings: { ...item.settings, ...p } })

  const add = (type: QuestionType) => {
    const q = newQuestion(type)
    setQuestions([...questions, q])
    setSelectedId(q.id)
    setStep(0)
  }
  const patch = (q: Question, p: Partial<Question>) => setQuestions(questions.map((x) => (x.id === q.id ? { ...x, ...p } : x)))
  const remove = (q: Question) => {
    const next = questions.filter((x) => x.id !== q.id)
    setQuestions(next)
    setSelectedId((next[Math.min(currentIdx, next.length - 1)] ?? null)?.id ?? null)
  }
  const duplicate = (q: Question) => {
    const copy = { ...q, id: Math.random().toString(36).slice(2, 10), options: q.options?.map((o) => ({ ...o })) }
    const next = [...questions]
    next.splice(questions.indexOf(q) + 1, 0, copy)
    setQuestions(next)
    setSelectedId(copy.id)
  }
  /** Đổi chỗ với câu liền kề cùng dạng (các dạng luôn xếp theo thứ tự I → IV). */
  const move = (q: Question, dir: -1 | 1) => {
    const i = questions.indexOf(q)
    const other = questions[i + dir]
    if (!other || other.type !== q.type) return
    const next = [...questions]
    next[i] = other
    next[i + dir] = q
    setQuestions(next)
  }

  const finish = () => {
    if (!item.meta.title.trim()) return setError('Hãy đặt tên cho đề.')
    if (!questions.length) return setError('Đề chưa có câu nào.')
    const first = issues.findIndex(Boolean)
    if (first >= 0) {
      setSelectedId(questions[first].id)
      setStep(0)
      return setError(`Còn ${issueCount} câu chưa hoàn chỉnh. Câu ${questions[first].number}: ${issues[first]}`)
    }
    setError(null)
    update(item.id, { status: 'done' })
    setStep(2)
  }

  const publish = async () => {
    setBusy(true)
    setError(null)
    try {
      await publishItem(item)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đăng được, thử lại sau.')
    } finally {
      setBusy(false)
    }
  }

  const goStep = (n: number) => {
    if (n > 0 && !questions.length) return setError('Thêm ít nhất một câu trước đã.')
    if (n === 2 && item.status !== 'done') return finish()
    setError(null)
    setStep(n)
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6 lg:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link to="/tao-de-online" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-3 transition-colors hover:text-ink">
          <ArrowLeft className="size-4" />
          Lịch sử tạo đề
        </Link>
        <p className="text-[12.5px] text-ink-3">
          Tự lưu · {new Date(item.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <ol className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((label, i) => {
          const active = step === i
          const passed = step > i
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => goStep(i)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors',
                  active ? 'bg-ink text-paper' : 'bg-sunken text-ink-2 hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'tnum flex size-5 items-center justify-center rounded-full text-[11px] font-bold',
                    active ? 'bg-white/20' : passed ? 'bg-sage text-white' : 'bg-white text-ink-3',
                  )}
                >
                  {passed ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ol>

      {error ? (
        <p role="alert" className="mb-6 rounded-[6px] bg-clay-soft px-4 py-3 text-[13.5px] font-medium text-clay-deep">
          {error}{' '}
          {error.includes('đăng nhập') ? (
            <Link to="/dang-nhap" className="underline">
              Đăng nhập
            </Link>
          ) : null}
        </p>
      ) : null}

      {step === 0 ? (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[8px] bg-surface p-5 shadow-[0_1px_2px_rgba(60,48,32,0.03)] lg:sticky lg:top-[88px]">
            <p className="eyebrow mb-1">Mục lục câu hỏi</p>
            <p className="tnum mb-4 text-[12.5px] text-ink-3">
              {questions.length} câu · {formatPoints(totalOf(questions))}đ
              {issueCount ? <span className="font-semibold text-clay"> · {issueCount} câu chưa xong</span> : null}
            </p>

            <div className="mb-4 grid grid-cols-2 gap-1.5">
              {ONLINE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => add(t)}
                  className="flex items-center justify-center gap-1.5 rounded-[6px] bg-sunken px-2 py-2 text-[12.5px] font-semibold text-ink-2 transition-colors hover:bg-veil hover:text-ink"
                >
                  <Plus className="size-3.5" />
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            {questions.length ? (
              <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
                {ONLINE_TYPES.map((t) => {
                  const group = questions.filter((q) => (q.type === 'tu-luan-dong' ? 'tu-luan' : q.type) === t)
                  if (!group.length) return null
                  return (
                    <div key={t}>
                      <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wide text-ink-4">{TYPE_LABEL[t]}</p>
                      <ul className="space-y-0.5">
                        {group.map((q) => {
                          const bad = Boolean(issues[questions.indexOf(q)])
                          return (
                            <li key={q.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedId(q.id)}
                                className={cn(
                                  'flex w-full items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-left transition-colors',
                                  q.id === current?.id ? 'bg-sunken' : 'hover:bg-sunken/60',
                                )}
                              >
                                <span
                                  className={cn(
                                    'tnum flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                                    bad ? 'bg-clay-soft text-clay' : 'bg-sage-soft text-sage',
                                  )}
                                >
                                  {q.number}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                                  {oneLine(q.prompt) || '(chưa có nội dung)'}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-3">Chưa có câu nào. Chọn dạng câu ở trên để thêm.</p>
            )}

            {questions.length ? (
              <button
                type="button"
                onClick={() => setQuestions(evenPoints(questions))}
                className="mt-4 text-[12.5px] font-semibold text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                Chia đều thang 10 điểm
              </button>
            ) : null}
          </aside>

          <section>
            {current ? (
              <QuestionEditor
                key={current.id}
                q={current}
                issue={issues[currentIdx]}
                canUp={questions[currentIdx - 1]?.type === current.type}
                canDown={questions[currentIdx + 1]?.type === current.type}
                onPatch={(p) => patch(current, p)}
                onType={(t) => setQuestions(questions.map((x) => (x.id === current.id ? convertQuestion(x, t) : x)))}
                onMove={(d) => move(current, d)}
                onDuplicate={() => duplicate(current)}
                onRemove={() => remove(current)}
              />
            ) : (
              <EmptyState
                icon={<Plus className="size-6" strokeWidth={1.6} />}
                title="Bắt đầu với câu đầu tiên"
                description="Chọn dạng câu: trắc nghiệm, đúng/sai, trả lời ngắn hoặc tự luận."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {ONLINE_TYPES.map((t) => (
                      <Button key={t} variant={t === 'trac-nghiem' ? 'clay' : 'outline'} size="sm" onClick={() => add(t)}>
                        {TYPE_LABEL[t]}
                      </Button>
                    ))}
                  </div>
                }
              />
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button variant="soft" size="sm" disabled={currentIdx <= 0} onClick={() => setSelectedId(questions[currentIdx - 1].id)}>
                  <ArrowLeft className="size-3.5" />
                  Câu trước
                </Button>
                <Button variant="soft" size="sm" disabled={currentIdx < 0 || currentIdx >= questions.length - 1} onClick={() => setSelectedId(questions[currentIdx + 1].id)}>
                  Câu sau
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
              <Button variant="primary" onClick={() => goStep(1)}>
                Tiếp: Thông tin & cài đặt
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-[8px] bg-surface p-6 shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
            <h2 className="font-display text-[20px] font-semibold text-ink">Thông tin đề</h2>
            <Field label="Tên đề">
              <input className={inputClass} value={item.meta.title} onChange={(e) => setMeta({ title: e.target.value })} placeholder="Ví dụ: Kiểm tra giữa kì I — Toán 12" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Môn">
                <SiteSelect value={item.meta.subject} options={SUBJECT_OPTIONS} onChange={(v) => setMeta({ subject: v as Subject })} label="Môn" />
              </Field>
              <Field label="Lớp">
                <SiteSelect value={item.meta.grade} options={GRADE_OPTIONS} onChange={(v) => setMeta({ grade: v })} label="Lớp" />
              </Field>
            </div>
            <Field label="Trường">
              <input className={inputClass} value={item.meta.school} onChange={(e) => setMeta({ school: e.target.value })} placeholder="Tên trường (không bắt buộc)" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Năm học">
                <input className={inputClass} value={item.meta.year} onChange={(e) => setMeta({ year: e.target.value })} />
              </Field>
              <Field label="Kì thi">
                <input className={inputClass} value={item.meta.term} onChange={(e) => setMeta({ term: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[8px] bg-surface p-3 shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
              <h2 className="px-3 pb-1 pt-3 font-display text-[20px] font-semibold text-ink">Cài đặt làm bài</h2>
              <Toggle
                label="Không giới hạn thời gian"
                hint="Học sinh làm thoải mái, không đếm ngược và không tự nộp."
                checked={Boolean(item.settings.noTimeLimit)}
                onChange={(v) => setSettings({ noTimeLimit: v })}
              />
              <div className={cn('px-4 pb-3', item.settings.noTimeLimit && 'pointer-events-none opacity-40')}>
                <Field label="Thời gian làm bài (phút)">
                  <input
                    type="number"
                    min={1}
                    className={inputClass + ' max-w-[160px]'}
                    value={item.meta.durationMinutes}
                    onChange={(e) => setMeta({ durationMinutes: Math.max(1, Math.round(Number(e.target.value)) || 1) })}
                  />
                </Field>
              </div>
              <Toggle
                label="Hiện đáp án và giải thích ngay"
                hint="Trắc nghiệm: chọn xong là hiện đúng/sai và giải thích. Các dạng khác có nút Kiểm tra đáp án."
                checked={Boolean(item.settings.instantFeedback)}
                onChange={(v) => setSettings({ instantFeedback: v })}
              />
              <Toggle
                label="Đảo thứ tự câu hỏi"
                hint="Mỗi lượt làm, các câu hiện theo thứ tự ngẫu nhiên."
                checked={Boolean(item.settings.shuffleQuestions)}
                onChange={(v) => setSettings({ shuffleQuestions: v })}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="soft" onClick={() => goStep(0)}>
                <ArrowLeft className="size-4" />
                Quay lại soạn
              </Button>
              <Button variant="clay" onClick={finish}>
                <Check className="size-4" />
                Tạo đề
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mx-auto max-w-[640px] rounded-[8px] bg-surface p-8 text-center shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-sage-soft text-sage">
            <Check className="size-7" strokeWidth={2.5} />
          </span>
          <h2 className="mt-5 font-display text-[26px] font-semibold tracking-[-0.02em] text-ink">Đề đã tạo xong</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
            “{item.meta.title.trim()}” · {questions.length} câu · {formatPoints(totalOf(questions))} điểm ·{' '}
            {item.settings.noTimeLimit ? 'không giới hạn thời gian' : `${item.meta.durationMinutes} phút`}
          </p>
          <p className="mt-1 text-[13px] text-ink-3">Đề đã lưu trong lịch sử trên máy này. Chưa đăng thì chỉ bạn thấy.</p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Button variant="clay" onClick={() => navigate(`/lam-de/${loadForQuiz(item)}`)}>
              <MonitorPlay className="size-4" />
              Làm thử
            </Button>
            {item.publishedId ? null : (
              <Button variant="outline" disabled={busy} onClick={() => void publish()}>
                <Upload className="size-4" />
                {busy ? 'Đang đăng…' : 'Đăng lên đề cộng đồng'}
              </Button>
            )}
          </div>

          {item.publishedId ? (
            <div className="mt-7 text-left">
              <p className="mb-2 text-[13px] font-semibold text-ink">Đã đăng. Gửi link này cho học sinh:</p>
              <CopyLink url={shareUrl(item.publishedId)} />
              <p className="mt-2 text-[12px] text-ink-3">Bản đăng không tự cập nhật khi bạn sửa đề. Sửa xong muốn đăng lại thì dùng nút bên dưới.</p>
              <Button variant="soft" size="sm" className="mt-3" disabled={busy} onClick={() => void publish()}>
                <Copy className="size-3.5" />
                {busy ? 'Đang đăng…' : 'Đăng lại bản mới'}
              </Button>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-line-2 pt-5 text-[13.5px] font-semibold">
            <button type="button" onClick={() => goStep(0)} className="text-ink-3 transition-colors hover:text-ink">
              Sửa đề
            </button>
            <Link to="/tao-de-online" className="text-ink-3 transition-colors hover:text-ink">
              Về lịch sử
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-[8px] px-4 py-3.5 text-left transition-colors hover:bg-sunken/60"
    >
      <span>
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-3">{hint}</span>
      </span>
      <span className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-clay' : 'bg-line-2')}>
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-all duration-200', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-9 items-center justify-center rounded-[6px] text-ink-3 transition-colors disabled:pointer-events-none disabled:opacity-30',
        danger ? 'hover:bg-clay-soft hover:text-clay' : 'hover:bg-sunken hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function QuestionEditor({
  q,
  issue,
  canUp,
  canDown,
  onPatch,
  onType,
  onMove,
  onDuplicate,
  onRemove,
}: {
  q: Question
  issue: string | null
  canUp: boolean
  canDown: boolean
  onPatch: (p: Partial<Question>) => void
  onType: (t: QuestionType) => void
  onMove: (d: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const type = q.type === 'tu-luan-dong' ? 'tu-luan' : q.type
  const options = q.options ?? []
  const setOption = (i: number, text: string) => onPatch({ options: options.map((o, j) => (j === i ? { ...o, text } : o)) })

  const removeOption = (i: number) => {
    const correct = options.findIndex((o) => o.key === q.answer)
    const next = options.filter((_, j) => j !== i).map((o, j) => ({ ...o, key: KEYS[j] }))
    const kept = correct === i ? -1 : correct > i ? correct - 1 : correct
    onPatch({ options: next, answer: kept >= 0 ? KEYS[kept] : '' })
  }

  const tf = readTrueFalseAnswer(q.answer, options.length)

  return (
    <div className="rounded-[8px] bg-surface p-6 shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-[18px] font-semibold text-ink">Câu {q.number}</p>
        <div className="flex items-center">
          <IconBtn label="Chuyển lên" onClick={() => onMove(-1)} disabled={!canUp}>
            <ArrowUp className="size-4" />
          </IconBtn>
          <IconBtn label="Chuyển xuống" onClick={() => onMove(1)} disabled={!canDown}>
            <ArrowDown className="size-4" />
          </IconBtn>
          <IconBtn label="Nhân đôi câu" onClick={onDuplicate}>
            <Copy className="size-4" />
          </IconBtn>
          <IconBtn label="Xoá câu" onClick={onRemove} danger>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>

      <div role="radiogroup" aria-label="Dạng câu" className="mb-6 flex flex-wrap gap-1.5">
        {ONLINE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => onType(t)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              type === t ? 'bg-ink text-paper' : 'bg-sunken text-ink-2 hover:text-ink',
            )}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <Field label="Đề bài" hint="Công thức viết giữa hai dấu $, ví dụ $x^2 + 1$.">
        <textarea rows={3} className={textareaClass} value={q.prompt} onChange={(e) => onPatch({ prompt: e.target.value })} placeholder="Nhập nội dung câu hỏi" />
      </Field>
      {q.prompt.includes('$') ? (
        <div className="mt-2 rounded-[6px] bg-sunken/70 px-4 py-3 text-[15px] text-ink">
          <MathText as="div">{q.prompt}</MathText>
        </div>
      ) : null}

      {type === 'trac-nghiem' ? (
        <div className="mt-6">
          <p className="eyebrow mb-2">Phương án (bấm vòng tròn để chọn đáp án đúng)</p>
          <ul className="space-y-2">
            {options.map((o, i) => {
              const right = q.answer === o.key
              return (
                <li key={o.key} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label={`Chọn ${o.key} là đáp án đúng`}
                    aria-pressed={right}
                    onClick={() => onPatch({ answer: o.key })}
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold transition-colors',
                      right ? 'border-sage bg-sage text-white' : 'border-line-2 bg-white text-ink-3 hover:border-ink-4',
                    )}
                  >
                    {right ? <Check className="size-4" strokeWidth={3} /> : o.key}
                  </button>
                  <input className={inputClass} value={o.text} onChange={(e) => setOption(i, e.target.value)} placeholder={`Phương án ${o.key}`} aria-label={`Phương án ${o.key}`} />
                  <IconBtn label={`Xoá phương án ${o.key}`} onClick={() => removeOption(i)} disabled={options.length <= 2} danger>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </li>
              )
            })}
          </ul>
          {options.length < KEYS.length ? (
            <button
              type="button"
              onClick={() => onPatch({ options: [...options, { key: KEYS[options.length], text: '' }] })}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              <Plus className="size-3.5" />
              Thêm phương án
            </button>
          ) : null}
        </div>
      ) : null}

      {type === 'dung-sai' ? (
        <div className="mt-6">
          <p className="eyebrow mb-2">Các ý và đáp án Đúng/Sai</p>
          <ul className="space-y-2">
            {options.map((o, i) => (
              <li key={o.key} className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line-2 bg-white text-[13px] font-bold text-ink-3">{o.key}</span>
                <input className={inputClass + ' min-w-0 flex-1'} value={o.text} onChange={(e) => setOption(i, e.target.value)} placeholder={`Ý ${o.key})`} aria-label={`Ý ${o.key}`} />
                <span className="flex shrink-0 gap-1.5">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      aria-pressed={tf[i] === v}
                      onClick={() => onPatch({ answer: formatTrueFalse(tf.map((x, j) => (j === i ? v : x))) })}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                        tf[i] === v
                          ? v
                            ? 'border-sage bg-sage text-white'
                            : 'border-clay bg-clay text-white'
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
        </div>
      ) : null}

      {type === 'tra-loi-ngan' ? (
        <div className="mt-6">
          <Field label="Đáp án" hint={`Một số, tối đa ${SHORT_MAX_CHARS} ký tự (kể cả dấu âm và dấu phẩy), ví dụ 12, -3,5, 0,25.`}>
            <input
              className={inputClass + ' max-w-[180px] text-center font-mono text-[18px] tracking-[0.3em]'}
              inputMode="decimal"
              maxLength={SHORT_MAX_CHARS}
              value={q.answer ?? ''}
              onChange={(e) => onPatch({ answer: e.target.value.replace(/\./g, ',').replace(/[^0-9,-]/g, '').slice(0, SHORT_MAX_CHARS) })}
            />
          </Field>
        </div>
      ) : null}

      <div className="mt-6">
        {type === 'tu-luan' ? (
          <Field label="Lời giải (tuỳ chọn)" hint="Mỗi dòng là một bước. Học sinh thấy sau khi nộp bài.">
            <textarea
              rows={4}
              className={textareaClass}
              value={(q.solution ?? []).join('\n')}
              onChange={(e) => onPatch({ solution: e.target.value ? e.target.value.split('\n') : undefined })}
            />
          </Field>
        ) : (
          <Field label="Giải thích (tuỳ chọn)" hint="Hiện ở phần xem lại bài, hoặc ngay sau khi chọn nếu bật “Hiện đáp án và giải thích ngay”. Câu để trống thì không hiện.">
            <textarea rows={3} className={textareaClass} value={q.explanation ?? ''} onChange={(e) => onPatch({ explanation: e.target.value || undefined })} />
          </Field>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-5">
        <Field label="Điểm" className="w-[120px]">
          <input
            type="number"
            min={0}
            step={0.25}
            className={inputClass}
            value={q.points}
            onChange={(e) => onPatch({ points: Math.max(0, Number(e.target.value) || 0) })}
          />
        </Field>
        {issue ? (
          <p role="status" className="rounded-full bg-clay-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-clay">
            {issue}
          </p>
        ) : (
          <p className="rounded-full bg-sage-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-sage">Câu hoàn chỉnh</p>
        )}
      </div>
    </div>
  )
}
