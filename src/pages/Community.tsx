import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Grid2x2, List, MonitorPlay, Search, Sparkles, Upload, Users, X } from 'lucide-react'
import { Badge, Button, EmptyState, inputClass, SkeletonCard } from '@/components/ui'
import { SiteSelect } from '@/components/SiteSelect'
import { useSlidingThumb } from '@/examEditor/useSlidingThumb'
import { cn } from '@/lib/cn'
import { MathText } from '@/components/MathText'
import { useApp } from '@/store/app'
import { useDocStore } from '@/store/docs'
import { GRADES, SUBJECTS, questionCount, totalPoints, type Exam } from '@/data/types'
import type { ExamDoc } from '@/data/docTypes'
import { formatPoints } from '@/lib/math'
import { COMMUNITY_EXAMS } from '@/data/community'
import { getCommunityDoc, listCommunityDocs, publishDoc, type CommunityRow } from '@/lib/community'
import { docToExam } from '@/lib/docToExam'
import { useSession } from '@/lib/useSession'

/** Một thẻ đề: đề mẫu cố định hoặc đề giáo viên đăng. Cùng một kiểu thẻ cho cả hai. */
interface CardItem {
  id: string
  title: string
  subject: string
  grade: string
  school: string
  questions: number
  minutes: number
  points: number
  preview: string
  /** chữ viết thường dùng để tìm kiếm */
  text: string
  /** true = đề giáo viên đăng lên */
  mine: boolean
  date?: string
  views?: number
  likes: number
  onView: () => void
  onQuiz: () => void
}

