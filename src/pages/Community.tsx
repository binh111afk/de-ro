import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Grid2x2, List, MonitorPlay, Search, Sparkles, Users, X } from 'lucide-react'
import { Badge, Button, EmptyState, inputClass, selectAutoClass } from '@/components/ui'
import { MathText } from '@/components/MathText'
import { useApp } from '@/store/app'
import { GRADES, SUBJECTS, totalPoints, type Exam } from '@/data/types'
import { formatPoints } from '@/lib/math'
import { COMMUNITY_EXAMS } from '@/data/community'

export default function Community() {
  const navigate = useNavigate()
  const importExam = useApp((s) => s.importExam)

  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState<'new' | 'popular'>('new')

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = COMMUNITY_EXAMS.filter((e) => {
      if (subject && e.subject !== subject) return false
      if (grade && e.grade !== grade) return false
      if (!needle) return true
      return (
        e.title.toLowerCase().includes(needle) ||
        e.subject.toLowerCase().includes(needle) ||
        e.school.toLowerCase().includes(needle) ||
        e.sections.some((s) =>
          s.questions.some((qq) => strip(qq.prompt).toLowerCase().includes(needle)),
        )
      )
    })
    list = sort === 'popular' ? [...list].sort((a, b) => b.likes - a.likes) : list
    return list
  }, [q, subject, grade, sort])

  /** Convert a static exam into an interactive quiz and jump straight into it. */
  const handleInteractive = (exam: Exam) => {
    const id = importExam(exam)
    useApp.getState().startQuiz(id)
    navigate(`/lam-de/${id}`)
  }

  const hasFilter = Boolean(q || subject || grade)
  const clearFilters = () => {
    setQ('')
    setSubject('')
    setGrade('')
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="eyebrow mb-3.5">Thư viện</p>
        <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          Đề thi cộng đồng
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.75] text-ink-2">
          {COMMUNITY_EXAMS.length} đề mẫu theo môn và khối lớp. Mở để xem, hoặc chuyển thẳng
          sang làm đề tương tác có đếm ngược.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên đề, trường hoặc nội dung câu hỏi…"
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
            value={sort}
            onChange={(e) => setSort(e.target.value as 'new' | 'popular')}
            className={selectAutoClass}
          >
            <option value="new">Mới nhất</option>
            <option value="popular">Phổ biến</option>
          </select>

          <div className="flex overflow-hidden rounded-[6px] bg-sunken p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={
                view === 'grid'
                  ? 'flex size-9 items-center justify-center rounded-[10px] bg-surface text-ink shadow-soft'
                  : 'flex size-9 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:text-ink'
              }
              title="Dạng lưới"
            >
              <Grid2x2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={
                view === 'list'
                  ? 'flex size-9 items-center justify-center rounded-[10px] bg-surface text-ink shadow-soft'
                  : 'flex size-9 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:text-ink'
              }
              title="Dạng danh sách"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2.5 text-[13px] text-ink-3">
        <span className="tnum font-semibold text-ink">{results.length}</span> đề
        {hasFilter ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full bg-clay-soft px-2.5 py-1 text-[12px] font-semibold text-clay transition-colors hover:bg-clay/15"
          >
            <X className="size-3" />
            xoá lọc
          </button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" strokeWidth={1.6} />}
          title="Không tìm thấy đề nào"
          description="Thử bỏ bớt điều kiện lọc, hoặc tìm theo từ khoá khác."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Xoá tất cả bộ lọc
            </Button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} index={i} onInteractive={handleInteractive} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[6px] bg-surface shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
          {results.map((exam) => (
            <ExamRow key={exam.id} exam={exam} onInteractive={handleInteractive} />
          ))}
        </div>
      )}
    </div>
  )
}

function strip(s: string) {
  return s.replace(/\$[^$]*\$/g, '')
}

function ExamCard({
  exam,
  index,
  onInteractive,
}: {
  exam: Exam
  index: number
  onInteractive: (e: Exam) => void
}) {
  const nq = exam.sections.reduce((n, s) => n + s.questions.length, 0)
  return (
    <article
      className="anim-delay group flex flex-col overflow-hidden rounded-[8px] bg-surface shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
      style={{ '--delay': `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}
    >
      <Link
        to={`/de/${exam.id}`}
        className="relative flex h-[140px] flex-col justify-between overflow-hidden bg-sunken/70 p-5"
      >
        {/* soft corner shape instead of a hard cover */}
        <div
          className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full opacity-70 blur-2xl transition-transform duration-700 group-hover:scale-125"
          style={{ background: 'radial-gradient(circle, rgba(192,90,60,0.2), transparent 70%)' }}
        />
        <div className="relative flex items-start justify-between gap-2">
          <Badge tone="clay">{exam.subject}</Badge>
          <span className="text-[12px] font-semibold text-ink-3">{exam.grade}</span>
        </div>
        <div className="relative">
          <p className="line-clamp-2 font-display text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            {exam.title}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink-3">{exam.school}</p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3.5 text-[12px] font-medium text-ink-3">
          <span className="tnum flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            {nq} câu
          </span>
          <span className="tnum flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {exam.durationMinutes}′
          </span>
          <span className="tnum">{formatPoints(totalPoints(exam))}đ</span>
        </div>

        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-3">
          <MathText as="span" className="inline">
            {exam.sections[0]?.questions[0]?.prompt ?? ''}
          </MathText>
        </p>

        <div className="mt-auto flex items-center gap-2 pt-5">
          <Link to={`/de/${exam.id}`} className="flex-1">
            <Button variant="soft" size="sm" className="w-full">
              Xem đề
            </Button>
          </Link>
          <Button variant="clay" size="sm" onClick={() => onInteractive(exam)} title="Làm đề tương tác">
            <MonitorPlay className="size-3.5" />
            Làm đề
          </Button>
        </div>
      </div>
    </article>
  )
}

function ExamRow({
  exam,
  onInteractive,
}: {
  exam: Exam
  onInteractive: (e: Exam) => void
}) {
  const nq = exam.sections.reduce((n, s) => n + s.questions.length, 0)
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-line-2 px-5 py-4 last:border-0 hover:bg-canvas/60">
      <div className="min-w-0 flex-1">
        <Link to={`/de/${exam.id}`} className="block">
          <p className="truncate font-display text-[16px] font-semibold text-ink transition-colors hover:text-clay">
            {exam.title}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink-3">
            {exam.school} · {exam.subject} · {exam.grade}
          </p>
        </Link>
      </div>
      <div className="flex items-center gap-4 text-[12.5px] font-medium text-ink-3">
        <span className="tnum">{nq} câu</span>
        <span className="tnum">{exam.durationMinutes}′</span>
        <span className="tnum flex items-center gap-1.5">
          <Users className="size-3.5" />
          {exam.views}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link to={`/de/${exam.id}`}>
          <Button variant="ghost" size="sm">
            Xem
          </Button>
        </Link>
        <Button variant="clay" size="sm" onClick={() => onInteractive(exam)}>
          <MonitorPlay className="size-3.5" />
          Làm đề
        </Button>
      </div>
    </div>
  )
}
