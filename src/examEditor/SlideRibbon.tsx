import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBullets,
  IconCaret,
  IconChart,
  IconCopy,
  IconCut,
  IconGrowFont,
  IconIndentDec,
  IconIndentInc,
  IconNumbered,
  IconPageSize,
  IconPaste,
  IconPicture,
  IconPosition,
  IconRedo,
  IconSave,
  IconShapes,
  IconShrinkFont,
  IconTable,
  IconTextBox,
  IconTrash,
  IconUndo,
  IconZoomIn,
  IconZoomOut,
  IconArrangeAll,
} from './icons'
import {
  IconAiBeautify,
  IconAiFactCheck,
  IconAiImage,
  IconApplyAll,
  IconEllipse,
  IconFind,
  IconFillColor,
  IconNewSlide,
  IconObjAlignCenterH,
  IconObjAlignLeft,
  IconObjAlignMiddle,
  IconObjAlignRight,
  IconObjAlignTop,
  IconObjAlignBottom,
  IconObjFlipH,
  IconObjFlipV,
  IconPlayCurrent,
  IconPlayFromStart,
  IconRect,
  IconRoundRect,
  IconShapeStyle,
  IconSlideLayout,
  IconTransFade,
  IconTransNone,
  IconTransPush,
  IconTransZoom,
} from './slideIcons'
import { cn } from '@/lib/cn'
import { Dropdown } from './Dropdown'
import { FileMenu } from './FileMenu'
import {
  RibbonBody,
  RibbonButton,
  RibbonGroup,
  RibbonIconButton,
  RibbonTabs,
  type RibbonTabDef,
} from './Layout'
import { useAnchoredPopover, popoverStyle } from './useAnchoredPopover'
import type { Deck, DeckTheme, Slide, SlideElement, SlideElType, SlideTone } from '@/store/docs'
import { DECK_THEMES, normalizeTheme } from '@/lib/slideTheme'
import {
  SLIDE_LAYOUTS,
  defaultTone,
  isLayoutId,
  isTone,
  type SlideLayoutId,
} from '@/lib/slideLayouts'

export type SlideRibbonTab =
  | 'home'
  | 'insert'
  | 'draw'
  | 'design'
  | 'transitions'
  | 'animations'
  | 'slideShow'
  | 'review'
  | 'view'
  | 'shapeFormat'
  | 'pictureFormat'
  | 'tableDesign'
  | 'chartDesign'

export interface SlideRibbonProps {
  deck: Deck
  slide: Slide | null
  slideIndex: number
  selected: SlideElement | null
  activeTab: SlideRibbonTab
  onTabChange: (tab: SlideRibbonTab) => void
  /** menu Tệp: tạo bài giảng mới / nhập tệp / tải xuống */
  onNewDeck?: () => void
  onImportFile?: (file: File) => Promise<void>
  onDownload?: () => void | Promise<void>
  onSave?: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onAddSlide: () => void
  onDuplicateSlide: () => void
  onDeleteSlide: () => void
  onInsert: (element: SlideElement) => void
  onUpdateSelected: (patch: Partial<SlideElement>) => void
  onDeleteSelected: () => void
  onCopySelected: () => void
  onCutSelected: () => void
  onPaste: () => void
  canPaste: boolean
  onArrange: (action: 'front' | 'back' | 'forward' | 'backward') => void
  onAlign: (action: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onFlip: (axis: 'x' | 'y') => void
  onTheme: (theme: DeckTheme) => void
  /** áp bố cục cho slide đang chọn (xác nhận trong SlideEditor) */
  onApplyLayout: (layout: SlideLayoutId) => void
  /** đổi tông nền cho slide đã có layout */
  onTone: (tone: SlideTone) => void
  onTransition: (transition: NonNullable<Slide['transition']>, allSlides: boolean) => void
  onPresent: () => void
  formatPaneOpen: boolean
  onToggleFormatPane: () => void
  aiOpen: boolean
  onToggleAi: () => void
  zoom: number
  onZoom: (zoom: number) => void
}

const TABS: RibbonTabDef[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'insert', label: 'Chèn' },
  { id: 'draw', label: 'Vẽ' },
  { id: 'design', label: 'Thiết kế' },
  { id: 'transitions', label: 'Chuyển tiếp' },
  { id: 'animations', label: 'Hoạt ảnh' },
  { id: 'slideShow', label: 'Trình chiếu' },
  { id: 'review', label: 'Xem lại' },
  { id: 'view', label: 'Xem' },
]

