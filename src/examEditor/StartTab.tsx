/**
 * Tab mặc định (đầu tiên trên dải tab) — trang bắt đầu port từ GenOffice
 * (`apps/shell/src/renderer/src/Home.tsx` + `home.css`):
 *
 *   hero "Chào buổi tối. Hôm nay soạn gì?" → hàng thẻ loại tệp → bảng đề gần đây
 *
 * Khác bản gốc: bản gốc liệt kê file trên đĩa; ở đây danh sách là các đề đã lưu
 * trong `useDocStore().myDocs`.
 */
import { useMemo, useState } from 'react'
import type { ExamDoc } from '@/data/docTypes'
import { docSize, formatBytes, useDocStore } from '@/store/docs'
import { IconDoc, IconSearch } from './icons'

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

/** huy hiệu chữ nhật bo góc, đúng kiểu badge .docx của bản gốc */
function DocBadge({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6.4" fill="#3276CD" />
      <path
        d="M9.4 8.6h8.9l4.3 4.3v10.5H9.4z"
        fill="#fff"
        fillOpacity="0.22"
      />
      <path
        d="M9.4 8.6h8.9l4.3 4.3v10.5H9.4z"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M18.3 8.6v4.3h4.3" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

/** huy hiệu slide — dùng khi đã có bài giảng thật */
function SlideBadge({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6.4" fill="#D33922" />
      <rect x="8" y="10.5" width="16" height="11" rx="1.6" stroke="#fff" strokeWidth="1.3" fill="none" />
      <path d="M16 21.5v3.4M12.6 24.9h6.8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'doc', label: 'Đề thi' },
  { key: 'slide', label: 'Slide' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

export function StartTab({
  onNewDoc,
  onOpenDoc,
}: {
  onNewDoc: () => void
  onOpenDoc: (doc: ExamDoc) => void
}) {
  const myDocs = useDocStore((s) => s.myDocs)
  const deleteDoc = useDocStore((s) => s.deleteDoc)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [ask] = useState(() => GREET_ASKS[Math.floor(Math.random() * GREET_ASKS.length)]!)

  const docs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...myDocs]
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .filter((d) => !q || d.title.toLowerCase().includes(q))
  }, [myDocs, query])

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
              <DocBadge size={30} />
              <span className="quick-text">
                <span className="quick-title-row">
                  <span className="quick-title">Đề thi</span>
                  <span className="ai-chip">AI</span>
                </span>
                <span className="quick-sub">.docx</span>
              </span>
            </button>

            <div className="quick-card quick-card--soon">
              <SlideBadge size={30} />
              <span className="quick-text">
                <span className="quick-title-row">
                  <span className="quick-title">Slide</span>
                  <span className="ai-chip">AI</span>
                </span>
                <span className="quick-sub">.pptx · sắp có</span>
              </span>
            </div>

            <div className="quick-card quick-card--soon">
              <span className="quick-folder">
                <IconDoc size={18} />
              </span>
              <span className="quick-text">
                <span className="quick-title-row">
                  <span className="quick-title">Mở đề đã lưu</span>
                </span>
                <span className="quick-sub">chọn từ danh sách bên dưới</span>
              </span>
            </div>
          </div>
        </section>

        <section className="recents" aria-label="Đề gần đây">
          <div className="recents-toolbar">
            <div className="filter-pills" role="tablist" aria-label="Lọc theo loại">
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

          {filter === 'slide' ? (
            <div className="start-empty">
              <p className="start-empty__title">Slide chưa mở</p>
              <p className="start-empty__desc">
                Trình soạn slide đang được làm. Khi xong, bài giảng sẽ xuất hiện ở đây cùng đề thi.
              </p>
            </div>
          ) : docs.length === 0 ? (
            <div className="start-empty">
              <p className="start-empty__title">
                {query.trim() ? 'Không tìm thấy đề phù hợp' : 'Chưa có đề nào'}
              </p>
              <p className="start-empty__desc">
                {query.trim()
                  ? 'Thử từ khoá khác.'
                  : 'Chọn thẻ “Đề thi” ở trên để mở trang soạn mới. Đề đã lưu sẽ hiện ở đây.'}
              </p>
            </div>
          ) : (
            <div className="recent-table">
              <div className="recent-columns">
                <span />
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
              </div>
              <ul className="recent-list">
                {docs.map((d) => (
                  <li key={d.id}>
                    <button type="button" className="recent-row" onClick={() => onOpenDoc(d)}>
                      <span className="recent-item">
                        <span className="recent-icon">
                          <DocBadge size={22} />
                        </span>
                        <span className="recent-name">{d.title}</span>
                        <span className="recent-path">Đề của tôi</span>
                        <span className="recent-time">{formatModified(d.updatedAt)}</span>
                        <span className="col-size recent-time">{formatBytes(docSize(d))}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="recent-del"
                      title="Xoá đề"
                      aria-label={`Xoá ${d.title}`}
                      onClick={() => deleteDoc(d.id)}
                    >
                      Xoá
                    </button>
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
