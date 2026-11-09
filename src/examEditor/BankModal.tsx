/**
 * Kho câu hỏi trong trình soạn: danh sách card bên trái, chi tiết câu đang xem bên phải.
 * Tick checkbox để chọn; các câu đã chọn được chèn một lần tại con trỏ, theo thứ tự chọn.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { Search, X } from 'lucide-react'
import { SiteSelect } from '@/components/SiteSelect'
import { MathText } from '@/components/MathText'
import { Badge, Button, Checkbox, inputClass } from '@/components/ui'
import { BANK, loadFullBank, type BankEntry } from '@/data/bank'
import { LEVEL_LABEL, levelOf, type BankLevel } from '@/data/bankLevel'
import { GRADES, SUBJECTS, TYPE_LABEL, type QuestionType } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatPoints } from '@/lib/math'
import { bankSelectionTemplate } from './bankQuestions'
import { insertBlockTemplate } from './templates'
import { figureDoc, figureImageAttrs, pngifyToolImages } from './toolImages'

/** ảnh hình vẽ của câu (vẽ một lần, nhớ lại theo id) */
const figureCache = new Map<string, { src: string; alt: string } | null>()
function figureOf(entry: BankEntry) {
  if (!entry.figure) return null
  if (!figureCache.has(entry.id)) {
    const doc = figureDoc(entry.figure)
    figureCache.set(entry.id, doc ? figureImageAttrs(doc) : null)
  }
  return figureCache.get(entry.id) ?? null
}

/** Số câu hiện lúc đầu và nạp thêm mỗi lần cuộn tới cuối danh sách. */
const PAGE_SIZE = 20

/** Dòng cuối danh sách: lọt vào khung nhìn (trước khoảng 300px) thì báo để nạp thêm câu. */
function LoadMoreSentinel({ root, onVisible, children }: { root: React.RefObject<HTMLDivElement | null>; onVisible: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const cb = useRef(onVisible)
  cb.current = onVisible
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && cb.current(), { root: root.current, rootMargin: '0px 0px 300px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [root])
  return (
    <p ref={ref} className="pt-4 text-center text-[12px] text-ink-4">
      {children}
    </p>
  )
}

const SUBJECT_OPTIONS = [{ value: '', label: 'Mọi môn' }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]
const GRADE_OPTIONS = [{ value: '', label: 'Mọi lớp' }, ...GRADES.map((g) => ({ value: g, label: g }))]
/**
 * Giải thích câu Đúng/Sai viết liền "a) … Đúng. b) … Sai." → tách từng ý, bóc
 * kết luận cuối ý. Không thấy đủ a), b) theo thứ tự (ngoài công thức) thì trả null.
 */
function splitByItems(
  text: string,
  answer?: string,
): { intro: string; items: Array<{ key: string; text: string; verdict?: 'Đúng' | 'Sai' }> } | null {
  // vị trí "x) " (hoặc "x Đúng"/"x Sai") nằm ngoài $…$, đầu chuỗi hoặc sau khoảng trắng
  const marks: Array<{ key: string; at: number; end: number }> = []
  let inMath = false
  const want = ['a', 'b', 'c', 'd']
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '$' && text[i - 1] !== '\\') inMath = !inMath
    if (inMath) continue
    const key = want[marks.length]
    if (!key || text[i] !== key || (i > 0 && !/\s/.test(text[i - 1]))) continue
    if (text[i + 1] === ')') marks.push({ key, at: i, end: i + 2 })
    else if (/^ (Đúng|Sai|Đ\s*:|S\s*:)/.test(text.slice(i + 1, i + 7))) marks.push({ key, at: i, end: i + 1 })
  }
  if (marks.length < 2) return null
  // đáp án dạng "ĐSSĐ" → kết luận từng ý khi giải thích không ghi
  const fromAnswer = [...(answer ?? '').replace(/[^ĐS]/g, '')]
  const items = marks.map((m, k) => {
    let t = text.slice(m.end, marks[k + 1]?.at ?? text.length).trim()
    let verdict: 'Đúng' | 'Sai' | undefined
    const head = /^(?:(Đúng|Sai)\s*[:.,;–-]?|(Đ|S)\s*:)\s*/.exec(t)
    const tail = /[:.,;–-]?\s*(Đúng|Sai)\.?$/.exec(t)
    if (head) {
      verdict = head[1] ? (head[1] as 'Đúng' | 'Sai') : head[2] === 'Đ' ? 'Đúng' : 'Sai'
      t = t.slice(head[0].length)
    } else if (tail) {
      verdict = tail[1] as 'Đúng' | 'Sai'
      t = t.slice(0, tail.index).trim()
    }
    const a = fromAnswer[want.indexOf(m.key)]
    if (!verdict && fromAnswer.length === 4 && a) verdict = a === 'Đ' ? 'Đúng' : 'Sai'
    return { key: m.key, text: t, verdict }
  })
  return { intro: text.slice(0, marks[0].at).trim(), items }
}

