/**
 * Tab strip nhiều đề — kiểu Chrome của GenOffice (apps/shell/.../tabbar.css):
 * thanh nền xám, tab active trắng có bo tròn trên + chân cong nối xuống vùng
 * trắng bên dưới, mỗi đề là một tab độc lập.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OpenTab } from '@/store/compose'
import { cn } from '@/lib/cn'
import { DocIcon, IconDocExam, IconDocSheet, IconDocSlide } from '@/components/docIcons'
import { IconChevronLeft, IconClose, IconHome, IconPlus } from './icons'
import { useAnchoredPopover, popoverStyle } from './useAnchoredPopover'
import { useSlidingThumb } from './useSlidingThumb'

export function TabStrip({
  tabs,
  activeId,
  startActive,
  onSelect,
  onSelectStart,
  onClose,
  onNew,
  onNewSlide,
  slideEnabled,
  onRename,
  onBack,
}: {
  tabs: OpenTab[]
  activeId: string | null
  /** tab khởi động (đầu tiên, không đóng được) đang mở */
  startActive: boolean
  onSelect: (id: string) => void
  onSelectStart: () => void
  onClose: (id: string) => void
  onNew: () => void
  /** tạo bài trình bày mới (slide) */
  onNewSlide?: () => void
  /** mở khoá lựa chọn Slide trong menu "+" */
  slideEnabled?: boolean
  onRename: (id: string, title: string) => void
  /** rời trình soạn (tự lưu trước khi về trang chủ) */
  onBack?: () => void
}) {
  const navigate = useNavigate()
  const stripRef = useRef<HTMLDivElement>(null)
  // đĩa trắng trượt tới tab đang chọn; đo lại khi đổi tab hoặc danh sách tab thay đổi
  const thumb = useSlidingThumb(stripRef, '.tab-item.active', `${startActive ? 'start' : activeId}:${tabs.map((t) => t.id).join(',')}`)

  return (
    <>
      <div className="tab-strip" role="tablist" aria-label="Đề đang mở" ref={stripRef}>
        {thumb ? (
          <span
            aria-hidden
            className="tab-active-plate"
            style={{ transform: `translateX(${thumb.x + 3}px)`, width: thumb.w - 6 }}
          />
        ) : null}
        {/* Nút quay lại — đứng ngay trước tab "Bắt đầu", về trang chủ */}
        <button
          type="button"
          className="tab-back-btn"
          onClick={() => {
            onBack?.()
            navigate('/')
          }}
          title="Quay lại trang chủ"
          aria-label="Quay lại trang chủ"
        >
          <IconChevronLeft size={16} />
        </button>

        <div
          className={cn('tab-item tab-item--start', startActive && 'active')}
          onMouseDown={(e) => {
            if (e.button === 0) onSelectStart()
          }}
          role="tab"
          aria-selected={startActive}
          title="Trang bắt đầu"
        >
          <span className="tab-plate" aria-hidden="true" />
          <span className="tab-item__icon" aria-hidden="true">
            <IconHome size={20} />
          </span>
          <span className="tab-item__title">Bắt đầu</span>
        </div>
        {tabs.map((t) => (
          <TabItem
            key={t.id}
            tab={t}
            active={t.id === activeId}
            onSelect={() => onSelect(t.id)}
            onClose={() => onClose(t.id)}
            onRename={(title) => onRename(t.id, title)}
          />
        ))}
        <NewDocMenu
          onNew={onNew}
          onNewSlide={onNewSlide}
          slideEnabled={slideEnabled ?? false}
        />
      </div>
    </>
  )
}

/** các loại tài liệu mà menu "+" cho chọn */
interface NewDocOption {
  kind: 'exam' | 'slide' | 'sheet'
  label: string
  ext: string
  /** mở khóa hay chưa */
  available: boolean
  /** dòng ghi chú dưới tên */
  note: string
}

