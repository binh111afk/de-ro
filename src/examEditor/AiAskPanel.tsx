/**
 * Panel hỏi lại: khi yêu cầu quá mơ hồ ("soạn đề đi"), AI trả {"action":"ask",...}
 * thay vì soạn. Panel thế chỗ ô nhập, hỏi lần lượt từng câu, có ô tự nhập.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { extractJson } from '@/lib/llm'
import { cn } from '@/lib/cn'

export interface AiAskQuestion {
  q: string
  options: string[]
  multi?: boolean
}

export interface AiAsk {
  intro?: string
  questions: AiAskQuestion[]
  /** câu hỏi của app, không phải của AI: không tự thêm câu hỏi hình */
  noFigure?: true
}

const SUBJECT_RE =
  /to[aá]n|v[aậ]t\s*l|m[oô]n\s*l[ýy]|h[oó][aá]|sinh|v[aă]n|ti[ếe]ng|anh|english|s[ửu]|[đd][iị]a|gdcd|c[ôo]ng\s*d[âa]n|tin\s*h[ọo]c|c[ôo]ng\s*ngh[ệe]|khtn|khoa\s*h[ọo]c|[âa]m\s*nh[ạa]c|m[ỹy]\s*thu[ậa]t|th[ểe]\s*d[ụu]c|qu[ốo]c\s*ph[òo]ng|ph[áa]p|nh[ậa]t|h[àa]n\s*qu[ốo]c|trung\s*qu[ốo]c/i

/** yêu cầu ngắn, chưa nêu môn (vd "soạn đề đi"): hỏi bằng prompt ngắn trước, khỏi gửi cả hướng dẫn hình mọi môn */
export const needsAskFirst = (text: string) => text.trim().length < 80 && !SUBJECT_RE.test(text)

/** đọc JSON hỏi lại của model; không phải thì null */
export function parseAsk(raw: string): AiAsk | null {
  if (!/"action"\s*:\s*"ask"/.test(raw)) return null
  try {
    const j = extractJson<{ intro?: unknown; questions?: unknown }>(raw)
    if (!Array.isArray(j.questions)) return null
    const questions = j.questions
      .map((x): AiAskQuestion | null => {
        const o = x as Record<string, unknown>
        const q = typeof o?.q === 'string' ? o.q.trim() : ''
        const options = Array.isArray(o?.options)
          ? o.options.filter((s): s is string => typeof s === 'string' && !!s.trim()).map((s) => s.trim())
          : []
        if (!q) return null
        return { q, options: options.filter((s) => !/^(khác|tự nhập)/i.test(s)).slice(0, 6), multi: o.multi === true }
      })
      .filter((x): x is AiAskQuestion => !!x)
      .slice(0, 4)
    if (!questions.length) return null
    return { intro: typeof j.intro === 'string' ? j.intro.trim() : undefined, questions }
  } catch {
    return null
  }
}

/** câu hỏi hình minh hoạ, app tự thêm cho đề Toán */
const FIG_YES = 'Có, câu nào cần hình thì vẽ'
const FIG_NO = 'Không cần hình'
const FIG_Q: AiAskQuestion = { q: 'Đề có cần hình minh hoạ không?', options: [FIG_YES, FIG_NO] }
/** nói rõ cho model hiểu lựa chọn hình */
const FIG_MEANING: Record<string, string> = {
  [FIG_YES]: 'Có — chỉ vẽ hình (figure) cho câu nào phải nhìn hình mới làm được, không ép tỉ lệ câu có hình',
  [FIG_NO]: 'Không — không thêm figure nào vào đề',
}

/** không thao tác quá lâu thì tự gửi, câu chưa chọn theo ASK_DEFAULT */
const IDLE_MS = 2 * 60_000
/** hiện đếm ngược trong khoảng cuối */
const WARN_MS = 30_000

