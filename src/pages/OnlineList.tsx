import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, MonitorPlay, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui'
import { CopyLink } from '@/components/CopyLink'
import { MathText } from '@/components/MathText'
import { formatPoints } from '@/lib/math'
import { itemToExam, loadForQuiz, questionIssue, totalOf, type OnlineItem } from '@/lib/onlineExam'
import { publishItem, shareUrl } from '@/lib/onlinePublish'
import { useOnline } from '@/store/online'

export default function OnlineList() {
  const navigate = useNavigate()
  const items = useOnline((s) => s.items)
  const create = useOnline((s) => s.create)
  const remove = useOnline((s) => s.remove)

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3.5">Công cụ</p>
          <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
            Tạo đề online
          </h1>
          <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.75] text-ink-2">
            Nhập từng câu, đặt đáp án và lời giải, cài đặt cách làm bài rồi cho học sinh làm trực tiếp. Đề đang soạn dở được tự lưu
            ở đây; chỉ khi bấm Đăng thì đề mới lên cộng đồng.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate(`/tao-de-online/${create()}`)}>
          <Plus className="size-4" />
          Tạo đề mới
        </Button>
      </header>

      <div className="mb-6 flex items-center gap-2.5 text-[13px] text-ink-3">
        Lịch sử tạo đề <span className="tnum font-semibold text-ink">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" strokeWidth={1.6} />}
          title="Chưa có đề nào"
          description="Bấm Tạo đề mới để bắt đầu. Đề soạn dở sẽ tự lưu, bạn quay lại lúc nào cũng làm tiếp được."
          action={
            <Button variant="clay" onClick={() => navigate(`/tao-de-online/${create()}`)}>
              <Plus className="size-4" />
              Tạo đề mới
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <ItemCard key={it.id} item={it} index={i} onDelete={() => remove(it.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, index, onDelete }: { item: OnlineItem; index: number; onDelete: () => void }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const exam = itemToExam(item)
  const issues = item.questions.filter((q) => questionIssue(q)).length
  const playable = item.questions.length > 0 && issues === 0
  const published = Boolean(item.publishedId)

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

  return (
    <article
      className="anim-delay group flex flex-col overflow-hidden rounded-[8px] bg-surface shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
      style={{ '--delay': `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}
    >
      <Link to={`/tao-de-online/${item.id}`} className="relative flex h-[140px] flex-col justify-between overflow-hidden bg-sunken/70 p-5">
        <div
          className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full opacity-70 blur-2xl transition-transform duration-700 group-hover:scale-125"
          style={{ background: 'radial-gradient(circle, rgba(192,90,60,0.2), transparent 70%)' }}
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="clay">{item.meta.subject}</Badge>
            {published ? <Badge tone="sage">Đã đăng</Badge> : item.status === 'done' ? <Badge tone="honey">Đã tạo</Badge> : <Badge tone="neutral">Đang soạn</Badge>}
          </div>
          <span className="text-[12px] font-semibold text-ink-3">{item.meta.grade}</span>
        </div>
        <div className="relative">
          <p className="line-clamp-2 font-display text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            {item.meta.title.trim() || 'Đề chưa đặt tên'}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink-3">{item.meta.school || 'Chưa ghi tên trường'}</p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3.5 text-[12px] font-medium text-ink-3">
          <span className="tnum flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            {item.questions.length} câu
          </span>
          <span className="tnum flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {item.settings.noTimeLimit ? 'Không giới hạn' : `${item.meta.durationMinutes}′`}
          </span>
          <span className="tnum">{formatPoints(totalOf(item.questions))}đ</span>
        </div>

        {exam.sections[0]?.questions[0]?.prompt ? (
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-3">
            <MathText as="span" className="inline">
              {exam.sections[0].questions[0].prompt}
            </MathText>
          </p>
        ) : null}
        <p className="mt-3 text-[12px] text-ink-4">
          Sửa lần cuối {new Date(item.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button variant="soft" size="sm" onClick={() => navigate(`/tao-de-online/${item.id}`)}>
            {item.status === 'draft' ? 'Soạn tiếp' : 'Sửa đề'}
          </Button>
          <Button
            variant="clay"
            size="sm"
            disabled={!playable}
            title={playable ? 'Làm thử như học sinh' : 'Hoàn thiện các câu còn lỗi trước'}
            onClick={() => navigate(`/lam-de/${loadForQuiz(item)}`)}
          >
            <MonitorPlay className="size-3.5" />
            Làm thử
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {published ? (
            <CopyLink url={shareUrl(item.publishedId!)} className="min-w-0 flex-1" />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={busy || item.status !== 'done' || !playable}
              title={item.status !== 'done' ? 'Bấm Tạo đề ở bước cuối trước khi đăng' : undefined}
              onClick={() => void publish()}
            >
              <Upload className="size-3.5" />
              {busy ? 'Đang đăng…' : 'Đăng lên cộng đồng'}
            </Button>
          )}
          <button
            type="button"
            aria-label="Xoá đề"
            title="Xoá đề"
            onClick={() => {
              if (window.confirm(`Xoá "${item.meta.title.trim() || 'Đề chưa đặt tên'}" khỏi lịch sử? Bản đã đăng lên cộng đồng (nếu có) không bị xoá.`)) onDelete()
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-clay-soft hover:text-clay"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-[12.5px] font-medium text-clay-deep">
            {error}{' '}
            {error.includes('đăng nhập') ? (
              <Link to="/dang-nhap" className="underline">
                Đăng nhập
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </article>
  )
}
