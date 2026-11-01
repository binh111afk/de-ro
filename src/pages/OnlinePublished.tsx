import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Check, Clock, Crown, Globe2, Link2, Lock, Sparkles, Trash2 } from 'lucide-react'
import { CopyLink } from '@/components/CopyLink'
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
              onResults={() => navigate(`/tao-de-online/ket-qua/${row.id}`)}
              onToggleListed={() => void toggleListed(row)}
              onRemove={() => void remove(row)}
              onEdit={(id) => navigate(`/tao-de-online/${id}`)}
            />
          ))}
        </div>
      )}
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

        {total ? null : <p className="mt-4 text-[13px] leading-relaxed text-ink-3">Chưa có ai làm. Gửi link cho học sinh, kết quả sẽ hiện ở đây.</p>}

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

/** Huy chương vàng/bạc/đồng theo hạng. */
const MEDAL = [
  { ring: '#d4a017', fill: 'linear-gradient(145deg,#fde68a,#e0a82e 55%,#b7791f)', text: '#7a4d00' },
  { ring: '#9ca3af', fill: 'linear-gradient(145deg,#f3f4f6,#c0c4cb 55%,#8b9099)', text: '#3f4652' },
  { ring: '#b4693a', fill: 'linear-gradient(145deg,#f6c9a4,#c9814f 55%,#94522a)', text: '#5a2c10' },
]
/** Chiều cao bục theo hạng 1, 2, 3. */
const PODIUM_H = ['h-[132px]', 'h-[96px]', 'h-[72px]']