const CONTEXT_LABELS: Record<SlideElType, { id: SlideRibbonTab; label: string } | null> = {
  text: { id: 'shapeFormat', label: 'Định dạng hình' },
  shape: { id: 'shapeFormat', label: 'Định dạng hình' },
  image: { id: 'pictureFormat', label: 'Định dạng ảnh' },
  icon: { id: 'shapeFormat', label: 'Định dạng hình' },
  graphic: { id: 'shapeFormat', label: 'Định dạng đồ hoạ' },
  table: { id: 'tableDesign', label: 'Thiết kế bảng' },
  chart: { id: 'chartDesign', label: 'Thiết kế biểu đồ' },
  formula: null,
}

const TRANSITIONS: Array<{ id: NonNullable<Slide['transition']>; label: string }> = [
  { id: 'none', label: 'Không' },
  { id: 'fade', label: 'Mờ dần' },
  { id: 'slide', label: 'Trượt' },
  { id: 'zoom', label: 'Thu phóng' },
]

const FONT_FAMILIES = ['Be Vietnam Pro', 'Times New Roman', 'Arial', 'Georgia', 'JetBrains Mono Variable']
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 44, 54]
/** 1cqw ≈ 9.6px ở khung 960px, 1pt ≈ 1.333px → 1pt ≈ 0.139cqw */
const PT_TO_CQW = 0.139

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/** Popup neo theo trigger, `position: fixed` để không bị ribbon overflow cắt. */
function Anchored({
  open,
  minWidth,
  trigger,
  children,
}: {
  open: boolean
  minWidth: number
  trigger: ReactNode
  children: ReactNode
}) {
  const { triggerRef, pos } = useAnchoredPopover(open, minWidth)
  return (
    <div className="rb-drop-wrap" ref={triggerRef as React.RefObject<HTMLDivElement>}>
      {trigger}
      {open && (
        <div className="rb-drop-menu slide-ribbon-menu" style={popoverStyle(pos)}>
          {children}
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  active,
  disabled,
  icon,
}: {
  children: ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      className={cn('slide-ribbon-menu-item', active && 'active')}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? <span className="slide-ribbon-menu-icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  )
}

function GalleryItem({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="slide-ribbon-gallery-item"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <span className="slide-ribbon-gallery-glyph">{icon}</span>
      <small>{label}</small>
    </button>
  )
}

/** Mũi tên nhỏ cạnh glyph của nút lớn có menu (giống ảnh GenOffice). */
function Caret() {
  return <span className="slide-ribbon-caret"><IconCaret size={14} /></span>
}

export function SlideRibbon(props: SlideRibbonProps) {
  const {
    deck,
    slide,
    selected,
    activeTab,
    onTabChange,
    onNewDeck,
    onImportFile,
    onDownload,
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onAddSlide,
    onDuplicateSlide,
    onDeleteSlide,
    onInsert,
    onUpdateSelected,
    onDeleteSelected,
    onCopySelected,
    onCutSelected,
    onPaste,
    canPaste,
    onArrange,
    onAlign,
    onFlip,
    onTheme,
    onApplyLayout,
    onTone,
    onTransition,
    onPresent,
    formatPaneOpen,
    onToggleFormatPane,
    aiOpen,
    onToggleAi,
    zoom,
    onZoom,
  } = props

  const [popup, setPopup] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popup) return
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.rb-drop-wrap, .slide-ribbon-menu')) setPopup(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [popup])

  const toggle = (key: string) => setPopup((p) => (p === key ? null : key))
  const close = () => setPopup(null)

  const context = selected ? CONTEXT_LABELS[selected.type] : null
  const tabs = context ? [...TABS, { id: context.id, label: context.label }] : TABS
  const activeContext = context?.id === activeTab
  const isText = selected?.type === 'text'
  const pt = selected?.fontSize ? Math.round(selected.fontSize / PT_TO_CQW) : 18

  const insertShape = (shape: NonNullable<SlideElement['shape']>) => {
    onInsert({ id: uid(), type: 'shape', shape, x: 25, y: 34, w: 50, h: 28, fill: deck.theme.accent })
    close()
  }

  const insertTable = (rows: number, cols: number) => {
    onInsert({
      id: uid(),
      type: 'table',
      x: 10,
      y: 26,
      w: 80,
      h: 42,
      rows: Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')),
    })
    close()
  }

  const insertChart = (type: 'bar' | 'line' | 'pie') => {
    onInsert({
      id: uid(),
      type: 'chart',
      x: 12,
      y: 24,
      w: 76,
      h: 46,
      chart: { type, data: [{ label: 'A', value: 12 }, { label: 'B', value: 20 }, { label: 'C', value: 9 }] },
    })
    close()
  }

  const alignMenu = (
    <>
      <MenuItem icon={<IconAlignLeft size={16} />} onClick={() => { if (isText) onUpdateSelected({ align: 'left' }); else onAlign('left'); close() }}>Căn trái</MenuItem>
      <MenuItem icon={<IconAlignCenter size={16} />} onClick={() => { if (isText) onUpdateSelected({ align: 'center' }); else onAlign('center'); close() }}>Căn giữa</MenuItem>
      <MenuItem icon={<IconAlignRight size={16} />} onClick={() => { if (isText) onUpdateSelected({ align: 'right' }); else onAlign('right'); close() }}>Căn phải</MenuItem>
      <MenuItem icon={<IconAlignJustify size={16} />} disabled={!isText} onClick={() => { onUpdateSelected({ align: 'left' }); close() }}>Căn đều</MenuItem>
      <div className="slide-ribbon-menu-sep" />
      <MenuItem icon={<IconObjAlignLeft size={16} />} onClick={() => { onAlign('left'); close() }}>Căn trái slide</MenuItem>
      <MenuItem icon={<IconObjAlignCenterH size={16} />} onClick={() => { onAlign('center'); close() }}>Căn giữa slide</MenuItem>
      <MenuItem icon={<IconObjAlignRight size={16} />} onClick={() => { onAlign('right'); close() }}>Căn phải slide</MenuItem>
      <div className="slide-ribbon-menu-sep" />
      <MenuItem icon={<IconObjAlignTop size={16} />} onClick={() => { onAlign('top'); close() }}>Căn trên slide</MenuItem>
      <MenuItem icon={<IconObjAlignMiddle size={16} />} onClick={() => { onAlign('middle'); close() }}>Căn giữa slide</MenuItem>
      <MenuItem icon={<IconObjAlignBottom size={16} />} onClick={() => { onAlign('bottom'); close() }}>Căn dưới slide</MenuItem>
    </>
  )

  const renderHome = () => (
    <>
      <RibbonGroup label="Bảng tạm">
        <Anchored
          open={popup === 'paste'}
          minWidth={180}
          trigger={<RibbonButton icon={<><IconPaste size={28} /><Caret /></>} label="Dán" onClick={() => toggle('paste')} disabled={!canPaste} active={popup === 'paste'} />}
        >
          <MenuItem icon={<IconCopy size={16} />} onClick={() => { onPaste(); close() }}>Dán</MenuItem>
        </Anchored>
        <div className="rb-col rb-col--icons">
          <RibbonIconButton icon={<IconCut size={16} />} title="Cắt" onClick={onCutSelected} disabled={!selected} />
          <RibbonIconButton icon={<IconCopy size={16} />} title="Sao chép" onClick={onCopySelected} disabled={!selected} />
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Trình chiếu">
        <Anchored
          open={popup === 'show'}
          minWidth={210}
          trigger={<RibbonButton icon={<><IconPlayCurrent size={28} /><Caret /></>} label="Từ slide hiện tại" onClick={() => toggle('show')} active={popup === 'show'} />}
        >
          <MenuItem icon={<IconPlayCurrent size={16} />} onClick={() => { close(); onPresent() }}>Từ slide hiện tại</MenuItem>
        </Anchored>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Slide">
        <Anchored
          open={popup === 'slide'}
          minWidth={200}
          trigger={<RibbonButton icon={<><IconNewSlide size={28} /><Caret /></>} label="Slide mới" onClick={() => toggle('slide')} active={popup === 'slide'} />}
        >
          <MenuItem icon={<IconNewSlide size={16} />} onClick={() => { onAddSlide(); close() }}>Slide mới</MenuItem>
          <MenuItem icon={<IconSlideLayout size={16} />} onClick={() => { onDuplicateSlide(); close() }}>Nhân bản slide</MenuItem>
          <MenuItem icon={<IconTrash size={16} />} disabled={!slide} onClick={() => { onDeleteSlide(); close() }}>Xóa slide</MenuItem>
        </Anchored>
        <div className="rb-col rb-col--icons">
          <RibbonIconButton icon={<IconSlideLayout size={16} />} title="Nhân bản slide" onClick={onDuplicateSlide} disabled={!slide} />
          <RibbonIconButton icon={<IconTrash size={16} />} title="Xóa slide" onClick={onDeleteSlide} disabled={!slide} />
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Phông chữ">
        <div className="rb-font-group">
          <div className="rb-row">
            <Dropdown
              width={132}
              ariaLabel="Phông chữ"
              value={
                selected?.fontFamily ??
                (selected && selected.variant !== 'body' ? deck.theme.fontHeading : deck.theme.fontBody)
              }
              disabled={!isText}
              options={FONT_FAMILIES.map((f) => ({
                value: f,
                label: f,
                render: <span style={{ fontFamily: f }}>{f}</span>,
              }))}
              onPick={(fontFamily) => onUpdateSelected({ fontFamily })}
            />
            <Dropdown
              width={58}
              ariaLabel="Cỡ chữ"
              value={String(pt)}
              disabled={!isText}
              options={FONT_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
              onPick={(size) => onUpdateSelected({ fontSize: Number(size) * PT_TO_CQW })}
            />
            <button type="button" className="rb-icon" title="Tăng cỡ chữ" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontSize: (pt + 2) * PT_TO_CQW })} disabled={!isText}><IconGrowFont size={18} /></button>
            <button type="button" className="rb-icon" title="Giảm cỡ chữ" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontSize: Math.max(8, pt - 2) * PT_TO_CQW })} disabled={!isText}><IconShrinkFont size={18} /></button>
          </div>
          <div className="rb-row">
            <button type="button" className="rb-icon" title="Đậm" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontWeight: selected?.fontWeight === 700 ? 400 : 700 })} disabled={!isText}><b>B</b></button>
            <button type="button" className="rb-icon" title="Nghiêng" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontStyle: selected?.fontStyle === 'italic' ? 'normal' : 'italic' })} disabled={!isText}><i>I</i></button>
            <button type="button" className="rb-icon" title="Gạch chân" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ textDecoration: selected?.textDecoration === 'underline' ? 'none' : 'underline' })} disabled={!isText}><u>U</u></button>
            <button type="button" className="rb-icon" title="Chỉ số trên" disabled>x²</button>
            <button type="button" className="rb-icon" title="Chỉ số dưới" disabled>x₂</button>
            <button
              type="button"
              className="rb-icon slide-ribbon-color-btn"
              title="Màu chữ"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onUpdateSelected({ textColor: selected?.textColor === deck.theme.accent ? deck.theme.fg : deck.theme.accent })}
              disabled={!isText}
            >
              <span className="slide-ribbon-A">A</span>
              <span className="rb-color-bar" style={{ background: selected?.textColor ?? deck.theme.accent }} />
            </button>
          </div>
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Đoạn văn">
        <Anchored
          open={popup === 'align'}
          minWidth={200}
          trigger={
            <RibbonButton
              icon={<><IconAlignLeft size={28} /><Caret /></>}
              label="Đoạn văn"
              onClick={() => toggle('align')}
              active={popup === 'align'}
              disabled={!selected}
            />
          }
        >
          {alignMenu}
        </Anchored>
        <div className="rb-row">
          <RibbonIconButton icon={<IconBullets size={16} />} title="Danh sách" disabled />
          <RibbonIconButton icon={<IconNumbered size={16} />} title="Danh sách số" disabled />
          <RibbonIconButton icon={<IconIndentInc size={16} />} title="Tăng thụt lề" disabled />
          <RibbonIconButton icon={<IconIndentDec size={16} />} title="Giảm thụt lề" disabled />
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Bảng chọn">
        <RibbonButton icon={<IconPosition size={28} />} label="Định dạng" onClick={onToggleFormatPane} active={formatPaneOpen} />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Sắp xếp">
        <Anchored
          open={popup === 'arrange'}
          minWidth={200}
          trigger={
            <RibbonButton
              icon={<><IconAlignCenter size={28} /><Caret /></>}
              label="Căn chỉnh"
              onClick={() => toggle('arrange')}
              active={popup === 'arrange'}
              disabled={!selected}
            />
          }
        >
          <MenuItem onClick={() => { onArrange('front'); close() }}>Đưa lên đầu</MenuItem>
          <MenuItem onClick={() => { onArrange('back'); close() }}>Đưa xuống cuối</MenuItem>
          <MenuItem onClick={() => { onArrange('forward'); close() }}>Đưa lên một lớp</MenuItem>
          <MenuItem onClick={() => { onArrange('backward'); close() }}>Đưa xuống một lớp</MenuItem>
          <div className="slide-ribbon-menu-sep" />
          <MenuItem icon={<IconObjFlipH size={16} />} onClick={() => { onFlip('x'); close() }}>Lật ngang</MenuItem>
          <MenuItem icon={<IconObjFlipV size={16} />} onClick={() => { onFlip('y'); close() }}>Lật dọc</MenuItem>
        </Anchored>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Soạn thảo">
        <RibbonButton icon={<IconFind size={28} />} label="Tìm/Thay thế" disabled title="Chưa hỗ trợ trong trình soạn slide" />
      </RibbonGroup>
      <div className="ribbon-flex-spacer" />
      <RibbonGroup label="Trợ lý AI">
        <RibbonButton icon={<IconAiBeautify size={28} />} label="Làm đẹp" disabled title="Chưa hỗ trợ" />
        {/* hai glyph này vẽ ở 24px để nét 1.5 của file gốc in đúng 1.5px */}
        <RibbonButton icon={<IconAiFactCheck size={24} />} label="Kiểm tra" disabled title="Chưa hỗ trợ" />
        <RibbonButton icon={<IconAiImage size={24} />} label="Ảnh AI" disabled title="Chưa hỗ trợ" />
        <RibbonButton
          icon={<img src="/brand/ai-static.svg" alt="" className="slide-ribbon-ai-mark" />}
          label="Trợ lý AI"
          onClick={onToggleAi}
          active={aiOpen}
        />
      </RibbonGroup>
    </>
  )

  const renderInsert = () => (
    <>
      <RibbonGroup label="Slide">
        <RibbonButton icon={<IconNewSlide size={28} />} label="Slide mới" onClick={onAddSlide} />
        <Anchored
          open={popup === 'layout'}
          minWidth={288}
          trigger={
            <RibbonButton
              icon={<><IconSlideLayout size={28} /><Caret /></>}
              label="Bố cục"
              onClick={() => toggle('layout')}
              active={popup === 'layout'}
              disabled={!slide}
            />
          }
        >
          <div className="slide-ribbon-menu-title">Bố cục slide</div>
          <div className="slide-layout-grid">
            {SLIDE_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                type="button"
                className={cn('slide-layout-card', slide?.layout === layout.id && 'active')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onApplyLayout(layout.id)
                  close()
                }}
                title={layout.description}
                disabled={!slide}
              >
                <span
                  className={cn('slide-layout-thumb', `slide-layout-thumb--${layout.id}`)}
                  aria-hidden
                >
                  <i />
                  <i />
                  <i />
                </span>
                <small>{layout.name}</small>
              </button>
            ))}
          </div>
        </Anchored>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Bảng">
        <Anchored
          open={popup === 'table'}
          minWidth={230}
          trigger={<RibbonButton icon={<><IconTable size={28} /><Caret /></>} label="Bảng" onClick={() => toggle('table')} active={popup === 'table'} />}
        >
          <div className="slide-ribbon-menu-title">Chọn kích thước bảng</div>
          <div className="slide-ribbon-table-grid" onMouseLeave={() => undefined}>
            {Array.from({ length: 40 }, (_, i) => {
              const row = Math.floor(i / 8) + 1
              const col = (i % 8) + 1
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`${row} hàng ${col} cột`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertTable(row, col)}
                />
              )
            })}
          </div>
        </Anchored>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Hình ảnh">
        <RibbonButton
          icon={<IconPicture size={28} />}
          label="Hình ảnh"
          onClick={() => onInsert({ id: uid(), type: 'image', x: 25, y: 26, w: 50, h: 38 })}
        />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Minh họa">
        <Anchored
          open={popup === 'shape'}
          minWidth={250}
          trigger={<RibbonButton icon={<><IconShapes size={28} /><Caret /></>} label="Hình dạng" onClick={() => toggle('shape')} active={popup === 'shape'} />}
        >
          <div className="slide-ribbon-gallery">
            <GalleryItem label="Chữ nhật" icon={<IconRect size={22} />} onClick={() => insertShape('rect')} />
            <GalleryItem label="Bo góc" icon={<IconRoundRect size={22} />} onClick={() => insertShape('round')} />
            <GalleryItem label="Hình tròn" icon={<IconEllipse size={22} />} onClick={() => insertShape('ellipse')} />
            <GalleryItem label="Tam giác" icon={<span className="slide-ribbon-triangle">▲</span>} onClick={() => insertShape('triangle')} />
            <GalleryItem label="Mũi tên" icon={<span className="slide-ribbon-triangle">↗</span>} onClick={() => insertShape('arrow')} />
          </div>
        </Anchored>
        <Anchored
          open={popup === 'chart'}
          minWidth={190}
          trigger={<RibbonButton icon={<><IconChart size={28} /><Caret /></>} label="Biểu đồ" onClick={() => toggle('chart')} active={popup === 'chart'} />}
        >
          <MenuItem onClick={() => insertChart('bar')}>Biểu đồ cột</MenuItem>
          <MenuItem onClick={() => insertChart('line')}>Biểu đồ đường</MenuItem>
          <MenuItem onClick={() => insertChart('pie')}>Biểu đồ tròn</MenuItem>
        </Anchored>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Văn bản">
        <RibbonButton
          icon={<IconTextBox size={28} />}
          label="Hộp văn bản"
          onClick={() => onInsert({ id: uid(), type: 'text', x: 10, y: 36, w: 80, h: 18, text: 'Nhập văn bản', variant: 'body' })}
        />
      </RibbonGroup>
    </>
  )

  const renderDesign = () => {
    const activeThemeId = normalizeTheme(deck.theme).id
    const activeTone = slide
      ? isTone(slide.tone)
        ? slide.tone
        : defaultTone(slide.layout ?? 'bullets')
      : 'theme'
    const toneEnabled = Boolean(slide?.layout && isLayoutId(slide.layout))
    return (
    <>
      <RibbonGroup label="Chủ đề">
        <div className="slide-ribbon-theme-grid">
          {DECK_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={cn('slide-ribbon-theme-card', activeThemeId === theme.id && 'active')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onTheme(theme)}
              title={theme.name}
            >
              <span
                className="slide-ribbon-theme-preview"
                style={{ background: theme.bg, color: theme.fg, fontFamily: theme.fonts?.heading }}
              >
                <b>Aa</b>
                <span className="slide-ribbon-theme-bars">
                  <i style={{ background: theme.accent }} />
                  <i style={{ background: theme.secondary ?? theme.accent }} />
                </span>
              </span>
              <small>{theme.name}</small>
            </button>
          ))}
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Tông nền">
        {(
          [
            ['theme', 'Theo theme', deck.theme.bg],
            ['soft', 'Dịu', deck.theme.surface ?? deck.theme.bg],
            ['accent', 'Nhấn', deck.theme.accent],
          ] as const
        ).map(([tone, label, color]) => (
          <RibbonIconButton
            key={tone}
            icon={
              <span
                className="slide-ribbon-tone-dot"
                style={{ background: color, borderColor: deck.theme.fg }}
              />
            }
            title={toneEnabled ? label : `${label} (áp bố cục trước)`}
            onClick={() => onTone(tone)}
            active={activeTone === tone}
            disabled={!toneEnabled}
          />
        ))}
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Kích thước">
        <RibbonButton icon={<IconPageSize size={28} />} label="Cỡ slide" disabled title="Chưa hỗ trợ" />
      </RibbonGroup>
    </>
    )
  }

  const renderTransitions = () => (
    <>
      <RibbonGroup label="Chuyển tiếp cho slide này">
        {TRANSITIONS.map((transition) => (
          <RibbonButton
            key={transition.id}
            icon={
              transition.id === 'fade' ? <IconTransFade size={28} />
                : transition.id === 'slide' ? <IconTransPush size={28} />
                  : transition.id === 'zoom' ? <IconTransZoom size={28} />
                    : <IconTransNone size={28} />
            }
            label={transition.label}
            onClick={() => onTransition(transition.id, false)}
            active={(slide?.transition ?? 'none') === transition.id}
          />
        ))}
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Thời gian">
        <RibbonButton icon={<IconApplyAll size={28} />} label="Áp dụng tất cả" onClick={() => onTransition(slide?.transition ?? 'none', true)} disabled={!slide} />
      </RibbonGroup>
    </>
  )

  const renderSlideShow = () => (
    <RibbonGroup label="Bắt đầu trình chiếu">
      <RibbonButton icon={<IconPlayCurrent size={28} />} label="Từ slide hiện tại" onClick={onPresent} />
      <RibbonButton icon={<IconPlayFromStart size={28} />} label="Từ đầu" onClick={onPresent} />
    </RibbonGroup>
  )

  const renderView = () => (
    <>
      <RibbonGroup label="Hiển thị">
        <RibbonButton icon={<IconZoomOut size={28} />} label="Thu nhỏ" onClick={() => onZoom(Math.max(40, zoom - 10))} disabled={zoom <= 40} />
        <RibbonButton icon={<IconZoomIn size={28} />} label="Phóng to" onClick={() => onZoom(Math.min(160, zoom + 10))} disabled={zoom >= 160} />
        <RibbonButton icon={<span className="slide-ribbon-zoom-glyph">1:1</span>} label={`${zoom}%`} onClick={() => onZoom(100)} />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Ngăn">
        <RibbonButton icon={<IconPosition size={28} />} label="Bảng chọn" onClick={onToggleFormatPane} active={formatPaneOpen} />
        <RibbonButton icon={<img src="/brand/ai-static.svg" alt="" className="slide-ribbon-ai-mark" />} label="Trợ lý AI" onClick={onToggleAi} active={aiOpen} />
        <RibbonButton icon={<IconArrangeAll size={28} />} label="Ảnh thu nhỏ" disabled />
      </RibbonGroup>
    </>
  )

  const renderContext = () => (
    <>
      <RibbonGroup label="Kiểu hình">
        <RibbonButton
          icon={<IconFillColor size={28} />}
          label="Màu tô"
          onClick={() => onUpdateSelected({ fill: selected?.fill === deck.theme.accent ? '#ffffff' : deck.theme.accent })}
          disabled={!selected || selected.type === 'image'}
        />
        <RibbonButton icon={<IconShapeStyle size={28} />} label="Viền" disabled />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Sắp xếp">
        <RibbonButton icon={<IconAlignCenter size={28} />} label="Căn giữa slide" onClick={() => onAlign('middle')} disabled={!selected} />
        <RibbonButton icon={<IconObjFlipH size={28} />} label="Lật ngang" onClick={() => onFlip('x')} disabled={!selected} />
        <RibbonButton icon={<IconObjFlipV size={28} />} label="Lật dọc" onClick={() => onFlip('y')} disabled={!selected} />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Đối tượng">
        <RibbonButton icon={<IconTrash size={28} />} label="Xóa" onClick={onDeleteSelected} disabled={!selected} />
      </RibbonGroup>
    </>
  )

  const body = activeContext
    ? renderContext()
    : activeTab === 'home'
      ? renderHome()
      : activeTab === 'insert'
        ? renderInsert()
        : activeTab === 'design'
          ? renderDesign()
          : activeTab === 'transitions'
            ? renderTransitions()
            : activeTab === 'slideShow'
              ? renderSlideShow()
              : activeTab === 'view'
                ? renderView()
                : (
                  <RibbonGroup label="Chưa hỗ trợ">
                    <RibbonButton icon={<IconSlideLayout size={28} />} label="Chưa hỗ trợ" disabled />
                  </RibbonGroup>
                )

  return (
    <div className="ribbon slide-ribbon" ref={rootRef}>
      <RibbonTabs
        tabs={tabs}
        active={activeTab}
        onChange={(id) => onTabChange(id as SlideRibbonTab)}
        leading={
          <>
            {onNewDeck && onImportFile ? (
              <FileMenu
                kind="slide"
                onNew={onNewDeck}
                onImport={onImportFile}
                onDownload={onDownload ?? (() => {})}
                downloadHint=".pptx"
              />
            ) : null}
            <span className="qa-sep" aria-hidden="true" />
            {onSave && (
              <button type="button" className="qa-btn" title="Lưu" aria-label="Lưu" onClick={onSave}>
                <IconSave size={16} />
              </button>
            )}
            <button type="button" className="qa-btn" title="Hoàn tác" aria-label="Hoàn tác" onMouseDown={(e) => e.preventDefault()} onClick={onUndo} disabled={!canUndo}>
              <IconUndo size={16} />
            </button>
            <button type="button" className="qa-btn" title="Làm lại" aria-label="Làm lại" onMouseDown={(e) => e.preventDefault()} onClick={onRedo} disabled={!canRedo}>
              <IconRedo size={16} />
            </button>
            <span className="qa-sep" aria-hidden="true" />
          </>
        }
      />
      <RibbonBody activeKey={activeTab}>{body}</RibbonBody>
    </div>
  )
}
