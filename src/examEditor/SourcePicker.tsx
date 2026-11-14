/**
 * Modal "Thêm nguồn" của trợ lý AI: chọn đề của tôi, đề cộng đồng hoặc tệp trong kho tài liệu
 * làm nguồn tham khảo. Chỉ chọn ở đây; nội dung được tải lúc bấm gửi (loadPickedSources).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Search, X } from 'lucide-react'
import { Portal } from '@/components/Portal'
import { Segmented } from '@/components/Segmented'
import { Button, inputClass } from '@/components/ui'
import { useDocStore } from '@/store/docs'
import { useComposeStore } from '@/store/compose'
import { listCommunityDocs, type CommunityRow } from '@/lib/community'
import { DOC_TYPES, listDocuments, type UserDocument } from '@/lib/documents'
import { useSession } from '@/lib/useSession'
import { MAX_PICKED, pickedKey, type PickedSource } from '@/lib/sources'
import { cn } from '@/lib/cn'

type Tab = 'mine' | 'community' | 'library'

/** danh sách tải từ máy chủ: undefined = chưa tải, null = đang tải */
type Remote<T> = { rows?: T[] | null; error?: string }

const metaOf = (...parts: Array<string | null | undefined>) => parts.filter((p) => p && p.trim()).join(' · ')