const NEW_DOC_OPTIONS: NewDocOption[] = [
  { kind: 'exam', label: 'Đề thi', ext: '.docx', available: true, note: 'Bài kiểm tra, đề thi' },
  { kind: 'slide', label: 'Slide', ext: '.pptx', available: true, note: 'Bài giảng, thuyết trình' },
  { kind: 'sheet', label: 'Bảng tính', ext: '.xlsx', available: false, note: 'Sắp có' },
]

/**
 * Nút "+" — mở menu chọn loại tài liệu cần soạn.
 *
 * Menu neo theo trigger bằng `position: fixed` (xem `useAnchoredPopover`) vì
 * tab strip nằm trong vùng cuộn ngang, popover `position: absolute` sẽ bị cắt.
 */
function NewDocMenu({
  onNew,
  onNewSlide,
  slideEnabled,
}: {
  onNew: () => void
  onNewSlide?: () => void
  slideEnabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 232)

  // đóng khi bấm ra ngoài
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // đóng bằng Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const pick = (opt: NewDocOption) => {
    setOpen(false)
    if (!opt.available) return
    if (opt.kind === 'slide') onNewSlide?.()
    else onNew()
  }

  const iconOf = (kind: NewDocOption['kind']) => {
    if (kind === 'slide') return <IconDocSlide size={26} />
    if (kind === 'sheet') return <IconDocSheet size={26} />
    return <IconDocExam size={26} />
  }

  return (
    <div className="new-doc-menu" ref={menuRef}>
      <button
        type="button"
        className="tab-new-btn"
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        onClick={() => setOpen((o) => !o)}
        title="Tạo tài liệu mới"
        aria-label="Tạo tài liệu mới"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconPlus size={16} />
      </button>

      {open && (
        <div className="new-doc-pop" style={popoverStyle(pos)} role="menu">
          <div className="new-doc-pop__head">Tạo tài liệu mới</div>
          {NEW_DOC_OPTIONS.map((opt) => {
            const disabled = !opt.available || (opt.kind === 'slide' && !slideEnabled)
            return (
              <button
                key={opt.kind}
                type="button"
                role="menuitem"
                className={cn('new-doc-opt', disabled && 'is-disabled')}
                disabled={disabled}
                onClick={() => pick(opt)}
              >
                <span className="new-doc-opt__icon" aria-hidden="true">
                  {iconOf(opt.kind)}
                </span>
                <span className="new-doc-opt__text">
                  <span className="new-doc-opt__title">
                    {opt.label}
                    <span className="new-doc-opt__ext">{opt.ext}</span>
                  </span>
                  <span className="new-doc-opt__note">{opt.note}</span>
                </span>
                {!opt.available && <span className="new-doc-opt__soon">Sắp có</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabItem({
  tab,
  active,
  onSelect,
  onClose,
  onRename,
}: {
  tab: OpenTab
  active: boolean
  onSelect: () => void
  onClose: () => void
  onRename: (title: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tab.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    setDraft(tab.title)
  }, [tab.title])

  const commit = () => {
    const v = draft.trim()
    if (v && v !== tab.title) onRename(v)
    setEditing(false)
  }

  return (
    <div
      className={cn('tab-item', active && 'active')}
      onMouseDown={(e) => {
        if (e.button === 0) onSelect()
      }}
      onDoubleClick={() => setEditing(true)}
      role="tab"
      aria-selected={active}
      title={tab.title}
    >
      <span className="tab-plate" aria-hidden="true" />
      <span className="tab-item__icon" aria-hidden="true">
        <DocIcon kind={tab.kind} size={20} />
      </span>
      {editing ? (
        <input
          ref={inputRef}
          className="tab-item__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(tab.title)
              setEditing(false)
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="tab-item__title">
          {tab.title}
          {tab.dirty ? <span className="tab-item__dot" aria-label="chưa lưu" /> : null}
        </span>
      )}
      <button
        type="button"
        className="tab-item__close"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onClose}
        title="Đóng tab"
        aria-label={`Đóng ${tab.title}`}
      >
        <IconClose size={13} />
      </button>
    </div>
  )
}
