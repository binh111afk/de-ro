/**
 * Trang "Đề của tôi" — quản lý tài liệu đề đã lưu.
 * Có: quota 10MB, sắp xếp, lưới/danh sách, tìm kiếm, menu Mở / Đổi tên / Chia sẻ / Xoá.
 */
import { dialog } from '@/components/Dialog'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  FolderOpen,
  Grid2x2,
  List,
  MoreHorizontal,
  Pencil,
  Presentation,
  Search,
  Share2,
  Trash2,
} from 'lucide-react'
import { Button, EmptyState, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useDocStore, STORAGE_QUOTA, formatBytes, totalDocSize } from '@/store/docs'
import type { ExamDoc } from '@/data/docTypes'

type SortKey = 'recent' | 'oldest' | 'name' | 'size'

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'recent', label: 'Mới nhất' },
  { key: 'oldest', label: 'Cũ nhất' },
  { key: 'name', label: 'Tên A–Z' },
  { key: 'size', label: 'Kích thước' },
]

type RowAction = {
  label: string
  icon: typeof FileText
  fn: () => void
  danger?: boolean
}

function rowActions(d: ExamDoc, handlers: {
  onOpen: (d: ExamDoc) => void
  onRename: (d: ExamDoc) => void
  onShare: (d: ExamDoc) => void
  onDelete: (d: ExamDoc) => void
}): RowAction[] {
  return [
    { label: 'Mở', icon: FileText, fn: () => handlers.onOpen(d) },
    { label: 'Đổi tên', icon: Pencil, fn: () => handlers.onRename(d) },
    { label: 'Chia sẻ', icon: Share2, fn: () => handlers.onShare(d) },
    { label: 'Xoá', icon: Trash2, fn: () => handlers.onDelete(d), danger: true },
  ]
}

