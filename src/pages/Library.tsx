import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, FolderPlus, Search, Tag } from 'lucide-react'
import { Badge, Button, EmptyState, inputClass, selectAutoClass } from '@/components/ui'
import { MathText } from '@/components/MathText'
import { BANK } from '@/data/bank'
import { GRADES, SUBJECTS, TYPE_LABEL } from '@/data/types'
import { useApp } from '@/store/app'
import { formatPoints } from '@/lib/math'

export default function Library() {
  const addQuestion = useApp((s) => s.addQuestion)
  const draft = useApp((s) => s.draft)
  const createDraft = useApp((s) => s.createDraft)

  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [tag, setTag] = useState('')

  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const b of BANK) for (const t of b.tags) set.add(t)
    return [...set].sort()
  }, [])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return BANK.filter((b) => {
      if (subject && b.subject !== subject) return false
      if (grade && !b.grades.includes(grade) && !b.grades.includes('all')) return false
      if (tag && !b.tags.includes(tag)) return false
      if (!needle) return true
      return (
        b.prompt.toLowerCase().includes(needle) ||
        b.tags.some((t) => t.includes(needle)) ||
        (b.options ?? []).some((o) => o.text.toLowerCase().includes(needle))
      )
    })
  }, [q, subject, grade, tag])

  const handleUse = (entryId: string) => {
    const entry = BANK.find((b) => b.id === entryId)
    if (!entry) return

    if (!draft) {
      createDraft({
        title: `Bài tập về ${entry.tags[0] ?? entry.subject}`,
        school: 'Trường THCS Nguyễn Du',
        year: '2025 – 2026',
        term: 'Học kỳ II',
        subject: entry.subject,
        grade: entry.grades[0] === 'all' ? 'Lớp 9' : entry.grades[0],
        durationMinutes: 45,
      })
    }

    const current = useApp.getState().draft
    if (!current) return

    const id = `lib-${entry.id}-${Date.now().toString(36)}`
    addQuestion(
      {
        id,
        number: current.sections[0]?.questions.length + 1,
        type: entry.type,
        prompt: entry.prompt,
        options: entry.options,
        answer: entry.answer,
        explanation: entry.explanation,
        points: entry.points,
        solution: entry.solution,
        sourceId: entry.id,
      },
      current.sections[0]?.id,
    )
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="eyebrow mb-3.5">Kho</p>
        <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          Kho tài liệu
        </h1>
        <p className="mt-4 max-w-[54ch] text-[15px] leading-[1.75] text-ink-2">
          <span className="tnum font-bold text-ink">{BANK.length}</span> câu hỏi mẫu theo môn, khối
          lớp và chủ đề. Kéo bất kỳ câu nào vào đề bạn đang soạn.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm trong nội dung câu hỏi…"
            className={inputClass + ' pl-11'}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={selectAutoClass}
          >
            <option value="">Mọi môn</option>
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className={selectAutoClass}
          >
            <option value="">Mọi lớp</option>
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className={selectAutoClass}
          >
            <option value="">Mọi chủ đề</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2.5 text-[13px] text-ink-3">
        <span className="tnum font-bold text-ink">{results.length}</span> câu hỏi
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="size-6" strokeWidth={1.6} />}
          title="Không có câu hỏi phù hợp"
          description="Thử bỏ bớt bộ lọc hoặc tìm bằng từ khoá khác."
        />
      ) : (
        <div className="space-y-3">
          {results.slice(0, 120).map((entry) => (
            <article
              key={entry.id}
              className="flex flex-wrap items-start gap-4 rounded-[6px] bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-300 hover:shadow-lift"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] leading-relaxed text-ink">
                  <MathText as="span" className="inline">
                    {entry.prompt}
                  </MathText>
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="neutral">{entry.subject}</Badge>
                  <Badge tone="outline">
                    {entry.grades.includes('all') ? 'Mọi lớp' : entry.grades.join(', ')}
                  </Badge>
                  <Badge tone="honey">{TYPE_LABEL[entry.type]}</Badge>
                  <span className="ml-1 text-[12px] font-semibold text-ink-3 tnum">
                    {formatPoints(entry.points)}đ
                  </span>
                  {entry.variable ? (
                    <span className="text-[12px] font-semibold text-clay">· đổi số được</span>
                  ) : null}
                </div>
                {entry.tags.length ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Tag className="size-3 text-ink-4" />
                    {entry.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[11.5px] text-ink-4">
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button variant="soft" size="sm" onClick={() => handleUse(entry.id)}>
                  <FolderPlus className="size-3.5" />
                  Dùng trong đề
                </Button>
              </div>
            </article>
          ))}

          {results.length > 120 ? (
            <p className="pt-4 text-center text-[13px] text-ink-4">
              Hiển thị 120 / {results.length} câu — thu hẹp bộ lọc để xem thêm.
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Link to="/soan-de">
          <Button variant="primary" size="lg">
            Mở trình soạn đề
          </Button>
        </Link>
      </div>
    </div>
  )
}
