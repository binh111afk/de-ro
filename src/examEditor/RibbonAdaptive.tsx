import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ChevronDown, MoreHorizontal, Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { RibbonGroup } from './Layout'
import { popoverStyle, useAnchoredPopover } from './useAnchoredPopover'
import type { FormatState } from './formatState'
import {
  IconBullets,
  IconChevronDown,
  IconChevronUp,
  IconFontColorA,
  IconIndentDec,
  IconIndentInc,
  IconMultilevel,
  IconNumbered,
  IconRedo,
  IconSave,
  IconUndo,
} from './icons'
import { Wrench } from 'lucide-react'

export interface RibbonGroupDef {
  id: string
  label: string
  render: () => ReactNode
}

/* ------------------------------------------------------------------ *
 * Tablet (640–1023px): Word-Online-style adaptive ribbon body
 * ------------------------------------------------------------------ */

const SEP_W = 13
const COLLAPSED_BTN_W = 86
const MORE_BTN_W = 52

export function TabletRibbonBody({
  activeKey,
  groups,
}: {
  activeKey: string
  groups: RibbonGroupDef[]
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const widthsRef = useRef<Record<string, number>>({})
  const [bodyW, setBodyW] = useState(0)
  const [, setMeasureTick] = useState(0)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const sync = () => setBodyW(el.clientWidth)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Đo bề rộng tự nhiên của từng nhóm khi đang mở rộng
  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page) return
    let changed = false
    const els = page.querySelectorAll<HTMLElement>('[data-rg-id]')
    els.forEach((el) => {
      const id = el.dataset.rgId
      if (!id) return
      const key = `${activeKey}:${id}`
      const w = el.offsetWidth
      if (w > 0 && widthsRef.current[key] !== w) {
        widthsRef.current[key] = w
        changed = true
      }
    })
    if (changed) setMeasureTick((t) => t + 1)
  })

  const allMeasured = groups.every((g) => (widthsRef.current[`${activeKey}:${g.id}`] ?? 0) > 0)

  const layout = useMemo(() => {
    if (!allMeasured || !bodyW) {
      return { fitCount: groups.length, collapsedCount: 0 }
    }
    const avail = Math.max(200, bodyW - 28)
    for (let k = groups.length; k >= 0; k--) {
      let expW = 0
      for (let i = 0; i < k; i++) {
        expW += widthsRef.current[`${activeKey}:${groups[i].id}`] ?? 100
      }
      if (k > 1) expW += (k - 1) * SEP_W
      const rem = groups.length - k
      if (rem === 0) {
        if (expW <= avail) return { fitCount: k, collapsedCount: 0 }
        continue
      }
      const prefixSep = k > 0 ? SEP_W : 0
      const needAll = expW + prefixSep + rem * COLLAPSED_BTN_W + (rem - 1) * SEP_W
      if (needAll <= avail) {
        return { fitCount: k, collapsedCount: rem }
      }
      for (let c = rem - 1; c >= 0; c--) {
        const need = expW + prefixSep + c * (COLLAPSED_BTN_W + SEP_W) + MORE_BTN_W
        if (need <= avail) {
          return { fitCount: k, collapsedCount: c }
        }
      }
    }
    return { fitCount: 0, collapsedCount: 0 }
  }, [allMeasured, bodyW, activeKey, groups])

  const expandedGroups = groups.slice(0, layout.fitCount)
  const collapsedGroups = groups.slice(layout.fitCount, layout.fitCount + layout.collapsedCount)
  const overflowGroups = groups.slice(layout.fitCount + layout.collapsedCount)

  return (
    <div className="ribbon-body ribbon-body--tablet" ref={bodyRef}>
      <div key={activeKey} className="ribbon-tab-page" ref={pageRef}>
        {expandedGroups.map((g, idx) => (
          <div key={g.id} className="contents">
            {idx > 0 && <span className="ribbon-sep" />}
            <div data-rg-id={g.id} className="flex shrink-0 items-stretch">
              <RibbonGroup label={g.label}>{g.render()}</RibbonGroup>
            </div>
          </div>
        ))}
        {collapsedGroups.map((g, idx) => (
          <div key={g.id} className="contents">
            {(expandedGroups.length > 0 || idx > 0) && <span className="ribbon-sep" />}
            <CollapsedGroupButton group={g} />
          </div>
        ))}
        {overflowGroups.length > 0 && (
          <>
            {(expandedGroups.length > 0 || collapsedGroups.length > 0) && <span className="ribbon-sep" />}
            <OverflowGroupsButton groups={overflowGroups} />
          </>
        )}
      </div>
    </div>
  )
}

