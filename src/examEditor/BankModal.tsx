/**
 * Kho câu hỏi trong trình soạn: danh sách card bên trái, chi tiết câu đang xem bên phải.
 * Tick checkbox để chọn; các câu đã chọn được chèn một lần tại con trỏ, theo thứ tự chọn.
 */
import { useEffect, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { Check, Search, X } from 'lucide-react'
import { SiteSelect } from '@/components/SiteSelect'
import { MathText } from '@/components/MathText'
import { Badge, Button, inputClass } from '@/components/ui'
import { BANK, type BankEntry } from '@/data/bank'
import { GRADES, SUBJECTS, TYPE_LABEL, type QuestionType } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatPoints } from '@/lib/math'
import { bankSelectionTemplate } from './bankQuestions'
import { insertBlockTemplate } from './templates'

/** Số câu tối đa hiện trong danh sách; thu hẹp bộ lọc để xem thêm. */
const LIST_LIMIT = 120

const SUBJECT_OPTIONS = [{ value: '', label: 'Mọi môn' }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]
const GRADE_OPTIONS = [{ value: '', label: 'Mọi lớp' }, ...GRADES.map((g) => ({ value: g, label: g }))]
const TYPE_OPTIONS: Array<{ value: QuestionType | ''; label: string }> = [
  { value: '', label: 'Mọi loại' },
  ...(Object.keys(TYPE_LABEL) as QuestionType[]).map((k) => ({ value: k, label: TYPE_LABEL[k] })),
]

export function BankModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [type, setType] = useState<QuestionType | ''>('')
  const [activeId, setActiveId] = useState<string | null>(null)
  // thứ tự chọn được giữ nguyên khi chèn
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return BANK.filter((b) => {
      if (subject && b.subject !== subject) return false
      if (grade && !b.grades.includes(grade) && !b.grades.includes('all')) return false
      if (type && b.type !== type) return false
      if (!needle) return true
      return b.prompt.toLowerCase().includes(needle) || b.tags.some((t) => t.includes(needle))
    })
  }, [q, subject, grade, type])

  const shown = results.find((b) => b.id === activeId) ?? results[0] ?? null

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const insert = () => {
    const chosen = selected
      .map((id) => BANK.find((b) => b.id === id))
      .filter((b): b is BankEntry => Boolean(b))
    if (chosen.length === 0) return
    insertBlockTemplate(editor, bankSelectionTemplate(chosen))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kho câu hỏi"
        className="anim-pop flex h-[min(780px,92vh)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[8px] bg-surface shadow-float"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-7 pb-4 pt-6">
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

        <div className="flex flex-wrap items-center gap-2.5 px-7 pb-5">
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
        </div>

        <div className="grid min-h-0 flex-1 border-t border-line md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="min-h-0 overflow-y-auto p-4 md:border-r md:border-line">
            {results.length === 0 ? (
              <p className="px-3 py-10 text-center text-[14px] text-ink-3">Không có câu nào khớp bộ lọc.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {results.slice(0, LIST_LIMIT).map((b) => {
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
                        className="block w-full px-4 py-3.5 pr-12 text-left"
                      >
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="clay">{b.subject}</Badge>
                          <Badge tone="outline">{TYPE_LABEL[b.type]}</Badge>
                        </div>
                        <div className="mt-2.5 line-clamp-2 text-[14.5px] leading-snug text-ink">
                          <MathText as="span">{b.prompt}</MathText>
                        </div>
                        <p className="mt-2 text-[12px] font-medium text-ink-3 tnum">
                          {b.grades.includes('all') ? 'Mọi lớp' : b.grades.join(', ')} · {formatPoints(b.points)}đ
                        </p>
                      </button>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label="Chọn câu này"
                        onClick={() => toggle(b.id)}
                        className={cn(
                          'absolute right-4 top-4 flex size-5 items-center justify-center rounded-[5px] border-2 transition-colors',
                          checked ? 'border-clay bg-clay text-white' : 'border-line-2 bg-white hover:border-ink-4',
                        )}
                      >
                        {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {results.length > LIST_LIMIT ? (
              <p className="pt-4 text-center text-[12.5px] text-ink-4">
                Hiển thị {LIST_LIMIT} / {results.length} câu — thu hẹp bộ lọc để xem thêm.
              </p>
            ) : null}
          </div>

          <div className="min-h-0 overflow-y-auto p-7">
            {shown ? <QuestionDetail entry={shown} /> : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line px-7 py-4">
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
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="clay">{entry.subject}</Badge>
        <Badge tone="outline">{TYPE_LABEL[entry.type]}</Badge>
        <Badge tone="honey">{formatPoints(entry.points)}đ</Badge>
      </div>

      <div className="mt-4 text-[16.5px] leading-relaxed text-ink">
        <MathText as="div">{entry.prompt}</MathText>
      </div>

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
          <div className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
            <MathText as="div">{entry.explanation}</MathText>
          </div>
        </section>
      ) : null}

      {entry.tags.length ? (
        <p className="mt-6 text-[12px] text-ink-4">{entry.tags.map((t) => `#${t}`).join('  ')}</p>
      ) : null}
    </div>
  )
}
