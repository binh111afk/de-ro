/**
 * Tab strip nhiều đề — kiểu Chrome của GenOffice (apps/shell/.../tabbar.css):
 * thanh nền xám, tab active trắng có bo tròn trên + chân cong nối xuống vùng
 * trắng bên dưới, mỗi đề là một tab độc lập.
 */
import { useEffect, useRef, useState } from 'react'
import type { OpenTab } from '@/store/compose'
import { cn } from '@/lib/cn'
import { IconClose, IconDoc, IconPlus, IconSparkle } from './icons'

export function TabStrip({
  tabs,
  activeId,
  startActive,
  onSelect,
  onSelectStart,
  onClose,
  onNew,
  onRename,
}: {
  tabs: OpenTab[]
  activeId: string | null
  /** tab khởi động (đầu tiên, không đóng được) đang mở */
  startActive: boolean
  onSelect: (id: string) => void
  onSelectStart: () => void
  onClose: (id: string) => void
  onNew: () => void
  onRename: (id: string, title: string) => void
}) {
  return (
    <>
      <div className="tab-strip" role="tablist" aria-label="Đề đang mở">
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
            <IconSparkle size={15} />
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
        <button
          type="button"
          className="tab-new-btn"
          onClick={onNew}
          title="Tạo đề mới"
          aria-label="Tạo đề mới"
        >
          <IconPlus size={16} />
        </button>
      </div>
    </>
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
        <IconDoc size={16} />
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