const TYPE_OPTIONS: Array<{ value: QuestionType | ''; label: string }> = [
  { value: '', label: 'Mọi loại' },
  ...(Object.keys(TYPE_LABEL) as QuestionType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] })),
]
const LEVEL_OPTIONS: Array<{ value: BankLevel | ''; label: string }> = [
  { value: '', label: 'Mọi độ khó' },
  ...(Object.keys(LEVEL_LABEL) as BankLevel[]).map((k) => ({ value: k, label: LEVEL_LABEL[k] })),
]
const LEVEL_TONE = { de: 'sage', tb: 'honey', kho: 'clay' } as const

function LevelChip({ entry }: { entry: BankEntry }) {
  const lv = levelOf(entry)
  return <Badge tone={LEVEL_TONE[lv]}>{LEVEL_LABEL[lv]}</Badge>
}

export function BankModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [type, setType] = useState<QuestionType | ''>('')
  const [level, setLevel] = useState<BankLevel | ''>('')
  const [activeId, setActiveId] = useState<string | null>(null)
  // thứ tự chọn được giữ nguyên khi chèn
  const [selected, setSelected] = useState<string[]>([])
  const [bank, setBank] = useState<BankEntry[]>(BANK)

  useEffect(() => {
    let alive = true
    void loadFullBank().then((b) => alive && setBank(b))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // số câu đang hiện; đổi bộ lọc (results đổi) thì về lại trang đầu
  const listRef = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState<{ of: unknown; n: number }>({ of: null, n: PAGE_SIZE })
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return bank.filter((b) => {
      if (subject && b.subject !== subject) return false
      if (grade && !b.grades.includes(grade) && !b.grades.includes('all')) return false
      if (type && b.type !== type) return false
      if (level && levelOf(b) !== level) return false
      if (!needle) return true
      return b.prompt.toLowerCase().includes(needle) || b.tags.some((t) => t.includes(needle))
    })
  }, [bank, q, subject, grade, type, level])
  const shownCount = more.of === results ? more.n : PAGE_SIZE

  const shown = results.find((b) => b.id === activeId) ?? results[0] ?? null

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const insert = () => {
    const chosen = selected
      .map((id) => bank.find((b) => b.id === id))
      .filter((b): b is BankEntry => Boolean(b))
    if (chosen.length === 0) return
    insertBlockTemplate(editor, bankSelectionTemplate(chosen))
    if (chosen.some((b) => b.figure)) void pngifyToolImages(editor)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-2 md:p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kho câu hỏi"
        className="anim-pop flex h-[96dvh] md:h-[min(780px,92vh)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[8px] bg-surface shadow-float"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-4 py-3 md:px-7 md:pb-4 md:pt-6">
          <div>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">Kho câu hỏi</h2>
            <p className="mt-1 text-[13.5px] text-ink-3">
              Tick các câu cần dùng, rồi chèn một lần tại vị trí con trỏ.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-9 shrink-0 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 md:px-7 md:pb-5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm trong nội dung câu hỏi…"
              className={inputClass + ' h-11 pl-11'}
            />
          </div>
          <SiteSelect value={subject} options={SUBJECT_OPTIONS} onChange={setSubject} label="Lọc theo môn" className="w-[150px]" />
          <SiteSelect value={grade} options={GRADE_OPTIONS} onChange={setGrade} label="Lọc theo lớp" className="w-[130px]" />
          <SiteSelect value={type} options={TYPE_OPTIONS} onChange={setType} label="Lọc theo loại" className="w-[160px]" />
          <SiteSelect value={level} options={LEVEL_OPTIONS} onChange={setLevel} label="Lọc theo độ khó" className="w-[140px]" />
        </div>

        <div className="grid min-h-0 flex-1 border-t border-line grid-rows-[1fr_1fr] md:grid-rows-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div ref={listRef} className="min-h-0 overflow-y-auto p-4 md:border-r md:border-line">
            {results.length === 0 ? (
              <p className="px-3 py-10 text-center text-[14px] text-ink-3">Không có câu nào khớp bộ lọc.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {results.slice(0, shownCount).map((b) => {
                  const checked = selected.includes(b.id)
                  const active = shown?.id === b.id
                  return (
                    <li
                      key={b.id}
                      className={cn(
                        'relative rounded-[8px] border bg-surface transition-colors',
                        active ? 'border-clay/50 bg-clay-tint/50' : 'border-line-2 hover:border-ink-4',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveId(b.id)}
                        className="flex w-full gap-3 px-4 py-3.5 pr-12 text-left"
                      >
                        <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="clay">{b.subject}</Badge>
                          <Badge tone="outline">{TYPE_LABEL[b.type]}</Badge>
                          <LevelChip entry={b} />
                          {b.figure ? <Badge tone="honey">Có hình</Badge> : null}
                        </div>
                        <div className="mt-2.5 line-clamp-2 text-[14.5px] leading-snug text-ink">
                          <MathText as="span">{b.prompt}</MathText>
                        </div>
                        <p className="mt-2 text-[12px] font-medium text-ink-3 tnum">
                          {b.grades.includes('all') ? 'Mọi lớp' : b.grades.join(', ')} · {formatPoints(b.points)}đ
                        </p>
                        </div>
                        {b.figure ? <FigureThumb entry={b} /> : null}
                      </button>
                      <Checkbox
                        checked={checked}
                        onChange={() => toggle(b.id)}
                        aria-label="Chọn câu này"
                        className="absolute right-3 top-3 p-1"
                      />
                    </li>
                  )
                })}
              </ul>
            )}
            {results.length > shownCount ? (
              // key theo số câu: gắn lại sau mỗi lần nạp, nên nếu vẫn còn trong khung nhìn thì nạp tiếp
              <LoadMoreSentinel
                key={shownCount}
                root={listRef}
                onVisible={() => setMore({ of: results, n: shownCount + PAGE_SIZE })}
              >
                Đang hiện {shownCount} / {results.length} câu — cuộn xuống để xem thêm
              </LoadMoreSentinel>
            ) : null}
          </div>

          <div className="min-h-0 overflow-y-auto p-4 md:p-7">
            {shown ? <QuestionDetail entry={shown} /> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 md:px-7 md:py-4">
          <p className="text-[13.5px] text-ink-3">
            <span className="font-semibold text-ink tnum">{selected.length}</span> câu đã chọn · chèn theo thứ tự chọn
          </p>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button variant="clay" onClick={insert} disabled={selected.length === 0}>
              Chèn {selected.length || ''} câu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Chi tiết một câu: đề bài, các phương án (đáp án đúng được tô), lời giải. */
function QuestionDetail({ entry }: { entry: BankEntry }) {
  const choice = entry.type === 'trac-nghiem' && (entry.options?.length ?? 0) > 0
  const figure = figureOf(entry)
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="clay">{entry.subject}</Badge>
        <Badge tone="outline">{TYPE_LABEL[entry.type]}</Badge>
        <LevelChip entry={entry} />
        <Badge tone="outline">{formatPoints(entry.points)}đ</Badge>
      </div>

      <div className="mt-4 text-[16.5px] leading-relaxed text-ink">
        <MathText as="div">{entry.prompt}</MathText>
      </div>

      {figure ? (
        <div className="mt-4 flex justify-center rounded-[6px] border border-line-2 bg-white p-3">
          <img src={figure.src} alt={figure.alt} className="max-h-[280px] max-w-full" />
        </div>
      ) : null}

      {choice ? (
        <ol className="mt-5 flex flex-col gap-2">
          {entry.options?.map((o) => {
            const correct = entry.answer === o.key
            return (
              <li
                key={o.key}
                className={cn(
                  'flex items-start gap-3 rounded-[6px] border px-4 py-3 text-[14.5px]',
                  correct ? 'border-sage/40 bg-sage-soft text-ink' : 'border-line-2 text-ink-2',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                    correct ? 'bg-sage text-white' : 'bg-sunken text-ink-3',
                  )}
                >
                  {o.key}
                </span>
                <span className="pt-0.5">
                  <MathText as="span">{o.text}</MathText>
                </span>
                {correct ? <span className="ml-auto shrink-0 pt-0.5 text-[12px] font-semibold text-sage">Đáp án đúng</span> : null}
              </li>
            )
          })}
        </ol>
      ) : null}

      {entry.type === 'dung-sai' && entry.options?.length ? (
        <ol className="mt-5 flex flex-col gap-2">
          {entry.options.map((o, i) => {
            const v = entry.answer?.[i]
            return (
              <li key={o.key} className="flex items-start gap-3 rounded-[6px] border border-line-2 px-4 py-3 text-[14.5px] text-ink-2">
                <span className="shrink-0 pt-0.5 font-semibold text-ink-3">{o.key})</span>
                <span className="pt-0.5">
                  <MathText as="span">{o.text}</MathText>
                </span>
                {v ? (
                  <span className={cn('ml-auto shrink-0 pt-0.5 text-[12px] font-semibold', v === 'Đ' ? 'text-sage' : 'text-clay')}>
                    {v === 'Đ' ? 'Đúng' : 'Sai'}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>
      ) : null}

      {entry.type === 'tra-loi-ngan' && entry.answer ? (
        <p className="mt-5 rounded-[6px] border border-sage/40 bg-sage-soft px-4 py-3 text-[14.5px] text-ink">
          Đáp án: <span className="font-semibold">{entry.answer}</span>
        </p>
      ) : null}

      {entry.solution?.length ? (
        <section className="mt-6">
          <h3 className="text-[13px] font-semibold text-ink-2">Lời giải</h3>
          <div className="mt-2 flex flex-col gap-2 text-[14.5px] leading-relaxed text-ink-2">
            {entry.solution.map((line, i) => (
              <MathText key={i} as="div">
                {line}
              </MathText>
            ))}
          </div>
        </section>
      ) : null}

      {entry.explanation ? (
        <section className="mt-6">
          <h3 className="text-[13px] font-semibold text-ink-2">Giải thích</h3>
          {(() => {
            const parts = entry.type === 'dung-sai' ? splitByItems(entry.explanation, typeof entry.answer === 'string' ? entry.answer : undefined) : null
            if (!parts) {
              return (
                <div className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
                  <MathText as="div">{entry.explanation}</MathText>
                </div>
              )
            }
            return (
              <div className="mt-2 space-y-2">
                {parts.intro ? (
                  <div className="text-[14.5px] leading-relaxed text-ink-2">
                    <MathText as="div">{parts.intro}</MathText>
                  </div>
                ) : null}
                {parts.items.map((it) => (
                  <div key={it.key} className="flex gap-3 rounded-[6px] border border-line px-3.5 py-2.5 text-[14.5px] leading-relaxed text-ink-2">
                    <span className="shrink-0 font-semibold text-ink">{it.key})</span>
                    <MathText as="div" className="min-w-0 flex-1">{it.text}</MathText>
                    {it.verdict ? (
                      <span className={cn('shrink-0 self-start text-[12.5px] font-semibold', it.verdict === 'Đúng' ? 'text-sage' : 'text-clay')}>{it.verdict}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          })()}
        </section>
      ) : null}

      {entry.tags.length ? (
        <p className="mt-6 text-[12px] text-ink-4">{entry.tags.map((t) => `#${t}`).join('  ')}</p>
      ) : null}
    </div>
  )
}

/** hình nhỏ ở danh sách: chỉ vẽ khi dòng cuộn tới để danh sách dài không giật */
function FigureThumb({ entry }: { entry: BankEntry }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  const fig = seen ? figureOf(entry) : null
  return (
    <div ref={ref} className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-line-2 bg-white p-1">
      {fig ? <img src={fig.src} alt={fig.alt} className="max-h-full max-w-full" /> : null}
    </div>
  )
}
