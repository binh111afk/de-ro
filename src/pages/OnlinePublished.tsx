import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Check, Clock, Globe2, Link2, Lock, Sparkles, Trash2, X } from 'lucide-react'
import { dialog } from '@/components/Dialog'
import { Badge, Button, EmptyState, SkeletonCard } from '@/components/ui'
import { listAttempts, summarize, type Attempt, type ExamStats, type Student } from '@/lib/attempts'
import { listMyPublished, setListed, unpublish, type CommunityRow } from '@/lib/community'
import { cn } from '@/lib/cn'
import { formatPoints } from '@/lib/math'
import { shareUrl } from '@/lib/onlinePublish'
import { useSession } from '@/lib/useSession'
import { useOnline } from '@/store/online'

const fmt = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',')
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
const BAND_LABEL = ['Dưới 5', '5 – dưới 6,5', '6,5 – dưới 8', 'Từ 8']
const BAND_COLOR = ['bg-clay', 'bg-honey', 'bg-sage/60', 'bg-sage']

/** Tab "Đề đã xuất bản": đề cho học sinh (chỉ link) và đề đăng cộng đồng, kèm kết quả học sinh đã làm. */
export function PublishedPanel() {
  const session = useSession()
  const navigate = useNavigate()
  const items = useOnline((s) => s.items)
  const updateItem = useOnline((s) => s.update)
  const [rows, setRows] = useState<CommunityRow[] | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<CommunityRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const userId = session?.user.id

  const load = useCallback(async () => {
    setError(null)
    try {
      const list = await listMyPublished()
      setAttempts(await listAttempts(list.map((r) => r.id)))
      setRows(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách, thử lại sau.')
      setRows((r) => r ?? [])
    }
  }, [])

  useEffect(() => {
    if (userId) void load()
  }, [userId, load])

  const stats = useMemo(() => {
    const by = new Map<string, Attempt[]>()
    for (const a of attempts) by.set(a.exam_id, [...(by.get(a.exam_id) ?? []), a])
    return new Map([...by].map(([id, list]) => [id, summarize(list)]))
  }, [attempts])

  const toggleListed = async (row: CommunityRow) => {
    setBusyId(row.id)
    try {
      await setListed(row.id, !row.listed)
      setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, listed: !row.listed } : r)) ?? null)
      for (const it of items) if (it.publishedId === row.id) updateItem(it.id, { publishedListed: !row.listed })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đổi được, thử lại sau.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (row: CommunityRow) => {
    const ok = await dialog.confirm('Học sinh mở link sẽ không vào được nữa, và kết quả học sinh đã nộp cho đề này cũng bị xoá. Đề trong lịch sử tạo đề của bạn vẫn còn.', {
      title: `Gỡ "${row.title.trim() || 'Đề chưa đặt tên'}"?`,
      confirmLabel: 'Gỡ xuất bản',
      danger: true,
    })
    if (!ok) return
    setBusyId(row.id)
    try {
      await unpublish(row.id)
      setRows((rs) => rs?.filter((r) => r.id !== row.id) ?? null)
      for (const it of items) if (it.publishedId === row.id) updateItem(it.id, { publishedId: undefined, publishedListed: undefined })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gỡ được, thử lại sau.')
    } finally {
      setBusyId(null)
    }
  }

  if (!session)
    return (
      <EmptyState
        icon={<Lock className="size-6" strokeWidth={1.6} />}
        title="Đăng nhập để xem đề đã xuất bản"
        description="Đề xuất bản và kết quả của học sinh gắn với tài khoản của bạn, nên cần đăng nhập mới xem được."
        action={
          <Link to="/dang-nhap">
            <Button variant="primary">Đăng nhập</Button>
          </Link>
        }
      />
    )

  if (rows === null)
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} variant="exam" />
        ))}
      </div>
    )

  return (
    <>
      {error ? <p role="alert" className="mb-6 text-[13.5px] font-medium text-clay-deep">{error}</p> : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" strokeWidth={1.6} />}
          title="Chưa xuất bản đề nào"
          description="Ở tab Lịch sử tạo đề, bấm Cho học sinh để gửi link riêng, hoặc Lên cộng đồng để mọi người cùng làm. Kết quả sẽ hiện ở đây."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, i) => (
            <PublishedCard
              key={row.id}
              row={row}
              index={i}
              stats={stats.get(row.id)}
              busy={busyId === row.id}
              localId={items.find((it) => it.publishedId === row.id)?.id}
              onResults={() => setDetail(row)}
              onToggleListed={() => void toggleListed(row)}
              onRemove={() => void remove(row)}
              onEdit={(id) => navigate(`/tao-de-online/${id}`)}
            />
          ))}
        </div>
      )}

      {detail ? <ResultsModal row={detail} stats={stats.get(detail.id)} onClose={() => setDetail(null)} /> : null}
    </>
  )
}

