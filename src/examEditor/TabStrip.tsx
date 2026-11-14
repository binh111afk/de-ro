/**
 * Tab strip nhiều đề — kiểu Chrome của GenOffice (apps/shell/.../tabbar.css):
 * thanh nền xám, tab active trắng có bo tròn trên + chân cong nối xuống vùng
 * trắng bên dưới, mỗi đề là một tab độc lập.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { OpenTab } from '@/store/compose'
import { cn } from '@/lib/cn'
import { useAnimatedPresence } from '@/lib/useAnimatedPresence'
import { DocIcon, IconDocExam, IconDocBoard, IconDocSlide } from '@/components/docIcons'
import { IconChevronDown, IconChevronLeft, IconClose, IconHome, IconPlus } from './icons'
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
  onNewBoard,
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
  onNewBoard?: () => void
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

  // nhiều tab tràn khỏi thanh: mép mờ bên còn tab khuất + nút liệt kê tất cả tab
  const [edge, setEdge] = useState({ l: false, r: false, over: false })
  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const sync = () => {
      const over = el.scrollWidth > el.clientWidth + 1
      const l = over && el.scrollLeft > 2
      const r = over && el.scrollLeft < el.scrollWidth - el.clientWidth - 2
      setEdge((o) => (o.l === l && o.r === r && o.over === over ? o : { l, r, over }))
    }
    // chuột thường chỉ có lăn dọc → đổi thành cuộn ngang thanh tab
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      el.removeEventListener('wheel', onWheel)
      ro.disconnect()
    }
  }, [tabs.length])

  // tab vừa chọn / vừa mở nằm ngoài khung nhìn → cuộn tới (chừa chỗ cho mép mờ)
  useEffect(() => {
    const el = stripRef.current
    const t = el?.querySelector<HTMLElement>('.tab-item.active')
    if (!el || !t) return
    const pad = 40
    const left = t.offsetLeft - pad, right = t.offsetLeft + t.offsetWidth + pad
    if (left < el.scrollLeft) el.scrollTo({ left, behavior: 'smooth' })
    else if (right > el.scrollLeft + el.clientWidth) el.scrollTo({ left: right - el.clientWidth, behavior: 'smooth' })
  }, [activeId, startActive, tabs.length])

  return (
    <>
      <div className={cn('tab-strip', edge.l && 'fade-l', edge.r && 'fade-r')} role="tablist" aria-label="Đề đang mở" ref={stripRef}>
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
          data-tip="Quay lại trang chủ"
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
          data-tip="Trang bắt đầu"
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
          onNewBoard={onNewBoard}
          slideEnabled={slideEnabled ?? false}
        />
      </div>
      {edge.over && (
        <TabListMenu tabs={tabs} activeId={startActive ? null : activeId} onSelect={onSelect} onSelectStart={onSelectStart} startActive={startActive} />
      )}
    </>
  )
}

/** Nút ⌄ khi tab tràn: liệt kê mọi tab đang mở để nhảy tới nhanh (như Chrome) */
function TabListMenu({ tabs, activeId, startActive, onSelect, onSelectStart }: {
  tabs: OpenTab[]
  activeId: string | null
  startActive: boolean
  onSelect: (id: string) => void
  onSelectStart: () => void
}) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 260)
  const popAnim = useAnimatedPresence(open, 140)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  const pick = (fn: () => void) => { setOpen(false); fn() }
  return (
    <div className="tab-list-menu" ref={boxRef}>
      <button
        type="button"
        className="tab-list-btn"
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        onClick={() => setOpen((o) => !o)}
        data-tip={`Tất cả tab (${tabs.length + 1})`}
        aria-label="Danh sách tab đang mở"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconChevronDown size={16} />
      </button>
      {popAnim.mounted && (
        <div className={cn('new-doc-pop tab-list-pop', popAnim.closing ? 'pop-out' : 'pop-in')} style={popoverStyle(pos)} role="menu">
          <div className="new-doc-pop__head">Tab đang mở</div>
          <button type="button" role="menuitem" className={cn('tab-list-opt', startActive && 'is-active')} onClick={() => pick(onSelectStart)}>
            <IconHome size={18} />
            <span className="tab-list-opt__title">Bắt đầu</span>
          </button>
          {tabs.map((t) => (
            <button key={t.id} type="button" role="menuitem" className={cn('tab-list-opt', t.id === activeId && 'is-active')} onClick={() => pick(() => onSelect(t.id))}>
              <DocIcon kind={t.kind} size={18} />
              <span className="tab-list-opt__title">{t.title}</span>
              {t.dirty && <span className="tab-list-opt__dot" aria-label="Chưa lưu" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** các loại tài liệu mà menu "+" cho chọn */
interface NewDocOption {
  kind: 'exam' | 'slide' | 'board'
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
  { kind: 'board', label: 'Bảng vẽ', ext: '', available: true, note: 'Vẽ tay, sơ đồ' },
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
  onNewBoard,
  slideEnabled,
}: {
  onNewBoard?: () => void
  onNew: () => void
  onNewSlide?: () => void
  slideEnabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 232)
  const popAnim = useAnimatedPresence(open, 140)

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
    if (opt.kind === 'board') onNewBoard?.()
    else if (opt.kind === 'slide') onNewSlide?.()
    else onNew()
  }

  const iconOf = (kind: NewDocOption['kind']) => {
    if (kind === 'slide') return <IconDocSlide size={26} />
    if (kind === 'board') return <IconDocBoard size={26} />
    return <IconDocExam size={26} />
  }

  return (
    <div className="new-doc-menu" ref={menuRef}>
      <button
        type="button"
        className="tab-new-btn"
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        onClick={() => setOpen((o) => !o)}
        data-tip="Tạo tài liệu mới"
        aria-label="Tạo tài liệu mới"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconPlus size={16} />
      </button>

      {popAnim.mounted && (
        <div className={cn('new-doc-pop', popAnim.closing ? 'pop-out' : 'pop-in')} style={popoverStyle(pos)} role="menu">
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
      data-tip={tab.title}
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
        data-tip="Đóng tab"
        aria-label={`Đóng ${tab.title}`}
      >
        <IconClose size={13} />
      </button>
    </div>
  )
}