const SUBJECT_OPTIONS = [
  { value: '', label: 'Mọi môn' },
  ...SUBJECTS.map((s) => ({ value: s, label: s })),
]
const GRADE_OPTIONS = [{ value: '', label: 'Mọi lớp' }, ...GRADES.map((g) => ({ value: g, label: g }))]
const SORT_OPTIONS: { value: 'new' | 'popular'; label: string }[] = [
  { value: 'new', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến' },
]

export default function Community() {
  const navigate = useNavigate()
  const importExam = useApp((s) => s.importExam)
  const session = useSession()

  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState<'new' | 'popular'>('new')
  const [userDocs, setUserDocs] = useState<CommunityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [publishOpen, setPublishOpen] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  useEffect(() => {
    listCommunityDocs()
      .then(setUserDocs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /** Chuyển đề mẫu sang đề tương tác rồi làm ngay. */
  const handleInteractive = (exam: Exam) => {
    const id = importExam(exam)
    useApp.getState().startQuiz(id)
    navigate(`/lam-de/${id}`)
  }

  /** Mở đề giáo viên đăng: chuyển sang đề tương tác rồi xem hoặc làm ngay. */
  const openUserDoc = async (row: CommunityRow, mode: 'view' | 'quiz') => {
    setOpeningId(row.id)
    setOpenError(null)
    try {
      const doc = await getCommunityDoc(row.id)
      const { importExam: doImport, startQuiz } = useApp.getState()
      const id = doImport(docToExam(doc, row.id))
      if (mode === 'quiz') startQuiz(id)
      navigate(mode === 'quiz' ? `/lam-de/${id}` : `/de/${id}`)
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : 'Không mở được đề, thử lại sau.')
    } finally {
      setOpeningId(null)
    }
  }

  const items = useMemo<CardItem[]>(() => {
    const mine: CardItem[] = userDocs.map((d) => ({
      id: d.id,
      title: d.title,
      subject: d.subject,
      grade: d.grade,
      school: d.school,
      questions: d.question_count,
      minutes: d.duration_minutes,
      points: d.total_points,
      preview: d.preview,
      text: `${d.title} ${d.school} ${d.subject} ${d.preview}`.toLowerCase(),
      mine: true,
      date: d.created_at,
      likes: 0,
      onView: () => void openUserDoc(d, 'view'),
      onQuiz: () => void openUserDoc(d, 'quiz'),
    }))
    const samples: CardItem[] = COMMUNITY_EXAMS.map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject,
      grade: e.grade,
      school: e.school,
      questions: questionCount(e),
      minutes: e.durationMinutes,
      points: totalPoints(e),
      preview: e.sections[0]?.questions[0]?.prompt ?? '',
      text: [e.title, e.school, e.subject, ...e.sections.flatMap((s) => s.questions.map((qq) => strip(qq.prompt)))]
        .join(' ')
        .toLowerCase(),
      mine: false,
      views: e.views,
      likes: e.likes,
      onView: () => navigate(`/de/${e.id}`),
      onQuiz: () => handleInteractive(e),
    }))
    return [...mine, ...samples]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDocs, navigate])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = items.filter(
      (it) =>
        (!subject || it.subject === subject) &&
        (!grade || it.grade === grade) &&
        (!needle || it.text.includes(needle)),
    )
    return sort === 'popular' ? [...list].sort((a, b) => b.likes - a.likes) : list
  }, [items, q, subject, grade, sort])

  const hasFilter = Boolean(q || subject || grade)
  const clearFilters = () => {
    setQ('')
    setSubject('')
    setGrade('')
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3.5">Thư viện</p>
          <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
            Đề thi cộng đồng
          </h1>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.75] text-ink-2">
            Đề mẫu và đề giáo viên đăng. Mở để xem, hoặc chuyển thẳng sang làm đề tương tác có đếm ngược.
          </p>
        </div>
        <Button variant="primary" onClick={() => setPublishOpen(true)}>
          <Upload className="size-4" />
          Đăng đề
        </Button>
      </header>

      {publishOpen ? (
        <PublishModal
          loggedIn={Boolean(session)}
          onClose={() => setPublishOpen(false)}
          onPublished={(row) => {
            setUserDocs((rows) => [row, ...rows])
            setPublishOpen(false)
          }}
        />
      ) : null}

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
          <SiteSelect value={subject} options={SUBJECT_OPTIONS} onChange={setSubject} label="Lọc theo môn" className="w-[170px]" />
          <SiteSelect value={grade} options={GRADE_OPTIONS} onChange={setGrade} label="Lọc theo lớp" className="w-[150px]" />
          <SiteSelect value={sort} options={SORT_OPTIONS} onChange={setSort} label="Sắp xếp" className="w-[150px]" />

          <ViewToggle value={view} onChange={setView} />
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

      {openError ? <p role="alert" className="mb-6 text-[13.5px] font-medium text-clay-deep">{openError}</p> : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} variant="exam" />
          ))}
        </div>
      ) : results.length === 0 ? (
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
          {results.map((it, i) => (
            <ExamCard key={`${it.mine ? 'u' : 's'}-${it.id}`} item={it} index={i} busy={openingId === it.id} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[6px] bg-surface shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
          {results.map((it) => (
            <ExamRow key={`${it.mine ? 'u' : 's'}-${it.id}`} item={it} busy={openingId === it.id} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Chọn một đề trong mục Gần đây (tab Bắt đầu) rồi đăng lên cộng đồng. */
function PublishModal({
  loggedIn,
  onClose,
  onPublished,
}: {
  loggedIn: boolean
  onClose: () => void
  onPublished: (row: CommunityRow) => void
}) {
  const myDocs = useDocStore((s) => s.myDocs)
  const docs = myDocs.filter((d) => (d.kind ?? 'exam') === 'exam')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const publish = async (doc: ExamDoc) => {
    setBusyId(doc.id)
    setError(null)
    try {
      onPublished(await publishDoc(doc, true))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, thử lại sau.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Đăng đề"
        className="anim-sheet w-full max-w-[520px] rounded-[8px] bg-surface p-7 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-semibold text-ink">Chọn đề để đăng</h2>
            <p className="mt-1.5 text-[14px] text-ink-3">Đề lấy từ mục Gần đây ở tab Bắt đầu.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-3 transition-colors hover:text-ink"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        {!loggedIn ? (
          <div className="mt-7 space-y-5">
            <p className="text-[14.5px] text-ink-2">Bạn cần đăng nhập để đăng đề lên cộng đồng.</p>
            <Link to="/dang-nhap">
              <Button variant="primary">Đăng nhập</Button>
            </Link>
          </div>
        ) : docs.length === 0 ? (
          <div className="mt-7 space-y-5">
            <p className="text-[14.5px] text-ink-2">Chưa có đề nào. Soạn đề xong rồi quay lại đây để đăng.</p>
            <Link to="/soan-de">
              <Button variant="outline">Soạn đề</Button>
            </Link>
          </div>
        ) : (
          <ul className="mt-6 max-h-[360px] divide-y divide-line overflow-y-auto">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{d.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">
                    {d.subject} · {d.grade} · {d.blocks.length} khối nội dung
                  </p>
                </div>
                <Button
                  variant="clay"
                  size="sm"
                  disabled={busyId !== null || d.blocks.length === 0}
                  title={d.blocks.length === 0 ? 'Đề chưa có nội dung' : undefined}
                  onClick={() => void publish(d)}
                >
                  {busyId === d.id ? 'Đang đăng…' : 'Đăng'}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {error ? <p role="alert" className="mt-4 text-[13.5px] font-medium text-clay-deep">{error}</p> : null}
      </div>
    </div>
  )
}

function ExamCard({ item, index, busy }: { item: CardItem; index: number; busy: boolean }) {
  return (
    <article
      className="anim-delay group flex flex-col overflow-hidden rounded-[8px] bg-surface shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
      style={{ '--delay': `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={item.onView}
        disabled={busy}
        className="relative flex h-[140px] w-full flex-col justify-between overflow-hidden bg-sunken/70 p-5 text-left"
      >
        {/* soft corner shape instead of a hard cover */}
        <div
          className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full opacity-70 blur-2xl transition-transform duration-700 group-hover:scale-125"
          style={{ background: 'radial-gradient(circle, rgba(192,90,60,0.2), transparent 70%)' }}
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="clay">{item.subject}</Badge>
            {item.mine ? <Badge tone="honey">Giáo viên</Badge> : null}
          </div>
          <span className="text-[12px] font-semibold text-ink-3">{item.grade}</span>
        </div>
        <div className="relative">
          <p
            title={item.title}
            className="line-clamp-2 font-display text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink"
          >
            {item.title}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink-3">{item.school || 'Chưa ghi tên trường'}</p>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3.5 text-[12px] font-medium text-ink-3">
          <span className="tnum flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            {item.questions} câu
          </span>
          <span className="tnum flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {item.minutes}′
          </span>
          <span className="tnum">{formatPoints(item.points)}đ</span>
        </div>

        {item.preview ? (
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-3">
            <MathText as="span" className="inline">
              {item.preview}
            </MathText>
          </p>
        ) : null}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button variant="soft" size="sm" className="w-full justify-center" onClick={item.onView} disabled={busy}>
            Xem đề
          </Button>
          <Button
            variant="clay"
            size="sm"
            className="w-full justify-center"
            onClick={item.onQuiz}
            disabled={busy}
            title="Làm đề tương tác"
          >
            <MonitorPlay className="size-3.5" />
            {busy ? 'Đang mở…' : 'Làm đề'}
          </Button>
        </div>
      </div>
    </article>
  )
}

function ExamRow({ item, busy }: { item: CardItem; busy: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-line-2 px-5 py-4 last:border-0 hover:bg-canvas/60">
      <button type="button" onClick={item.onView} disabled={busy} className="min-w-0 flex-1 text-left">
        <p
          title={item.title}
          className="line-clamp-2 font-display text-[16px] font-semibold text-ink transition-colors hover:text-clay"
        >
          {item.title}
          {item.mine ? <span className="ml-2 align-middle text-[11.5px] font-semibold text-honey">Giáo viên</span> : null}
        </p>
        <p className="mt-1 truncate text-[12px] text-ink-3">
          {item.school || 'Chưa ghi tên trường'} · {item.subject} · {item.grade}
        </p>
      </button>
      <div className="flex items-center gap-4 text-[12.5px] font-medium text-ink-3">
        <span className="tnum">{item.questions} câu</span>
        <span className="tnum">{item.minutes}′</span>
        {item.mine ? (
          <span className="tnum hidden sm:inline">{formatDate(item.date ?? '')}</span>
        ) : (
          <span className="tnum flex items-center gap-1.5">
            <Users className="size-3.5" />
            {item.views ?? 0}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={item.onView} disabled={busy}>
          Xem
        </Button>
        <Button variant="clay" size="sm" onClick={item.onQuiz} disabled={busy}>
          <MonitorPlay className="size-3.5" />
          {busy ? 'Đang mở…' : 'Làm đề'}
        </Button>
      </div>
    </div>
  )
}

/** Chuyển lưới / danh sách: thẻ trắng trượt tới nút đang chọn, cùng kiểu với thanh lọc ở trang Bắt đầu. */
function ViewToggle({ value, onChange }: { value: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const thumb = useSlidingThumb(ref, '[aria-checked="true"]', value)
  const options = [
    { key: 'grid' as const, label: 'Dạng lưới', Icon: Grid2x2 },
    { key: 'list' as const, label: 'Dạng danh sách', Icon: List },
  ]

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label="Kiểu hiển thị"
      className="relative flex h-11 shrink-0 items-center rounded-[8px] bg-sunken p-[3px]"
    >
      {thumb ? (
        <span
          aria-hidden
          className="absolute inset-y-[3px] left-0 rounded-[6px] bg-surface shadow-soft transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
        />
      ) : null}
      {options.map(({ key, label, Icon }) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(key)}
            className={cn(
              'relative z-10 flex h-full w-11 items-center justify-center rounded-[6px] transition-colors duration-200 active:scale-[0.96]',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink',
            )}
          >
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

function strip(s: string) {
  return s.replace(/\$[^$]*\$/g, '')
}
