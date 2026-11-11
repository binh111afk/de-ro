/**
 * Tab mặc định (đầu tiên trên dải tab) — trang bắt đầu port từ GenOffice
 * (`apps/shell/src/renderer/src/Home.tsx` + `home.css`):
 *
 *   hero "Chào buổi tối. Hôm nay soạn gì?" → hàng thẻ loại tệp → bảng đề gần đây
 *
 * Khác bản gốc: bản gốc liệt kê file trên đĩa; ở đây danh sách là các đề đã lưu
 * trong `useDocStore().myDocs`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ExamDoc } from '@/data/docTypes'
import { docSize, formatBytes, useDocStore, type Deck } from '@/store/docs'
import { useComposeStore } from '@/store/compose'
import { cn } from '@/lib/cn'
import { dialog } from '@/components/Dialog'
import { DocIcon, IconDocExam, IconDocBoard, IconDocSlide } from '@/components/docIcons'
import { IconPencil, IconSearch, IconTrash } from './icons'
import { useSlidingThumb } from './useSlidingThumb'

/** sub-lines của lời chào — chọn ngẫu nhiên mỗi lần mở, như bản gốc */
const GREET_ASKS = [
  'Hôm nay soạn gì?',
  'Bạn muốn tạo đề cho môn nào?',
  'Bắt đầu từ một đề trống nhé?',
  'Một đề mới, hay chỉnh đề cũ?',
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Chào buổi tối'
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

/** "Hôm nay · 14:05" / "Hôm qua" / "20/10/2026" — như formatModified của gốc */
function formatModified(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000)
  if (days <= 0) {
    return `Hôm nay · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (days === 1) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })
}

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'doc', label: 'Đề thi' },
  { key: 'slide', label: 'Slide' },
  { key: 'board', label: 'Bảng vẽ' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

/** một mục trong bảng "Gần đây" — đề thi hoặc bài trình bày */
type RecentItem = {
  id: string
  title: string
  kind: 'exam' | 'slide'
  updatedAt: string
  size: number
  /** payload gốc để mở lại */
  doc?: ExamDoc
  deck?: Deck
}

export function StartTab({
  onNewDoc,
  onOpenDoc,
  onNewSlide,
  onOpenDeck,
  onNewBoard,
}: {
  onNewBoard?: () => void
  onNewDoc: () => void
  onOpenDoc: (doc: ExamDoc) => void
  /** mở trình soạn slide tạo bài mới */
  onNewSlide?: () => void
  /** mở lại một bài trình bày đã lưu */
  onOpenDeck?: (deck: Deck) => void
}) {
  const myDocs = useDocStore((s) => s.myDocs)
  const myDecks = useDocStore((s) => s.myDecks)
  const deleteDoc = useDocStore((s) => s.deleteDoc)
  const deleteDeck = useDocStore((s) => s.deleteDeck)
  const renameDoc = useDocStore((s) => s.renameDoc)
  const renameDeck = useDocStore((s) => s.renameDeck)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [removing, setRemoving] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  /** bật từ ô tick ở dòng tiêu đề: hiện ô tick mọi dòng để người dùng tự chọn */
  const [selectMode, setSelectMode] = useState(false)
  /** dòng tick gần nhất, mốc cho Shift + bấm */
  const anchor = useRef<number | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const editRef = useRef<HTMLInputElement>(null)
  /** Esc huỷ: input bị gỡ có thể bắn blur → chặn commit một lần */
  const cancelled = useRef(false)
  const [ask] = useState(() => GREET_ASKS[Math.floor(Math.random() * GREET_ASKS.length)]!)

  useEffect(() => {
    if (!editing) return
    editRef.current?.focus()
    editRef.current?.select()
  }, [editing])

  const startRename = (item: RecentItem) => {
    cancelled.current = false
    setEditing(item.id)
    setDraft(item.title)
  }

  const commitRename = (item: RecentItem) => {
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    const title = draft.trim()
    setEditing(null)
    if (!title || title === item.title) return
    if (item.kind === 'slide') renameDeck(item.id, title)
    else renameDoc(item.id, title)
    // tab đang mở cũng phải đổi tên, nếu không lần tự lưu sau ghi đè tên cũ
    const compose = useComposeStore.getState()
    compose.renameTab(item.id, title)
    if (compose.decks[item.id]) compose.updateDeck(item.id, { title })
  }

  /** xoá có animation: giữ dòng lại 170ms rồi mới bỏ khỏi store */
  const removeItems = async (items: RecentItem[]) => {
    const message = items.length === 1 ? `Xoá "${items[0].title}"? Thao tác này không thể hoàn tác.` : `Xoá ${items.length} tệp đã chọn? Thao tác này không thể hoàn tác.`
    const ok = await dialog.confirm(message, { title: 'Xoá tệp', danger: true, confirmLabel: 'Xoá' })
    if (!ok) return
    const ids = items.map((it) => it.id)
    setSelected((cur) => cur.filter((id) => !ids.includes(id)))
    setSelectMode(false)
    setRemoving((cur) => [...new Set([...cur, ...ids])])
    window.setTimeout(() => {
      for (const item of items) {
        if (item.kind === 'slide') deleteDeck(item.id)
        else deleteDoc(item.id)
      }
      setRemoving((cur) => cur.filter((id) => !ids.includes(id)))
    }, 170)
  }

  const docs = useMemo<RecentItem[]>(() => {
    const q = query.trim().toLowerCase()
    const items: RecentItem[] = [
      ...myDocs.map((d) => ({
        id: d.id,
        title: d.title,
        kind: 'exam' as const,
        updatedAt: d.updatedAt,
        size: docSize(d),
        doc: d,
      })),
      ...myDecks.map((dk) => ({
        id: dk.id,
        title: dk.title,
        kind: 'slide' as const,
        updatedAt: dk.updatedAt,
        size: new Blob([JSON.stringify(dk)]).size,
        deck: dk,
      })),
    ]
    return items
      .filter((it) => {
        if (filter === 'doc') return it.kind === 'exam'
        if (filter === 'slide') return it.kind === 'slide'
        if (filter === 'board') return false
        return true
      })
      .filter((it) => !q || it.title.toLowerCase().includes(q))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }, [myDocs, myDecks, query, filter])

  // đổi bộ lọc hay tìm kiếm thì bỏ chọn, để không xoá nhầm dòng đang bị ẩn
  useEffect(() => {
    setSelected([])
    setSelectMode(false)
    anchor.current = null
  }, [query, filter])

  const chosen = docs.filter((d) => selected.includes(d.id))
  const allChosen = docs.length > 0 && chosen.length === docs.length
  const selectAll = () => setSelected(docs.map((d) => d.id))
  const bulkOpen = selectMode || chosen.length > 0
  const clearSelection = () => {
    setSelected([])
    setSelectMode(false)
    anchor.current = null
  }

  const toggleRow = (index: number, checked: boolean, shift: boolean) => {
    const from = shift && anchor.current !== null ? Math.min(anchor.current, index) : index
    const to = shift && anchor.current !== null ? Math.max(anchor.current, index) : index
    const ids = docs.slice(from, to + 1).map((d) => d.id)
    setSelected((cur) => (checked ? [...new Set([...cur, ...ids])] : cur.filter((id) => !ids.includes(id))))
    anchor.current = index
  }

  // thẻ trắng của segmented control trượt theo pill active
  const pillsRef = useRef<HTMLDivElement>(null)
  const thumb = useSlidingThumb(pillsRef, '.filter-pill.active', filter)

  return (
    <div className="start-scroll">
      <main className="start">
        <section aria-label="Bắt đầu">
          <div className="start-hero">
            <h1 className="hero-title">
              {greeting()}.
              <span className="hero-ask">{ask}</span>
            </h1>
          </div>

          <div className="quick-cards">
            <button type="button" className="quick-card" onClick={onNewDoc}>
              <IconDocExam size={30} />
              <span className="quick-text">
                <span className="quick-title-row">
                  <span className="quick-title">Đề thi</span>
                  <span className="ai-chip">AI</span>
                </span>
                <span className="quick-sub">.docx</span>
              </span>
            </button>

            <button
              type="button"
              className="quick-card"
              onClick={onNewSlide}
              disabled={!onNewSlide}
            >
              <IconDocSlide size={30} />
              <span className="quick-text">
                <span className="quick-title-row">
                  <span className="quick-title">Slide</span>
                  <span className="ai-chip">AI</span>
                </span>
                <span className="quick-sub">.pptx</span>
              </span>
            </button>

            <button type="button" className="quick-card" onClick={onNewBoard}>
              <IconDocBoard size={30} />
              <span className="quick-text">
                <span className="quick-title-row">
                  <span className="quick-title">Bảng vẽ</span>
                </span>
                <span className="quick-sub">Vẽ tay, sơ đồ</span>
              </span>
            </button>
          </div>
        </section>

        <section className="recents" aria-label="Đề gần đây">
          <div className="recents-toolbar">
            <div
              className="filter-pills"
              role="tablist"
              aria-label="Lọc theo loại"
              ref={pillsRef}
            >
              {thumb ? (
                <span
                  className="filter-pill__thumb"
                  style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
                />
              ) : null}
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={filter === f.key ? 'filter-pill active' : 'filter-pill'}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="file-search">
              <IconSearch size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên đề…"
                aria-label="Tìm đề"
              />
            </div>

            <div className="recents-heading">
              <span className="section-label">Gần đây</span>
              <span className="file-count">{docs.length} tệp</span>
            </div>
          </div>

          {filter === 'board' ? (
            <div className="start-empty">
              <p className="start-empty__title">Bảng vẽ chưa mở</p>
              <p className="start-empty__desc">
                Bảng vẽ đang được làm. Khi xong, các bảng vẽ sẽ xuất hiện ở đây cùng đề thi và slide.
              </p>
            </div>
          ) : docs.length === 0 ? (
            <div className="start-empty">
              <p className="start-empty__title">
                {query.trim() ? 'Không tìm thấy tệp phù hợp' : 'Chưa có tệp nào'}
              </p>
              <p className="start-empty__desc">
                {query.trim()
                  ? 'Thử từ khoá khác.'
                  : 'Chọn thẻ “Đề thi” hoặc “Slide” ở trên để tạo tài liệu mới. Tệp đã lưu sẽ hiện ở đây.'}
              </p>
            </div>
          ) : (
            <div className="recent-table">
              {bulkOpen ? (
                <div className="recent-columns recent-columns--bulk">
                  <span className="recent-head-check">
                    <input
                      type="checkbox"
                      checked={allChosen}
                      ref={(el) => {
                        if (el) el.indeterminate = chosen.length > 0 && !allChosen
                      }}
                      onChange={clearSelection}
                      aria-label="Tắt chế độ chọn"
                    />
                  </span>
                  <span className="recent-bulk-count">Đã chọn {chosen.length}</span>
                  {allChosen ? null : (
                    <button type="button" className="recent-bulk-btn" onClick={selectAll}>
                      Chọn tất cả ({docs.length})
                    </button>
                  )}
                  <button type="button" className="recent-bulk-btn recent-bulk-btn--danger" onClick={() => void removeItems(chosen)} disabled={chosen.length === 0}>
                    <IconTrash size={15} />
                    Xoá
                  </button>
                  <button type="button" className="recent-bulk-btn" onClick={clearSelection}>
                    Bỏ chọn
                  </button>
                </div>
              ) : (
              <div className="recent-columns">
                <span className="recent-head-check">
                  <input type="checkbox" checked={false} onChange={() => setSelectMode(true)} aria-label="Bật chế độ chọn" />
                </span>
                <span className="col-name">Tên</span>
                <span>Vị trí</span>
                <span className="col-sort">
                  Sửa đổi
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M8 3v10M4.5 9.5L8 13l3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="col-size">Kích thước</span>
                <span />
              </div>
              )}
              <ul className={cn('recent-list', bulkOpen && 'has-selection')}>
                {docs.map((d, index) => (
                  <li
                    key={d.id}
                    className={cn('recent-row-item', removing.includes(d.id) && 'is-removing', selected.includes(d.id) && 'is-selected')}
                  >
                    {editing === d.id ? null : (
                      <label className="recent-check">
                        <input
                          type="checkbox"
                          checked={selected.includes(d.id)}
                          onChange={(e) => toggleRow(index, e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)}
                          aria-label={`Chọn ${d.title}`}
                        />
                      </label>
                    )}
                    {editing === d.id ? (
                      <div className="recent-item">
                        <span className="recent-icon">
                          <DocIcon kind={d.kind} size={22} />
                        </span>
                        <input
                          ref={editRef}
                          className="recent-name-input"
                          value={draft}
                          aria-label={`Đổi tên ${d.title}`}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => commitRename(d)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(d)
                            if (e.key === 'Escape') {
                              cancelled.current = true
                              setEditing(null)
                            }
                          }}
                        />
                        <span className="recent-path">
                          {d.kind === 'slide' ? 'Bài giảng của tôi' : 'Đề của tôi'}
                        </span>
                        <span className="recent-time">{formatModified(d.updatedAt)}</span>
                        <span className="col-size recent-time">{formatBytes(d.size)}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="recent-row"
                        onClick={() => {
                          if (d.kind === 'slide') onOpenDeck?.(d.deck!)
                          else onOpenDoc(d.doc!)
                        }}
                        disabled={removing.includes(d.id)}
                      >
                        <span className="recent-item">
                          <span className="recent-icon">
                            <DocIcon kind={d.kind} size={22} />
                          </span>
                          <span className="recent-name">{d.title}</span>
                          <span className="recent-path">
                            {d.kind === 'slide' ? 'Bài giảng của tôi' : 'Đề của tôi'}
                          </span>
                          <span className="recent-time">{formatModified(d.updatedAt)}</span>
                          <span className="col-size recent-time">{formatBytes(d.size)}</span>
                        </span>
                      </button>
                    )}
                    {editing === d.id ? null : (
                      <div className="recent-actions">
                        <button
                          type="button"
                          className="recent-act"
                          title="Đổi tên"
                          aria-label={`Đổi tên ${d.title}`}
                          onClick={() => startRename(d)}
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="recent-act recent-act--danger"
                          title="Xoá tệp"
                          aria-label={`Xoá ${d.title}`}
                          onClick={() => void removeItems([d])}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