/** câu trả lời gửi lại cho model, mỗi câu một dòng */
export function askAnswerText(questions: AiAskQuestion[], answers: string[][]): string {
  const lines = questions
    .map((q, i) =>
      answers[i]?.length
        ? `${q.q.replace(/\?$/, '')}: ${answers[i].map((x) => (q === FIG_Q ? FIG_MEANING[x] ?? x : x)).join(', ')}`
        : '',
    )
    .filter(Boolean)
  return lines.length < questions.length ? [...lines, ASK_DEFAULT].join('\n') : lines.join('\n')
}

/** câu nào người dùng không trả lời (bỏ qua, hết giờ) thì theo mặc định này, không để AI tự quyết */
export const ASK_DEFAULT =
  'Những gì chưa chọn: làm theo một đề có bố cục chuẩn (đúng cấu trúc đề kiểm tra thường dùng của môn và lớp) và độ khó phân bố đều.'

/** để đưa vào lịch sử hội thoại */
export function askHistoryText(ask: AiAsk): string {
  return ask.questions.map((q) => `- ${q.q} (${q.options.join(' / ')})`).join('\n')
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

export function AiAskPanel({
  ask,
  request = '',
  figure = true,
  onSubmit,
  onSkip,
}: {
  ask: AiAsk
  /** yêu cầu gốc của người dùng, để biết có phải đề Toán không */
  request?: string
  /** slide môn nào cũng có hình nên chỉ đề mới hỏi */
  figure?: boolean
  /** câu trả lời đã ghép thành văn bản gửi model */
  onSubmit: (text: string) => void
  onSkip: () => void
}) {
  const base = ask.questions
  const max = base.length + 1
  const [at, setAt] = useState(0)
  const [picks, setPicks] = useState<string[][]>(() => Array.from({ length: max }, () => []))
  const [custom, setCustom] = useState<string[]>(() => Array.from({ length: max }, () => ''))
  const [typing, setTyping] = useState<boolean[]>(() => Array.from({ length: max }, () => false))
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const mergeAnswers = (p: string[][], ty: boolean[], cu: string[]) =>
    p.map((x, i) => (ty[i] && cu[i].trim() ? [...x, cu[i].trim()] : x))
  const answers = useMemo(() => mergeAnswers(picks, typing, custom), [picks, custom, typing])

  /** đề Toán (theo yêu cầu gốc hoặc câu đã chọn) mà AI chưa hỏi về hình → thêm câu hình ở cuối */
  const questionsFor = (ans: string[][]): AiAskQuestion[] => {
    const askedFig = base.some((x) => /minh ho[ạa]|hình vẽ|có hình/i.test(x.q))
    const math = figure && (/toán/i.test(request) || ans.some((a) => a.some((x) => /toán/i.test(x))))
    return !askedFig && math ? [...base, FIG_Q] : base
  }
  const questions = questionsFor(answers)
  const total = questions.length
  const q = questions[Math.min(at, total - 1)]
  const last = at >= total - 1
  const answered = answers[at].length > 0

  const submit = (ans: string[][]) => onSubmit(askAnswerText(questionsFor(ans), ans))

  // không thao tác IDLE_MS thì tự gửi; câu chưa trả lời theo ASK_DEFAULT
  const lastTouch = useRef(Date.now())
  const latest = useRef(() => {})
  latest.current = () => submit(answers)
  const [left, setLeft] = useState(IDLE_MS)
  useEffect(() => {
    const id = window.setInterval(() => {
      const remain = IDLE_MS - (Date.now() - lastTouch.current)
      if (remain <= 0) {
        window.clearInterval(id)
        latest.current()
      } else setLeft(remain)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])
  const touch = () => {
    lastTouch.current = Date.now()
    setLeft(IDLE_MS)
  }

  useEffect(() => {
    if (typing[at]) inputRef.current?.focus()
    else rootRef.current?.focus()
  }, [at, typing])

  const go = (next: number) => setAt(Math.max(0, Math.min(total - 1, next)))
  const advance = (ans = answers) => {
    const n = questionsFor(ans).length
    if (at >= n - 1) submit(ans)
    else setAt(at + 1)
  }

  const choose = (opt: string) => {
    if (q.multi) {
      setPicks((cur) => cur.map((p, i) => (i !== at ? p : p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt])))
      return
    }
    const nextPicks = picks.map((p, i) => (i === at ? [opt] : p))
    const nextTyping = typing.map((t, i) => (i === at ? false : t))
    setPicks(nextPicks)
    setTyping(nextTyping)
    // chọn một: tự sang câu sau như các khung chat AI
    const ans = mergeAnswers(nextPicks, nextTyping, custom)
    window.setTimeout(() => advance(ans), 140)
  }

  const openCustom = () => {
    setTyping((cur) => cur.map((t, i) => (i === at ? true : t)))
    if (!q.multi) setPicks((cur) => cur.map((p, i) => (i === at ? [] : p)))
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return
    const n = Number(e.key)
    if (n >= 1 && n <= q.options.length) {
      e.preventDefault()
      choose(q.options[n - 1])
    } else if (n === q.options.length + 1) {
      e.preventDefault()
      openCustom()
    } else if (e.key === 'Enter' && answered) {
      e.preventDefault()
      advance()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onSkip()
    }
  }

  return (
    <div className="ai-composer">
      <div className="ai-ask" ref={rootRef} tabIndex={-1} onKeyDown={onKey} onPointerDown={touch} onKeyDownCapture={touch} onInput={touch} role="group" aria-label="AI hỏi thêm">
        <div className="ai-ask__head">
          <span className="ai-ask__q" key={at}>{q.q}</span>
          {total > 1 ? (
            <span className="ai-ask__nav">
              <button type="button" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Câu trước">
                <Chevron dir="left" />
              </button>
              <span className="ai-ask__count">{at + 1}/{total}</span>
              <button type="button" onClick={() => go(at + 1)} disabled={last || !answered} aria-label="Câu sau">
                <Chevron dir="right" />
              </button>
            </span>
          ) : null}
        </div>

        <div className="ai-ask__opts" key={`o${at}`} role={q.multi ? 'group' : 'radiogroup'}>
          {q.options.map((opt, i) => {
            const on = picks[at].includes(opt)
            return (
              <button
                key={opt}
                type="button"
                role={q.multi ? 'checkbox' : 'radio'}
                aria-checked={on}
                className={cn('ai-ask__opt', on && 'is-on')}
                onClick={() => choose(opt)}
              >
                <span className={cn('ai-ask__key', q.multi && 'is-box')}>
                  {on && q.multi ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5 9-10" /></svg> : i + 1}
                </span>
                <span className="ai-ask__label">{opt}</span>
              </button>
            )
          })}
          {typing[at] ? (
            <div className="ai-ask__opt is-on is-input">
              <span className="ai-ask__key">{q.options.length + 1}</span>
              <input
                ref={inputRef}
                value={custom[at]}
                placeholder="Nhập câu trả lời"
                onChange={(e) => setCustom((cur) => cur.map((c, i) => (i === at ? e.target.value : c)))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && answered) {
                    e.preventDefault()
                    advance()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setTyping((cur) => cur.map((t, i) => (i === at ? false : t)))
                  }
                }}
              />
            </div>
          ) : (
            <button type="button" className="ai-ask__opt is-other" onClick={openCustom}>
              <span className="ai-ask__key">{q.options.length + 1}</span>
              <span className="ai-ask__label">Khác…</span>
            </button>
          )}
        </div>

        <div className="ai-ask__foot">
          <button type="button" className="ai-ask__skip" onClick={onSkip}>
            Bỏ qua
          </button>
          {left <= WARN_MS ? (
            <span className="ai-ask__auto">Tự gửi sau {Math.ceil(left / 1000)} giây</span>
          ) : null}
          {q.multi || typing[at] || last ? (
            <button type="button" className="ai-ask__next" disabled={!answered} onClick={() => advance()}>
              {last ? 'Gửi' : 'Tiếp'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