export default function MyDocs() {
  const navigate = useNavigate()
  const { myDocs, myDecks, openDoc, renameDoc, deleteDoc } = useDocStore()
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('recent')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'exam' | 'slide'>('exam')

  const used = totalDocSize(myDocs)
  const pct = Math.min(100, (used / STORAGE_QUOTA) * 100)

  const items = useMemo(() => {
    const src = tab === 'exam' ? myDocs : []
    const filtered = q.trim()
      ? src.filter((d) => d.title.toLowerCase().includes(q.trim().toLowerCase()))
      : src
    const sorted = [...filtered]
    switch (sort) {
      case 'recent':
        sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        break
      case 'oldest':
        sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
        break
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'vi'))
        break
      case 'size':
        sorted.sort((a, b) => b.blocks.length - a.blocks.length)
        break
    }
    return sorted
  }, [tab, myDocs, q, sort])

  const onOpen = (d: ExamDoc) => {
    openDoc(d)
    navigate('/soan-de')
  }

  const onRename = async (d: ExamDoc) => {
    const t = await dialog.prompt('Tên mới sẽ hiện trong danh sách đề của bạn.', { title: 'Đổi tên đề', label: 'Tên đề', defaultValue: d.title })
    if (t?.trim()) renameDoc(d.id, t.trim())
  }

  const onShare = (d: ExamDoc) => {
    const url = `${window.location.origin}/de/${d.id}`
    navigator.clipboard?.writeText(url)
    void dialog.alert(url, { title: 'Đã sao chép liên kết chia sẻ' })
  }

  const onDelete = async (d: ExamDoc) => {
    if (await dialog.confirm(`Xoá "${d.title}"?`, { title: 'Xoá đề', confirmLabel: 'Xoá', danger: true })) deleteDoc(d.id)
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Của bạn</p>
          <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
            Đề của tôi
          </h1>
          <p className="mt-3 text-[14.5px] text-ink-3">
            <span className="tnum font-bold text-ink">{myDocs.length}</span> đề ·{' '}
            <span className="tnum font-bold text-ink">{myDecks.length}</span> bài giảng slide
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={() => navigate('/soan-de')}>
            <Presentation className="size-4" />
            Soạn slide
          </Button>
          <Button variant="primary" onClick={() => navigate('/soan-de')}>
            <FileText className="size-4" />
            Soạn đề mới
          </Button>
        </div>
      </header>

      {/* quota */}
      <div className="mb-6 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="font-semibold text-ink-2">Dung lượng đã dùng</span>
          <span className="tnum text-ink-3">
            {formatBytes(used)} / {formatBytes(STORAGE_QUOTA)}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-veil">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              pct > 90 ? 'bg-clay' : pct > 70 ? 'bg-honey' : 'bg-sage',
            )}
            style={{ width: `${Math.max(1.5, pct)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11.5px] text-ink-4">
          Đề được lưu trên thiết bị này. Quota tối đa 10 MB.
        </p>
      </div>

      {/* tabs + toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-line bg-surface p-0.5">
          {(
            [
              { id: 'exam' as const, label: 'Đề thi' },
              { id: 'slide' as const, label: 'Bài giảng slide' },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-[10px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                tab === t.id ? 'bg-clay-soft text-clay' : 'text-ink-3 hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm đề…"
            className={cn(inputClass, 'w-[200px] !py-1.5 !pl-8 !text-[13px]')}
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className={cn(inputClass, 'w-auto !py-1.5 !text-[13px]')}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-line bg-surface p-0.5">
          {(
            [
              { id: 'grid' as const, icon: Grid2x2, label: 'Dạng lưới' },
              { id: 'list' as const, icon: List, label: 'Dạng danh sách' },
            ]
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              title={v.label}
              onClick={() => setView(v.id)}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                view === v.id ? 'bg-sunken text-ink' : 'text-ink-4 hover:text-ink',
              )}
            >
              <v.icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* nội dung */}
      {tab === 'slide' ? (
        <EmptyState
          icon={<Presentation className="size-7" strokeWidth={1.4} />}
          title="Chưa có bài giảng slide"
          description="Soạn bài giảng trình chiếu cho lớp, xuất PowerPoint."
          action={
            <Button variant="primary" onClick={() => navigate('/soan-de')}>
              Soạn slide
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="size-7" strokeWidth={1.4} />}
          title={q ? 'Không tìm thấy đề nào' : 'Chưa có đề nào'}
          description={
            q
              ? 'Thử từ khoá khác hoặc xoá bộ lọc.'
              : 'Những đề bạn soạn hoặc lưu sẽ xuất hiện ở đây. Bạn có thể mở lại, xuất Word hoặc chia sẻ.'
          }
          action={
            !q ? (
              <Button variant="primary" onClick={() => navigate('/soan-de')}>
                Soạn đề mới
              </Button>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <div
              key={d.id}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-soft"
            >
              <button
                type="button"
                onClick={() => onOpen(d)}
                className="block w-full px-5 py-6 text-left"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-md bg-clay-soft px-2 py-0.5 text-[11px] font-bold text-clay">
                    {d.subject}
                  </span>
                  <span className="text-[11.5px] text-ink-4">{d.grade}</span>
                </div>
                <h3 className="line-clamp-2 font-display text-[16px] font-semibold leading-snug text-ink">
                  {d.title}
                </h3>
                <p className="mt-2 text-[12px] text-ink-4">
                  {d.blocks.filter((b) => b.type === 'question').length} trắc nghiệm ·{' '}
                  {d.blocks.filter((b) => b.type === 'essay').length} tự luận
                </p>
                <p className="mt-1 text-[11.5px] text-ink-4">
                  Sửa lần cuối {new Date(d.updatedAt).toLocaleString('vi-VN')}
                </p>
              </button>

              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  onClick={() => setMenuFor(menuFor === d.id ? null : d.id)}
                  className="rounded-md p-1.5 text-ink-3 opacity-0 transition-opacity hover:bg-sunken hover:text-ink group-hover:opacity-100"
                  aria-label="Thao tác"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuFor === d.id ? (
                  <div className="absolute right-0 top-9 z-20 w-[168px] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-[0_12px_32px_-12px_rgba(35,32,28,0.35)]">
                    {rowActions(d, { onOpen, onRename, onShare, onDelete }).map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => {
                          setMenuFor(null)
                          m.fn()
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors',
                          m.danger
                            ? 'text-clay hover:bg-clay-soft'
                            : 'text-ink-2 hover:bg-sunken hover:text-ink',
                        )}
                      >
                        <m.icon className="size-3.5" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-left">
            <thead className="border-b border-line bg-sunken/60">
              <tr className="text-[11.5px] uppercase tracking-wider text-ink-3">
                <th className="px-4 py-2.5 font-semibold">Tên đề</th>
                <th className="px-4 py-2.5 font-semibold">Môn</th>
                <th className="px-4 py-2.5 font-semibold">Số câu</th>
                <th className="px-4 py-2.5 font-semibold">Cập nhật</th>
                <th className="w-12 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b border-line-2 last:border-0 hover:bg-sunken/40">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(d)}
                      className="text-left font-semibold text-ink transition-colors hover:text-clay"
                    >
                      {d.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-2">{d.subject}</td>
                  <td className="tnum px-4 py-3 text-[13px] text-ink-2">
                    {d.blocks.filter((b) => b.type === 'question').length +
                      d.blocks.filter((b) => b.type === 'essay').length}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-ink-3">
                    {new Date(d.updatedAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="relative px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setMenuFor(menuFor === d.id ? null : d.id)}
                      className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
                      aria-label="Thao tác"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    {menuFor === d.id ? (
                      <div className="absolute right-4 top-11 z-20 w-[168px] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-[0_12px_32px_-12px_rgba(35,32,28,0.35)]">
                        {rowActions(d, { onOpen, onRename, onShare, onDelete }).map((m) => (
                          <button
                            key={m.label}
                            type="button"
                            onClick={() => {
                              setMenuFor(null)
                              m.fn()
                            }}
                            className={cn(
                              'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors',
                              m.danger
                                ? 'text-clay hover:bg-clay-soft'
                                : 'text-ink-2 hover:bg-sunken hover:text-ink',
                            )}
                          >
                            <m.icon className="size-3.5" />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