function PublishedCard({
  row,
  index,
  stats,
  busy,
  localId,
  onResults,
  onToggleListed,
  onRemove,
  onEdit,
}: {
  row: CommunityRow
  index: number
  stats: ExamStats | undefined
  busy: boolean
  localId: string | undefined
  onResults: () => void
  onToggleListed: () => void
  onRemove: () => void
  onEdit: (localId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const url = shareUrl(row.id)
  const copy = () =>
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  const total = stats?.students.length ?? 0

  return (
    <article
      className="anim-delay group flex flex-col overflow-hidden rounded-[8px] bg-surface shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
      style={{ '--delay': `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}
    >
      <button type="button" onClick={onResults} className="relative flex h-[140px] w-full flex-col justify-between overflow-hidden bg-sunken/70 p-5 text-left">
        <div
          className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full opacity-70 blur-2xl transition-transform duration-700 group-hover:scale-125"
          style={{ background: 'radial-gradient(circle, rgba(192,90,60,0.2), transparent 70%)' }}
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="clay">{row.subject}</Badge>
            {row.listed ? <Badge tone="sage">Cộng đồng</Badge> : <Badge tone="honey">Chỉ link</Badge>}
          </div>
          <span className="text-[12px] font-semibold text-ink-3">{row.grade}</span>
        </div>
        <div className="relative">
          <p title={row.title} className="line-clamp-2 font-display text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            {row.title.trim() || 'Đề chưa đặt tên'}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink-3">{row.school || 'Chưa ghi tên trường'}</p>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3.5 text-[12px] font-medium text-ink-3">
          <span className="tnum flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            {row.question_count} câu
          </span>
          <span className="tnum flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {row.duration_minutes}′
          </span>
          <span className="tnum">{formatPoints(row.total_points)}đ</span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Lượt làm" value={String(stats?.attempts ?? 0)} />
          <Stat label="Người làm" value={String(total)} />
          <Stat label="Điểm TB" value={total ? fmt(stats!.avg) : '–'} />
        </dl>

        {total ? <Bands bands={stats!.bands} /> : null}

        <div className="mt-4 min-h-[84px]">
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-ink-4">Top 3 điểm cao</p>
          {stats?.top.length ? (
            <ol className="space-y-1.5">
              {stats.top.map((s, i) => (
                <TopRow key={s.name + i} rank={i + 1} s={s} />
              ))}
            </ol>
          ) : (
            <p className="text-[13px] leading-relaxed text-ink-3">Chưa có ai làm. Gửi link cho học sinh, kết quả sẽ hiện ở đây.</p>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button variant="soft" size="sm" onClick={onResults}>
            <BarChart3 className="size-3.5" />
            Kết quả
          </Button>
          {localId ? (
            <Button variant="soft" size="sm" onClick={() => onEdit(localId)}>
              Sửa đề
            </Button>
          ) : (
            <Link to={`/de-online/${row.id}`} className="contents">
              <Button variant="soft" size="sm">Mở đề</Button>
            </Link>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Button variant="clay" size="sm" className="min-w-0 flex-1" onClick={copy} title={url}>
            {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
            {copied ? 'Đã chép link' : 'Chép link cho học sinh'}
          </Button>
          <IconBtn
            label={row.listed ? 'Rút khỏi danh sách cộng đồng (link vẫn dùng được)' : 'Đưa lên danh sách cộng đồng'}
            onClick={onToggleListed}
            disabled={busy}
          >
            <Globe2 className={cn('size-4', row.listed && 'text-sage')} />
          </IconBtn>
          <IconBtn label="Gỡ xuất bản" onClick={onRemove} disabled={busy} danger>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>
    </article>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-[6px] text-ink-3 transition-colors disabled:pointer-events-none disabled:opacity-40',
        danger ? 'hover:bg-clay-soft hover:text-clay' : 'hover:bg-sunken hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] bg-sunken/70 px-3 py-2.5">
      <dd className="tnum font-display text-[20px] font-semibold leading-none text-ink">{value}</dd>
      <dt className="mt-1.5 text-[11.5px] text-ink-3">{label}</dt>
    </div>
  )
}

/** Phổ điểm: một thanh chia theo số người ở bốn mức; số cụ thể xem trong cửa sổ kết quả. */
function Bands({ bands }: { bands: ExamStats['bands'] }) {
  const sum = bands.reduce((a, b) => a + b, 0)
  return (
    <div
      className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-sunken"
      role="img"
      aria-label={`Phổ điểm: ${bands.map((n, i) => `${BAND_LABEL[i]} ${n} người`).join(', ')}`}
    >
      {bands.map((n, i) => (n ? <span key={i} className={BAND_COLOR[i]} style={{ width: `${(n / sum) * 100}%` }} title={`${BAND_LABEL[i]}: ${n} người`} /> : null))}
    </div>
  )
}

function TopRow({ rank, s }: { rank: number; s: Student }) {
  return (
    <li className="flex items-center gap-2.5 text-[13px]">
      <span className={cn('tnum flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', rank === 1 ? 'bg-honey-soft text-honey' : 'bg-sunken text-ink-3')}>{rank}</span>
      <span className="min-w-0 flex-1 truncate font-medium text-ink">{s.name}</span>
      <span className="tnum font-semibold text-ink">{formatPoints(s.best)}</span>
      <span className="tnum w-12 shrink-0 text-right text-[11.5px] text-ink-4">{s.attempts} lần</span>
    </li>
  )
}

/** Cửa sổ kết quả của một đề: tóm tắt, phổ điểm và bảng từng học sinh (điểm cao nhất, số lần làm, thời gian). */
function ResultsModal({ row, stats, onClose }: { row: CommunityRow; stats: ExamStats | undefined; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const students = stats?.students ?? []
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 px-5 py-8 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Kết quả học sinh" className="anim-sheet my-auto flex max-h-[min(720px,calc(100dvh-4rem))] w-full max-w-[640px] flex-col rounded-[8px] bg-surface p-6 shadow-float sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="line-clamp-2 font-display text-[21px] font-semibold leading-snug text-ink">{row.title.trim() || 'Đề chưa đặt tên'}</h2>
            <p className="mt-1 text-[13px] text-ink-3">Kết quả học sinh · mỗi người tính điểm cao nhất</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-3 transition-colors hover:text-ink">
            <X className="size-4" />
          </button>
        </div>

        {students.length === 0 ? (
          <p className="mt-6 text-[14px] leading-relaxed text-ink-2">Chưa có ai làm đề này. Gửi link cho học sinh, bài làm sẽ hiện ở đây.</p>
        ) : (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Lượt làm" value={String(stats!.attempts)} />
              <Stat label="Người làm" value={String(students.length)} />
              <Stat label="Điểm TB (thang 10)" value={fmt(stats!.avg)} />
              <Stat label="Cao nhất" value={formatPoints(students[0].best)} />
            </dl>

            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2 sm:grid-cols-4">
              {stats!.bands.map((n, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={cn('size-2 shrink-0 rounded-full', BAND_COLOR[i])} />
                  <span className="truncate">{BAND_LABEL[i]}</span>
                  <span className="tnum ml-auto font-semibold text-ink">{n}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-[6px] border border-line">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="sticky top-0 whitespace-nowrap bg-sunken text-[11.5px] font-bold uppercase tracking-wide text-ink-4">
                  <tr>
                    <th className="w-10 px-3 py-2">#</th>
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2 text-right">Điểm</th>
                    <th className="px-3 py-2 text-right">Số lần</th>
                    <th className="hidden px-3 py-2 text-right sm:table-cell">Thời gian</th>
                    <th className="hidden px-3 py-2 text-right sm:table-cell">Lần cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.name + i} className="border-t border-line">
                      <td className="tnum px-3 py-2 text-ink-3">{i + 1}</td>
                      <td className="max-w-[160px] truncate px-3 py-2 font-medium text-ink">{s.name}</td>
                      <td className="tnum px-3 py-2 text-right font-semibold text-ink">
                        {formatPoints(s.best)}
                        <span className="font-normal text-ink-4">/{formatPoints(s.max)}</span>
                      </td>
                      <td className="tnum px-3 py-2 text-right text-ink-2">{s.attempts}</td>
                      <td className="tnum hidden px-3 py-2 text-right text-ink-2 sm:table-cell">{mmss(s.seconds)}</td>
                      <td className="tnum hidden px-3 py-2 text-right text-ink-3 sm:table-cell">{new Date(s.lastAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