function CollapsedGroupButton({ group }: { group: RibbonGroupDef }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 240)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="rb-drop flex items-center" ref={wrapRef}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className={cn('rb-big rb-collapsed-group', open && 'active')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title={group.label}
        aria-expanded={open}
      >
        <span className="rb-big-icon">
          <ChevronDown className="size-4" />
        </span>
        <span className="rb-big-label">{group.label}</span>
      </button>
      {open && (
        <div
          className="ribbon-group-pop"
          style={popoverStyle(pos)}
          role="region"
          aria-label={group.label}
        >
          <div className="ribbon-group-pop__title">{group.label}</div>
          <div className="ribbon-group-pop__body">{group.render()}</div>
        </div>
      )}
    </div>
  )
}

function OverflowGroupsButton({ groups }: { groups: RibbonGroupDef[] }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 280)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="rb-drop flex items-center" ref={wrapRef}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className={cn('rb-big rb-collapsed-group', open && 'active')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title="Thêm công cụ"
        aria-label="Thêm công cụ"
        aria-expanded={open}
      >
        <span className="rb-big-icon">
          <MoreHorizontal className="size-4" />
        </span>
        <span className="rb-big-label">Thêm</span>
      </button>
      {open && (
        <div
          className="ribbon-group-pop ribbon-group-pop--multi"
          style={popoverStyle(pos)}
          role="region"
          aria-label="Thêm công cụ"
        >
          {groups.map((g) => (
            <div key={g.id} className="ribbon-group-pop__section">
              <div className="ribbon-group-pop__title">{g.label}</div>
              <div className="ribbon-group-pop__body">{g.render()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Phone (< 640px): 1 hàng định dạng nhanh + bottom sheet đầy đủ
 * ------------------------------------------------------------------ */

const PHONE_SHEET_TABS: Array<{ id: string; label: string }> = [
  { id: 'home', label: 'Định dạng' },
  { id: 'insert', label: 'Chèn' },
  { id: 'layout', label: 'Bố cục' },
  { id: 'design', label: 'Thiết kế' },
  { id: 'doc', label: 'Tài liệu' },
]

export function PhoneRibbon({
  fileMenu,
  groupsByTab,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  disabled,
  onOpenNav,
  format,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  penColor,
  onPickColor,
  themeColors,
  onInsertTemplate,
  onIndentDec,
  onIndentInc,
  onAlign,
}: {
  fileMenu: ReactNode
  groupsByTab: Record<string, RibbonGroupDef[]>
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  disabled: boolean
  onOpenNav?: (tab: 'toc' | 'blocks' | 'tools') => void
  format: FormatState
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
  penColor: string
  onPickColor: (c: string) => void
  themeColors: string[]
  onInsertTemplate: (id: string) => void
  onIndentDec: () => void
  onIndentInc: () => void
  onAlign: (a: 'left' | 'center' | 'right' | 'justify') => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [sheetTab, setSheetTab] = useState<string | null>(null)
  const [openPop, setOpenPop] = useState<'color' | 'list' | 'align' | null>(null)

  const colorRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const alignRef = useRef<HTMLDivElement>(null)

  const colorPop = useAnchoredPopover(openPop === 'color', 180)
  const listPop = useAnchoredPopover(openPop === 'list', 196)
  const alignPop = useAnchoredPopover(openPop === 'align', 170)

  useEffect(() => {
    if (!openPop) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        !colorRef.current?.contains(t) &&
        !listRef.current?.contains(t) &&
        !alignRef.current?.contains(t)
      ) {
        setOpenPop(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPop(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openPop])

  const AlignIcon =
    format.align === 'center'
      ? AlignCenter
      : format.align === 'right'
        ? AlignRight
        : format.align === 'justify'
          ? AlignJustify
          : AlignLeft

  return (
    <>
      {/* Hàng trên: Tệp, Lưu, Hoàn tác, Làm lại | Công cụ, Thêm, Thu gọn */}
      <div className="ribbon-phone-bar">
        <div className="ribbon-phone-bar__left">
          {fileMenu}
          <button
            type="button"
            className="ribbon-phone-btn"
            onClick={onSave}
            title="Lưu đề"
            aria-label="Lưu đề"
          >
            <IconSave size={18} />
          </button>
          <button
            type="button"
            className="ribbon-phone-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onUndo}
            disabled={disabled || !canUndo}
            title="Hoàn tác"
            aria-label="Hoàn tác"
          >
            <IconUndo size={18} />
          </button>
          <button
            type="button"
            className="ribbon-phone-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRedo}
            disabled={disabled || !canRedo}
            title="Làm lại"
            aria-label="Làm lại"
          >
            <IconRedo size={18} />
          </button>
        </div>

        <div className="ribbon-phone-bar__right">
          {onOpenNav && (
            <button
              type="button"
              className="ribbon-phone-btn"
              onClick={() => onOpenNav('tools')}
              title="Mục lục, Khối mẫu & Công cụ"
              aria-label="Mục lục, Khối mẫu & Công cụ"
            >
              <Wrench size={17} />
            </button>
          )}
          <button
            type="button"
            className={cn('ribbon-phone-btn', sheetTab !== null && 'active')}
            onClick={() => setSheetTab((s) => (s ? null : 'home'))}
            title="Tất cả công cụ"
            aria-label="Tất cả công cụ"
            aria-expanded={sheetTab !== null}
          >
            <MoreHorizontal size={18} />
          </button>
          <button
            type="button"
            className="ribbon-phone-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Mở thanh định dạng' : 'Thu gọn thanh định dạng'}
            aria-label={collapsed ? 'Mở thanh định dạng' : 'Thu gọn thanh định dạng'}
          >
            {collapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Hàng định dạng nhanh: Đậm, Nghiêng, Gạch chân, Màu chữ, Danh sách, Căn lề, Chèn, Khác */}
      {!collapsed && (
        <div className="ribbon-phone-quick" role="toolbar" aria-label="Định dạng nhanh">
          <button
            type="button"
            className={cn('ribbon-phone-btn', format.bold && 'active')}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleBold}
            title="Đậm"
            aria-label="Đậm"
            aria-pressed={format.bold}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            className={cn('ribbon-phone-btn', format.italic && 'active')}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleItalic}
            title="Nghiêng"
            aria-label="Nghiêng"
            aria-pressed={format.italic}
          >
            <i>I</i>
          </button>
          <button
            type="button"
            className={cn('ribbon-phone-btn', format.underline && 'active')}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleUnderline}
            title="Gạch chân"
            aria-label="Gạch chân"
            aria-pressed={format.underline}
          >
            <u>U</u>
          </button>

          {/* Màu chữ */}
          <div className="rb-color-drop" ref={colorRef}>
            <button
              ref={colorPop.triggerRef as React.RefObject<HTMLButtonElement>}
              type="button"
              className={cn('ribbon-phone-btn', openPop === 'color' && 'active')}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpenPop((p) => (p === 'color' ? null : 'color'))}
              title="Màu chữ"
              aria-label="Màu chữ"
              aria-expanded={openPop === 'color'}
            >
              <span className="rb-color-glyph">
                <IconFontColorA size={16} />
                <span className="rb-color-bar" style={{ background: penColor }} />
              </span>
            </button>
            {openPop === 'color' && (
              <div className="rb-color-menu" style={{ ...popoverStyle(colorPop.pos), width: 'auto', minWidth: 176 }}>
                <div className="rb-color-grid">
                  {themeColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="rb-color-swatch"
                      style={{ background: c }}
                      title={c}
                      onClick={() => {
                        onPickColor(c)
                        setOpenPop(null)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Danh sách */}
          <div className="rb-color-drop" ref={listRef}>
            <button
              ref={listPop.triggerRef as React.RefObject<HTMLButtonElement>}
              type="button"
              className={cn('ribbon-phone-btn', openPop === 'list' && 'active')}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpenPop((p) => (p === 'list' ? null : 'list'))}
              title="Danh sách & Thụt lề"
              aria-label="Danh sách & Thụt lề"
              aria-expanded={openPop === 'list'}
            >
              <IconBullets size={17} />
            </button>
            {openPop === 'list' && (
              <div className="rb-color-menu" style={{ ...popoverStyle(listPop.pos), minWidth: 196 }}>
                <button
                  type="button"
                  className="rb-color-item ribbon-phone-menu-item"
                  onClick={() => { onInsertTemplate('bullets'); setOpenPop(null) }}
                >
                  <IconBullets size={16} /> Gạch đầu dòng
                </button>
                <button
                  type="button"
                  className="rb-color-item ribbon-phone-menu-item"
                  onClick={() => { onInsertTemplate('numbered'); setOpenPop(null) }}
                >
                  <IconNumbered size={16} /> Đánh số
                </button>
                <button
                  type="button"
                  className="rb-color-item ribbon-phone-menu-item"
                  onClick={() => { onInsertTemplate('multilevel'); setOpenPop(null) }}
                >
                  <IconMultilevel size={16} /> Nhiều cấp
                </button>
                <div className="file-menu__sep" role="separator" />
                <button
                  type="button"
                  className="rb-color-item ribbon-phone-menu-item"
                  onClick={() => { onIndentInc(); setOpenPop(null) }}
                >
                  <IconIndentInc size={16} /> Tăng thụt lề
                </button>
                <button
                  type="button"
                  className="rb-color-item ribbon-phone-menu-item"
                  onClick={() => { onIndentDec(); setOpenPop(null) }}
                >
                  <IconIndentDec size={16} /> Giảm thụt lề
                </button>
              </div>
            )}
          </div>

          {/* Căn lề */}
          <div className="rb-color-drop" ref={alignRef}>
            <button
              ref={alignPop.triggerRef as React.RefObject<HTMLButtonElement>}
              type="button"
              className={cn('ribbon-phone-btn', openPop === 'align' && 'active')}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpenPop((p) => (p === 'align' ? null : 'align'))}
              title="Căn lề"
              aria-label="Căn lề"
              aria-expanded={openPop === 'align'}
            >
              <AlignIcon className="size-[17px]" />
            </button>
            {openPop === 'align' && (
              <div className="rb-color-menu" style={{ ...popoverStyle(alignPop.pos), minWidth: 164 }}>
                <button
                  type="button"
                  className={cn('rb-color-item ribbon-phone-menu-item', format.align === 'left' && 'font-semibold text-clay-deep')}
                  onClick={() => { onAlign('left'); setOpenPop(null) }}
                >
                  <AlignLeft className="size-4" /> Căn trái
                </button>
                <button
                  type="button"
                  className={cn('rb-color-item ribbon-phone-menu-item', format.align === 'center' && 'font-semibold text-clay-deep')}
                  onClick={() => { onAlign('center'); setOpenPop(null) }}
                >
                  <AlignCenter className="size-4" /> Căn giữa
                </button>
                <button
                  type="button"
                  className={cn('rb-color-item ribbon-phone-menu-item', format.align === 'right' && 'font-semibold text-clay-deep')}
                  onClick={() => { onAlign('right'); setOpenPop(null) }}
                >
                  <AlignRight className="size-4" /> Căn phải
                </button>
                <button
                  type="button"
                  className={cn('rb-color-item ribbon-phone-menu-item', format.align === 'justify' && 'font-semibold text-clay-deep')}
                  onClick={() => { onAlign('justify'); setOpenPop(null) }}
                >
                  <AlignJustify className="size-4" /> Căn đều
                </button>
              </div>
            )}
          </div>

          <span className="rb-mini-sep" />

          {/* Mở nhanh sheet Chèn */}
          <button
            type="button"
            className="ribbon-phone-btn ribbon-phone-btn--pill"
            onClick={() => setSheetTab('insert')}
            title="Chèn bảng, câu hỏi, công thức…"
            aria-label="Chèn"
          >
            <Plus className="size-4" />
            <span>Chèn</span>
          </button>
        </div>
      )}

      {/* Bottom sheet chứa toàn bộ nhóm của các tab */}
      {sheetTab !== null && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSheetTab(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Công cụ soạn đề"
            className="relative z-10 flex max-h-[82dvh] w-full flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-center pt-2.5 pb-1">
              <div className="h-1 w-10 rounded-full bg-line" />
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
                {PHONE_SHEET_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSheetTab(t.id)}
                    aria-pressed={sheetTab === t.id}
                    className={cn(
                      'min-h-9 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                      sheetTab === t.id
                        ? 'bg-clay-soft text-clay-deep'
                        : 'text-ink-3 hover:bg-paper-2 hover:text-ink',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSheetTab(null)}
                aria-label="Đóng"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-paper-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div
              className="ribbon-phone-sheet-body min-h-0 flex-1 overflow-y-auto p-3 space-y-3"
              onClick={(e) => {
                const target = e.target as HTMLElement
                // tự đóng sheet nếu bấm nút thực thi trực tiếp (trừ dropdown/popover/input)
                const btn = target.closest('button')
                if (
                  btn &&
                  !btn.closest('.rb-drop') &&
                  !btn.closest('.rb-color-drop') &&
                  !btn.classList.contains('rb-dropdown-trigger')
                ) {
                  setSheetTab(null)
                }
              }}
            >
              {(groupsByTab[sheetTab] ?? []).map((g) => (
                <section key={g.id} className="ribbon-phone-sheet-group">
                  <h3 className="ribbon-phone-sheet-group__title">{g.label}</h3>
                  <div className="ribbon-phone-sheet-group__items">{g.render()}</div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