/** Bục top 3: hạng 2 bên trái, hạng 1 ở giữa (to và nổi nhất), hạng 3 bên phải. */
function Podium({ top }: { top: Student[] }) {
  const order = [1, 0, 2].filter((i) => top[i])
  return (
    <section aria-label="Top 3 điểm cao" className="mt-8 rounded-[8px] bg-sunken/50 px-3 pt-6 sm:px-8">
      <ol className="mx-auto flex max-w-[560px] items-end justify-center gap-2 sm:gap-4">
        {order.map((i) => {
          const s = top[i]
          const m = MEDAL[i]
          const first = i === 0
          return (
            <li key={s.name + i} className={cn('flex min-w-0 flex-1 flex-col items-center', first && 'z-10')}>
              {first ? <Crown className="mb-1 size-7 text-honey drop-shadow-[0_2px_6px_rgba(184,134,47,0.45)]" fill="currentColor" /> : null}
              <span
                className={cn('tnum flex shrink-0 items-center justify-center rounded-full font-display font-bold', first ? 'size-16 text-[26px]' : 'size-12 text-[19px]')}
                style={{ background: m.fill, color: m.text, boxShadow: `0 0 0 3px ${m.ring}33, 0 6px 14px ${m.ring}55` }}
              >
                {i + 1}
              </span>
              <p className={cn('mt-2 w-full truncate text-center font-semibold text-ink', first ? 'text-[16px]' : 'text-[13.5px]')} title={s.name}>
                {s.name}
              </p>
              <p className={cn('tnum font-display font-semibold', first ? 'text-[22px] text-honey' : 'text-[16px] text-ink-2')}>
                {formatPoints(s.best)}
                <span className="text-[12px] font-normal text-ink-4">/{formatPoints(s.max)}</span>
              </p>
              <div
                className={cn('mt-2 flex w-full items-start justify-center rounded-t-[6px] pt-2 text-[12px] font-semibold', PODIUM_H[i], first ? 'bg-honey-soft text-honey shadow-[0_-8px_24px_rgba(184,134,47,0.25)]' : 'bg-surface text-ink-3')}
              >
                {mmss(s.seconds)} · {s.attempts} lần
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Trang kết quả một đề (`/tao-de-online/ket-qua/:id`): tóm tắt, phổ điểm và bảng từng học sinh (điểm cao nhất, số lần làm, thời gian). */
export default function OnlineResults() {
  const { id = '' } = useParams()
  const session = useSession()
  const [row, setRow] = useState<CommunityRow | null | undefined>(undefined)
  const [stats, setStats] = useState<ExamStats>()
  const [error, setError] = useState<string | null>(null)
  const userId = session?.user.id

  useEffect(() => {
    // ponytail: dữ liệu giả để xem giao diện, chỉ ở dev (`/tao-de-online/ket-qua/demo`)
    if (import.meta.env.DEV && id === 'demo') {
      setRow(DEMO_ROW)
      setStats(summarize(demoAttempts()))
      return
    }
    if (!userId) return
    Promise.all([listMyPublished(), listAttempts([id])])
      .then(([list, att]) => {
        setRow(list.find((r) => r.id === id) ?? null)
        setStats(summarize(att))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được kết quả, thử lại sau.'))
  }, [userId, id])

  const students = stats?.students ?? []
  return (
    <div className="mx-auto max-w-[960px] px-5 py-10 sm:px-6 lg:py-12">
      <Link to="/tao-de-online?tab=published" className="mb-8 inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-3 transition-colors hover:text-ink">
        <ArrowLeft className="size-4" />
        Đề đã xuất bản
      </Link>

      {!session && id !== 'demo' ? (
        <EmptyState
          icon={<Lock className="size-6" strokeWidth={1.6} />}
          title="Đăng nhập để xem kết quả"
          description="Kết quả của học sinh gắn với tài khoản của bạn."
          action={
            <Link to="/dang-nhap">
              <Button variant="primary">Đăng nhập</Button>
            </Link>
          }
        />
      ) : error ? (
        <p role="alert" className="text-[13.5px] font-medium text-clay-deep">{error}</p>
      ) : row === undefined ? (
        <SkeletonCard variant="exam" />
      ) : row === null ? (
        <EmptyState icon={<Sparkles className="size-6" strokeWidth={1.6} />} title="Không tìm thấy đề" description="Đề này đã bị gỡ hoặc không thuộc tài khoản của bạn." />
      ) : (
      <div className="rounded-[8px] bg-surface p-6 shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] font-semibold leading-snug tracking-[-0.02em] text-ink">{row.title.trim() || 'Đề chưa đặt tên'}</h1>
            <p className="mt-1 text-[13px] text-ink-3">
              {row.subject} · {row.grade} · {row.question_count} câu · Kết quả học sinh, mỗi người tính điểm cao nhất
            </p>
          </div>
          <CopyLink url={shareUrl(row.id)} className="w-full sm:w-[320px]" />
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

            <Podium top={stats!.top} />

            <div className="mt-5 overflow-x-auto rounded-[6px] border border-line">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="sticky top-0 whitespace-nowrap bg-sunken text-[11.5px] font-bold uppercase tracking-wide text-ink-4">
                  <tr>
                    <th className="w-10 px-3 py-2">#</th>
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2">Lớp</th>
                    <th className="px-3 py-2 text-right">STT</th>
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
                      <td className="whitespace-nowrap px-3 py-2 text-ink-2">{s.className || '–'}</td>
                      <td className="tnum px-3 py-2 text-right text-ink-2">{s.seat ?? '–'}</td>
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
      )}
    </div>
  )
}

const DEMO_ROW: CommunityRow = {
  id: 'demo',
  title: 'Kiểm tra 15 phút — Hàm số bậc hai',
  subject: 'Toán',
  grade: 'Lớp 10',
  school: 'THPT Nguyễn Du',
  created_at: '2026-10-20T08:00:00Z',
  question_count: 20,
  duration_minutes: 15,
  total_points: 10,
  preview: '',
  listed: true,
}

function demoAttempts(): Attempt[] {
  const names = ['Nguyễn An', 'Trần Bảo', 'Lê Chi', 'Phạm Dũng', 'Hoàng Giang', 'Vũ Hà', 'Đặng Khoa', 'Bùi Lan', 'Đỗ Minh', 'Ngô Nam', 'Dương Oanh', 'Lý Phúc', 'Mai Quỳnh', 'Tạ Sơn', 'Hồ Trang']
  const scores = [9.5, 8.75, 8, 7.5, 7.25, 6.5, 6, 5.75, 5, 4.5, 9, 3.75, 8.5, 6.75, 4]
  return names.flatMap((name, i) =>
    Array.from({ length: (i % 3) + 1 }, (_, k) => ({
      id: `${i}-${k}`,
      exam_id: 'demo',
      user_id: null,
      device_id: `demo-device-${i}`,
      class_name: i < 8 ? '10A1' : '10A2',
      seat_no: i + 1,
      student_name: name,
      score: Math.max(0, scores[i] - k * 0.75),
      max_score: 10,
      duration_seconds: 420 + ((i * 53 + k * 31) % 480),
      created_at: new Date(Date.UTC(2026, 9, 21 + (i % 9), 8 + k)).toISOString(),
    })),
  )
}