export function SourcePicker({
  value,
  onClose,
  onDone,
}: {
  value: PickedSource[]
  onClose: () => void
  onDone: (picked: PickedSource[]) => void
}) {
  const session = useSession()
  const myDocs = useDocStore((s) => s.myDocs)
  const activeId = useComposeStore((s) => s.activeId)
  const [tab, setTab] = useState<Tab>('mine')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<PickedSource[]>(value)
  const [community, setCommunity] = useState<Remote<CommunityRow>>({})
  const [library, setLibrary] = useState<Remote<UserDocument>>({})

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // tải danh sách khi mở tab lần đầu
  useEffect(() => {
    if (tab === 'community' && community.rows === undefined) {
      setCommunity({ rows: null })
      listCommunityDocs()
        .then((rows) => setCommunity({ rows }))
        .catch((err) => setCommunity({ rows: [], error: err instanceof Error ? err.message : 'Không tải được đề cộng đồng.' }))
    }
    if (tab === 'library' && session && library.rows === undefined) {
      setLibrary({ rows: null })
      listDocuments()
        .then((rows) => setLibrary({ rows }))
        .catch((err) => setLibrary({ rows: [], error: err instanceof Error ? err.message : 'Không tải được kho tài liệu.' }))
    }
  }, [tab, session, community.rows, library.rows])

  const options: Record<Tab, PickedSource[] | null> = useMemo(
    () => ({
      mine: myDocs
        .filter((d) => d.id !== activeId && (d.kind ?? 'exam') === 'exam' && d.blocks.length > 0)
        .map((d) => ({ kind: 'mine', id: d.id, name: d.title.trim() || 'Đề chưa đặt tên', meta: metaOf(d.subject, d.grade) })),
      community:
        community.rows === null || community.rows === undefined
          ? null
          : community.rows.map((r) => ({
              kind: 'community',
              id: r.id,
              name: r.title.trim() || 'Đề chưa đặt tên',
              meta: metaOf(r.subject, r.grade, r.school, `${r.question_count} câu`),
            })),
      library:
        library.rows === null || library.rows === undefined
          ? null
          : library.rows.map((d) => ({
              kind: 'library',
              id: d.id,
              name: d.name,
              meta: metaOf(DOC_TYPES[d.mime] ?? 'Tệp', d.subject),
              url: d.url,
              mime: d.mime,
            })),
    }),
    [myDocs, activeId, community.rows, library.rows],
  )

  const needle = q.trim().toLowerCase()
  // kho tài liệu cần đăng nhập: chưa đăng nhập thì coi như danh sách rỗng để hiện lời mời đăng nhập, không quay vòng tải
  const list = tab === 'library' && !session ? [] : options[tab]
  const shown = list?.filter((o) => !needle || `${o.name} ${o.meta ?? ''}`.toLowerCase().includes(needle)) ?? null
  const chosen = new Set(picked.map(pickedKey))
  const full = picked.length >= MAX_PICKED
  const countOf = (t: Tab) => picked.filter((p) => p.kind === t).length

  const toggle = (o: PickedSource) => {
    const k = pickedKey(o)
    if (chosen.has(k)) setPicked((cur) => cur.filter((p) => pickedKey(p) !== k))
    else if (!full) setPicked((cur) => [...cur, o])
  }

  const tabs = [
    { key: 'mine' as const, label: 'Đề của tôi', count: countOf('mine') || undefined },
    { key: 'community' as const, label: 'Cộng đồng', count: countOf('community') || undefined },
    { key: 'library' as const, label: 'Kho tài liệu', count: countOf('library') || undefined },
  ]

  const empty = (() => {
    if (tab === 'library' && !session)
      return (
        <div className="space-y-3 text-center">
          <p>Đăng nhập để dùng tài liệu bạn đã tải lên.</p>
          <Link to="/dang-nhap" className="inline-block">
            <Button variant="outline" size="sm">Đăng nhập</Button>
          </Link>
        </div>
      )
    const err = tab === 'community' ? community.error : tab === 'library' ? library.error : undefined
    if (err) return <p className="text-red-600">{err}</p>
    if (needle) return <p>Không có mục nào khớp “{q.trim()}”.</p>
    if (tab === 'mine') return <p>Chưa có đề nào khác đề đang mở.</p>
    if (tab === 'community') return <p>Chưa có đề cộng đồng nào.</p>
    return (
      <div className="space-y-3 text-center">
        <p>Kho tài liệu đang trống.</p>
        <Link to="/kho-tai-lieu" className="inline-block text-clay underline-offset-2 hover:underline">
          Tải tài liệu lên
        </Link>
      </div>
    )
  })()

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:px-5"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Thêm nguồn cho trợ lý AI"
          className="anim-sheet flex max-h-[min(640px,92dvh)] w-full flex-col rounded-t-[12px] bg-surface shadow-float sm:max-w-[560px] sm:rounded-[8px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="min-w-0">
              <h2 className="font-display text-[20px] font-semibold text-ink">Thêm nguồn</h2>
              <p className="mt-1 text-[13.5px] text-ink-3">
                AI sẽ bám theo các nguồn này khi soạn. Chọn tối đa {MAX_PICKED} nguồn.
              </p>
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

          <div className="space-y-3 px-5 pt-4 sm:px-6">
            <div className="overflow-x-auto">
              <Segmented value={tab} options={tabs} onChange={(t) => { setTab(t); setQ('') }} label="Loại nguồn" />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, môn, lớp…"
                aria-label="Tìm nguồn"
                className={cn(inputClass, 'h-10 pl-10 text-[14px]')}
              />
            </div>
          </div>

          <div className="mt-3 min-h-[200px] flex-1 overflow-y-auto px-3 sm:px-4">
            {shown === null ? (
              <ul className="space-y-1 px-2 py-1" aria-label="Đang tải">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="h-[52px] animate-pulse rounded-[6px] bg-sunken/70" />
                ))}
              </ul>
            ) : shown.length === 0 ? (
              <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-[14px] text-ink-3">{empty}</div>
            ) : (
              <ul className="py-1">
                {shown.map((o) => {
                  const on = chosen.has(pickedKey(o))
                  const disabled = !on && full
                  return (
                    <li key={pickedKey(o)}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        disabled={disabled}
                        onClick={() => toggle(o)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2.5 text-left transition-colors',
                          on ? 'bg-clay-tint/60' : 'hover:bg-sunken',
                          disabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                            on ? 'border-clay bg-clay text-white' : 'border-line bg-surface',
                          )}
                          aria-hidden
                        >
                          {on ? <Check className="size-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-ink" data-tip={o.name}>{o.name}</span>
                          {o.meta ? <span className="block truncate text-[12px] text-ink-3">{o.meta}</span> : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
            <span className="text-[13px] text-ink-3">
              {picked.length ? `Đã chọn ${picked.length}/${MAX_PICKED}` : 'Chưa chọn nguồn nào'}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Huỷ</Button>
              <Button variant="clay" size="sm" onClick={() => onDone(picked)}>
                {value.length ? 'Cập nhật nguồn' : 'Thêm nguồn'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
