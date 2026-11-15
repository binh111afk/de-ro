import { Children, Fragment, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  BringToFront,
  ChevronDown,
  Grid3x3,
  List,
  ListOrdered,
  Magnet,
  MoreHorizontal,
  Palette,
  SendToBack,
  Sigma,
  Smile,
  UnfoldVertical,
  X,
} from 'lucide-react'
import { useAnimatedPresence } from '@/lib/useAnimatedPresence'
import { useSlideViewport } from './useSlideViewport'
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBorderAll,
  IconCaret,
  IconChart,
  IconClearFormat,
  IconCopy,
  IconCut,
  IconFooter,
  IconFormatPainter,
  IconGrowFont,
  IconHighlight,
  IconLink,
  IconPaste,
  IconPicture,
  IconPosition,
  IconRedo,
  IconSave,
  IconShapes,
  IconShrinkFont,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconSymbol,
  IconTable,
  IconTextBox,
  IconTrash,
  IconUndo,
  IconZoomIn,
  IconZoomOut,
} from './icons'
import {
  IconApplyAll,
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
  IconSlideLayout,
  IconTransFade,
  IconTransNone,
  IconTransPush,
  IconTransZoom,
} from './slideIcons'
import { cn } from '@/lib/cn'
import { Dropdown } from './Dropdown'
import { FileMenu } from './FileMenu'
import { BackgroundMenu } from './BackgroundMenu'
import { ShapeGallery } from './ShapeGallery'
import { defaultBox, shapeNameOf } from '@/lib/slidePresets'
import { ColorPalette } from './ColorPalette'
import {
  RibbonBody,
  RibbonButton,
  RibbonGroup,
  RibbonIconButton,
  RibbonTabs,
  type RibbonTabDef,
} from './Layout'
import { useAnchoredPopover, popoverStyle } from './useAnchoredPopover'
import type { Deck, DeckFooter, Slide, SlideElement, SlideElType, SlideTone } from '@/store/docs'
import {
  SLIDE_SYMBOLS,
  UNICODE_SUBSCRIPTS,
  UNICODE_SUPERSCRIPTS,
  clearTextFormatting,
  normalizeSlideHref,
} from '@/lib/slideFormat'
import { graphicMainColor } from '@/lib/slideGraphics'
import { ANIM_EFFECTS, ANIM_SPEEDS, startOf, type ElementAnimAction } from '@/lib/slideAnim'
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
  | 'design'
  | 'transitions'
  | 'animations'
  | 'slideShow'
  | 'view'
  | 'elementFormat'
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
  /** mở panel trái ở Mẫu → Bộ màu */
  onOpenDesigns: () => void
  /** mở panel trái ở tab Icon */
  onOpenIcons: () => void
  /** đường gióng + hít khi kéo đối tượng */
  snapOn: boolean
  onToggleSnap: () => void
  /** lưới căn chỉnh trên khung slide */
  gridOn: boolean
  onToggleGrid: () => void
  /** áp bố cục cho slide đang chọn (xác nhận trong SlideEditor) */
  onApplyLayout: (layout: SlideLayoutId) => void
  /** đổi tông nền cho slide đã có layout */
  onTone: (tone: SlideTone) => void
  onTransition: (transition: NonNullable<Slide['transition']>, allSlides: boolean) => void
  /** hiệu ứng bấm-chuột-rồi-hiện: tự thêm theo bố cục hoặc xoá, cho slide này hoặc cả bài */
  onAnimate: (mode: 'auto' | 'clear', allSlides: boolean) => void
  /** hiệu ứng cho đối tượng đang chọn: chọn kiểu, bỏ, đổi thứ tự, hiện từng dòng, tốc độ */
  onElementAnim: (action: ElementAnimAction) => void
  /** tô nền slide (màu/gradient CSS) cho slide này hoặc cả bài; `null` = theo bộ màu */
  onBackground: (background: string | null, allSlides: boolean, image?: string) => void
  onPresent: () => void
  onPresentFromStart: () => void
  /** xuất PDF bằng hộp thoại in của trình duyệt */
  onExportPdf: () => void
  formatPaneOpen: boolean
  onToggleFormatPane: () => void
  /** chế độ sao chép định dạng chữ (off / once / lock) */
  painterMode: 'off' | 'once' | 'lock'
  onTogglePainter: (lock?: boolean) => void
  /** cập nhật cấu hình số trang và chân trang của toàn deck */
  onUpdateFooter: (footer: DeckFooter) => void
  aiOpen: boolean
  onToggleAi: () => void
  zoom: number
  onZoom: (zoom: number) => void
}

const TABS: RibbonTabDef[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'insert', label: 'Chèn' },
  { id: 'design', label: 'Thiết kế' },
  { id: 'transitions', label: 'Chuyển tiếp' },
  { id: 'animations', label: 'Hoạt ảnh' },
  { id: 'slideShow', label: 'Trình chiếu' },
  { id: 'view', label: 'Xem' },
]

const CONTEXT_LABELS: Record<SlideElType, { id: SlideRibbonTab; label: string } | null> = {
  // chữ không có tab này (chỉnh ở Trang chủ); hình, icon, đồ hoạ và đường nối dùng chung tab Thành phần
  text: null,
  shape: { id: 'elementFormat', label: 'Thành phần' },
  image: { id: 'pictureFormat', label: 'Định dạng ảnh' },
  icon: { id: 'elementFormat', label: 'Thành phần' },
  graphic: { id: 'elementFormat', label: 'Thành phần' },
  connector: { id: 'elementFormat', label: 'Thành phần' },
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
  const anim = useAnimatedPresence(open, 140)
  return (
    <div className="rb-drop-wrap" ref={triggerRef as React.RefObject<HTMLDivElement>}>
      {trigger}
      {anim.mounted && (
        <div className={cn('rb-drop-menu slide-ribbon-menu', anim.closing ? 'pop-out' : 'pop-in')} style={popoverStyle(pos)}>
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

/** Mũi tên nhỏ cạnh glyph của nút lớn có menu (giống ảnh GenOffice). */
function Caret() {
  return <span className="slide-ribbon-caret"><IconCaret size={14} /></span>
}

/** mẫu công thức chèn nhanh (KaTeX; \ce cho hoá học) */
const FORMULA_PRESETS: Array<[string, string]> = [
  ['Phân số', '\\frac{a}{b}'],
  ['Căn bậc hai', '\\sqrt{x}'],
  ['Luỹ thừa', 'x^{2}'],
  ['Chỉ số dưới', 'x_{1}'],
  ['Nghiệm bậc hai', 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'],
  ['Hệ phương trình', '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}'],
  ['Tích phân', '\\int_{a}^{b} f(x)\\,dx'],
  ['Giới hạn', '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1'],
  ['Tổng', '\\sum_{i=1}^{n} i'],
  ['Phương trình hoá học', '\\ce{2H2 + O2 -> 2H2O}'],
]

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
    onOpenDesigns,
    onOpenIcons,
    snapOn,
    onToggleSnap,
    gridOn,
    onToggleGrid,
    onApplyLayout,
    onTone,
    onTransition,
    onAnimate,
    onElementAnim,
    onBackground,
    onPresent,
    onPresentFromStart,
    onExportPdf,
    formatPaneOpen,
    onToggleFormatPane,
    painterMode,
    onTogglePainter,
    onUpdateFooter,
    aiOpen,
    onToggleAi,
    zoom,
    onZoom,
  } = props

  const [popup, setPopup] = useState<string | null>(null)
  const [hrefInput, setHrefInput] = useState('')
  const [hrefError, setHrefError] = useState<string | null>(null)
  const [footerDraft, setFooterDraft] = useState(deck.footer?.text ?? '')
  const [phoneSheetOpen, setPhoneSheetOpen] = useState(false)
  const phoneSheetAnim = useAnimatedPresence(phoneSheetOpen, 180)
  const [phoneInsertSub, setPhoneInsertSub] = useState<'menu' | 'shape' | 'layout'>('menu')
  const [visibleGroups, setVisibleGroups] = useState<number | null>(null)
  const [visibleTabs, setVisibleTabs] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const tabsWrapRef = useRef<HTMLDivElement>(null)
  const { isPhone, isTablet } = useSlideViewport()

  useEffect(() => {
    if (deck.footer?.text !== undefined) setFooterDraft(deck.footer.text)
  }, [deck.id, deck.footer?.text])

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

  const activeSlideTextarea = (): HTMLTextAreaElement | null => {
    const ae = document.activeElement
    return ae instanceof HTMLTextAreaElement && ae.closest('.slide-frame') && !ae.readOnly ? ae : null
  }

  const insertAtCursor = (snippet: string, wrapWith?: [string, string]): boolean => {
    const ta = activeSlideTextarea()
    if (!ta || !selected || selected.type !== 'text') return false
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    const val = ta.value
    if (wrapWith) {
      if (start === end) return false
      const inner = val.slice(start, end)
      const inserted = `${wrapWith[0]}${inner}${wrapWith[1]}`
      const next = `${val.slice(0, start)}${inserted}${val.slice(end)}`
      onUpdateSelected({ text: next })
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(start, start + inserted.length)
      })
      return true
    }
    const next = `${val.slice(0, start)}${snippet}${val.slice(end)}`
    onUpdateSelected({ text: next })
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + snippet.length, start + snippet.length)
    })
    return true
  }

  const insertScriptChar = (ch: string) => {
    if (!selected || selected.type !== 'text') return
    if (!insertAtCursor(ch)) onUpdateSelected({ text: `${selected.text ?? ''}${ch}` })
    close()
  }

  const insertSymbolChar = (ch: string) => {
    if (!insertAtCursor(ch)) {
      onInsert({
        id: uid(),
        type: 'text',
        x: 40,
        y: 42,
        w: 20,
        h: 12,
        text: ch,
        variant: 'body',
        fontSize: 4,
        align: 'center',
      })
    }
    close()
  }

  /** bật/tắt danh sách cho hộp chữ: mọi dòng đã có đúng kiểu thì gỡ, ngược lại gắn (thay kiểu cũ) */
  const listKind = (text: string): 'bullet' | 'number' | null => {
    const lines = text.split('\n').filter((l) => l.trim())
    if (!lines.length) return null
    if (lines.every((l) => /^•\s/.test(l))) return 'bullet'
    if (lines.every((l) => /^\d+[.)]\s/.test(l))) return 'number'
    return null
  }
  const toggleList = (kind: 'bullet' | 'number') => {
    const text = selected?.text ?? ''
    const off = listKind(text) === kind
    let n = 0
    const next = text
      .split('\n')
      .map((line) => {
        const bare = line.replace(/^(•\s*|\d+[.)]\s*)/, '')
        if (off || !bare.trim()) return bare
        n++
        return kind === 'bullet' ? `• ${bare}` : `${n}. ${bare}`
      })
      .join('\n')
    onUpdateSelected({ text: next })
  }

  const context = selected ? CONTEXT_LABELS[selected.type] : null
  const tabs = context ? [...TABS, { id: context.id, label: context.label }] : TABS
  const activeContext = context?.id === activeTab
  const isText = selected?.type === 'text'
  const pt = selected?.fontSize ? Math.round(selected.fontSize / PT_TO_CQW) : 18

  const insertShape = (shape: NonNullable<SlideElement['shape']>) => {
    // sao/tim vuông vức hơn các hình khác: hộp 16:9 làm méo
    const square = shape === 'star' || shape === 'heart'
    onInsert({ id: uid(), type: 'shape', shape, ...(square ? { x: 38, y: 28, w: 24, h: 42.7 } : { x: 25, y: 34, w: 50, h: 28 }), fill: deck.theme.accent })
    close()
  }

  /** chèn một hình của thư viện: 7 hình cũ và đường thẳng giữ cách chèn riêng, hình khác lưu thẳng tên prst */
  const insertPreset = (prst: string) => {
    if (prst === 'line') return insertLine('none')
    if (prst === 'lineArrow') return insertLine('end')
    if (prst === 'lineArrowDouble') return insertLine('both')
    const shape = shapeNameOf(prst)
    if (shape !== prst || ['rect', 'ellipse', 'triangle', 'heart'].includes(prst)) return insertShape(shape)
    const box = defaultBox(prst)
    onInsert({ id: uid(), type: 'shape', shape, x: (100 - box.w) / 2, y: (100 - box.h) / 2, ...box, fill: deck.theme.accent })
    close()
  }

  /** đường thẳng (có thể có đầu mũi tên); hộp cao đủ chứa đầu mũi tên, đường chạy giữa hộp */
  const insertLine = (lineArrow: 'none' | 'end' | 'both') => {
    onInsert({ id: uid(), type: 'shape', shape: 'line', x: 20, y: 47.5, w: 60, h: 5, fill: deck.theme.accent, border: 4, lineArrow })
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

  const insertFormula = (tex: string) =>
    onInsert({ id: uid(), type: 'text', x: 30, y: 58, w: 40, h: 16, text: `$${tex}$`, variant: 'body', fontSize: 4, align: 'center' })

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

  const renderHome = () => (
    <>
      <RibbonGroup label="Bảng tạm">
        <RibbonButton icon={<IconPaste size={28} />} label="Dán" onClick={onPaste} disabled={!canPaste} />
        <div className="rb-col rb-col--icons">
          <RibbonIconButton icon={<IconCut size={16} />} title="Cắt" onClick={onCutSelected} disabled={!selected} />
          <RibbonIconButton icon={<IconCopy size={16} />} title="Sao chép" onClick={onCopySelected} disabled={!selected} />
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
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
                data-tip={layout.description}
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
        <div className="rb-col rb-col--icons">
          <RibbonIconButton icon={<IconCopy size={16} />} title="Nhân bản slide" onClick={onDuplicateSlide} disabled={!slide} />
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
            <button type="button" className="rb-icon" data-tip="Tăng cỡ chữ" aria-label="Tăng cỡ chữ" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontSize: (pt + 2) * PT_TO_CQW })} disabled={!isText}><IconGrowFont size={18} /></button>
            <button type="button" className="rb-icon" data-tip="Giảm cỡ chữ" aria-label="Giảm cỡ chữ" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontSize: Math.max(8, pt - 2) * PT_TO_CQW })} disabled={!isText}><IconShrinkFont size={18} /></button>
          </div>
          <div className="rb-row">
            <button type="button" className="rb-icon" data-tip="Đậm" aria-label="Đậm" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontWeight: selected?.fontWeight === 700 ? 400 : 700 })} disabled={!isText}><b>B</b></button>
            <button type="button" className="rb-icon" data-tip="Nghiêng" aria-label="Nghiêng" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ fontStyle: selected?.fontStyle === 'italic' ? 'normal' : 'italic' })} disabled={!isText}><i>I</i></button>
            <button type="button" className="rb-icon" data-tip="Gạch chân" aria-label="Gạch chân" onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdateSelected({ textDecoration: selected?.textDecoration === 'underline' ? 'none' : 'underline' })} disabled={!isText}><u>U</u></button>
            <button
              type="button"
              className={cn('rb-icon', selected?.textDecoration === 'line-through' && 'active')}
              data-tip="Gạch ngang"
              aria-label="Gạch ngang"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onUpdateSelected({ textDecoration: selected?.textDecoration === 'line-through' ? 'none' : 'line-through' })}
              disabled={!isText}
            >
              <IconStrikethrough size={16} />
            </button>
            <Anchored
              open={popup === 'highlight'}
              minWidth={190}
              trigger={
                <button
                  type="button"
                  className={cn('rb-icon slide-ribbon-color-btn', selected?.highlight && 'active')}
                  data-tip="Tô sáng chữ"
                  aria-label="Tô sáng chữ"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle('highlight')}
                  disabled={!isText}
                >
                  <IconHighlight size={16} />
                  <span className="rb-color-bar" style={{ background: selected?.highlight ?? 'transparent' }} />
                </button>
              }
            >
              <ColorPalette
                value={selected?.highlight ?? '#fef08a'}
                themeColors={[deck.theme.accent, '#fef08a']}
                onPick={(highlight) => {
                  onUpdateSelected({ highlight })
                  close()
                }}
              />
              <div className="slide-ribbon-menu-sep" />
              <MenuItem
                onClick={() => {
                  onUpdateSelected({ highlight: undefined })
                  close()
                }}
              >
                Không tô
              </MenuItem>
            </Anchored>
            <Anchored
              open={popup === 'sup'}
              minWidth={136}
              trigger={
                <button
                  type="button"
                  className={cn('rb-icon', popup === 'sup' && 'active')}
                  data-tip="Chỉ số trên (bôi chữ để bọc $x^{a}$ hoặc chèn ² ³ ⁿ)"
                  aria-label="Chỉ số trên"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (insertAtCursor('', ['$^{', '}$'])) {
                      close()
                      return
                    }
                    toggle('sup')
                  }}
                  disabled={!isText}
                >
                  <IconSuperscript size={16} />
                </button>
              }
            >
              <div className="slide-ribbon-menu-title">Chèn chỉ số trên</div>
              <div className="flex gap-1 px-2 pb-1">
                {UNICODE_SUPERSCRIPTS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className="slide-sym-btn flex-1 border border-line/60 font-medium"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertScriptChar(ch)}
                  >
                    x{ch}
                  </button>
                ))}
              </div>
            </Anchored>
            <Anchored
              open={popup === 'sub'}
              minWidth={136}
              trigger={
                <button
                  type="button"
                  className={cn('rb-icon', popup === 'sub' && 'active')}
                  data-tip="Chỉ số dưới (bôi chữ để bọc $x_{a}$ hoặc chèn ₁ ₂ ₙ)"
                  aria-label="Chỉ số dưới"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (insertAtCursor('', ['$_{', '}$'])) {
                      close()
                      return
                    }
                    toggle('sub')
                  }}
                  disabled={!isText}
                >
                  <IconSubscript size={16} />
                </button>
              }
            >
              <div className="slide-ribbon-menu-title">Chèn chỉ số dưới</div>
              <div className="flex gap-1 px-2 pb-1">
                {UNICODE_SUBSCRIPTS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className="slide-sym-btn flex-1 border border-line/60 font-medium"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertScriptChar(ch)}
                  >
                    x{ch}
                  </button>
                ))}
              </div>
            </Anchored>
            <Anchored
              open={popup === 'textColor'}
              minWidth={190}
              trigger={
                <button
                  type="button"
                  className="rb-icon slide-ribbon-color-btn"
                  data-tip="Màu chữ"
                  aria-label="Màu chữ"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle('textColor')}
                  disabled={!isText}
                >
                  <span className="slide-ribbon-A">A</span>
                  <span className="rb-color-bar" style={{ background: selected?.textColor ?? deck.theme.fg }} />
                </button>
              }
            >
              <ColorPalette
                value={selected?.textColor ?? deck.theme.fg}
                themeColors={[deck.theme.fg, deck.theme.accent]}
                onPick={(textColor) => {
                  onUpdateSelected({ textColor })
                  close()
                }}
              />
            </Anchored>
            <button
              type="button"
              className="rb-icon"
              data-tip="Xoá định dạng"
              aria-label="Xoá định dạng"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selected && onUpdateSelected(clearTextFormatting(selected))}
              disabled={!isText}
            >
              <IconClearFormat size={16} />
            </button>
            <button
              type="button"
              className={cn('rb-icon', painterMode !== 'off' && 'active')}
              data-tip={
                painterMode === 'lock'
                  ? 'Đang khoá sao chép định dạng (bấm hoặc Esc để tắt)'
                  : 'Sao chép định dạng (nhấp đúp để khoá)'
              }
              aria-label="Sao chép định dạng"
              aria-pressed={painterMode !== 'off'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => onTogglePainter(e.detail >= 2)}
              onDoubleClick={() => onTogglePainter(true)}
              disabled={!isText && painterMode === 'off'}
            >
              <IconFormatPainter size={16} />
            </button>
          </div>
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Đoạn văn">
        <div className="rb-row">
          {(
            [
              ['left', 'Căn trái', IconAlignLeft],
              ['center', 'Căn giữa', IconAlignCenter],
              ['right', 'Căn phải', IconAlignRight],
            ] as const
          ).map(([align, label, Icon]) => (
            <RibbonIconButton
              key={align}
              icon={<Icon size={18} />}
              title={label}
              active={isText && (selected?.align ?? 'left') === align}
              onClick={() => onUpdateSelected({ align })}
              disabled={!isText}
            />
          ))}
          <RibbonIconButton
            icon={<AlignVerticalJustifyStart size={17} />}
            title="Chữ sát mép trên hộp"
            active={isText && selected?.valign !== 'middle' && !selected?.fill}
            onClick={() => onUpdateSelected({ valign: 'top' })}
            disabled={!isText || !!selected?.fill}
          />
          <RibbonIconButton
            icon={<AlignVerticalJustifyCenter size={17} />}
            title="Chữ ở giữa hộp (theo chiều dọc)"
            active={isText && (selected?.valign === 'middle' || !!selected?.fill)}
            onClick={() => onUpdateSelected({ valign: 'middle' })}
            disabled={!isText || !!selected?.fill}
          />
        </div>
        <div className="rb-row">
          <RibbonIconButton
            icon={<List size={17} />}
            title="Danh sách gạch đầu dòng"
            active={isText && listKind(selected?.text ?? '') === 'bullet'}
            onClick={() => toggleList('bullet')}
            disabled={!isText}
          />
          <RibbonIconButton
            icon={<ListOrdered size={17} />}
            title="Danh sách đánh số"
            active={isText && listKind(selected?.text ?? '') === 'number'}
            onClick={() => toggleList('number')}
            disabled={!isText}
          />
          <Anchored
            open={popup === 'lineHeight'}
            minWidth={150}
            trigger={
              <RibbonIconButton
                icon={<UnfoldVertical size={17} />}
                title="Giãn dòng"
                onClick={() => toggle('lineHeight')}
                active={popup === 'lineHeight'}
                disabled={!isText}
              />
            }
          >
            <div className="slide-ribbon-menu-title">Giãn dòng</div>
            {[1, 1.15, 1.25, 1.5, 2].map((lh) => (
              <MenuItem key={lh} onClick={() => { onUpdateSelected({ lineHeight: lh }); close() }}>
                {(selected?.lineHeight ?? 1.25) === lh ? '✓ ' : ''}
                {lh.toLocaleString('vi-VN')}
              </MenuItem>
            ))}
          </Anchored>
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
              label="Sắp xếp"
              onClick={() => toggle('arrange')}
              active={popup === 'arrange'}
              disabled={!selected}
            />
          }
        >
          <div className="slide-ribbon-menu-title">Thứ tự lớp</div>
          <MenuItem onClick={() => { onArrange('front'); close() }}>Đưa lên đầu</MenuItem>
          <MenuItem onClick={() => { onArrange('back'); close() }}>Đưa xuống cuối</MenuItem>
          <MenuItem onClick={() => { onArrange('forward'); close() }}>Đưa lên một lớp</MenuItem>
          <MenuItem onClick={() => { onArrange('backward'); close() }}>Đưa xuống một lớp</MenuItem>
          <div className="slide-ribbon-menu-sep" />
          <div className="slide-ribbon-menu-title">Căn vào slide</div>
          <MenuItem icon={<IconObjAlignLeft size={16} />} onClick={() => { onAlign('left'); close() }}>Căn trái slide</MenuItem>
          <MenuItem icon={<IconObjAlignCenterH size={16} />} onClick={() => { onAlign('center'); close() }}>Căn giữa ngang</MenuItem>
          <MenuItem icon={<IconObjAlignRight size={16} />} onClick={() => { onAlign('right'); close() }}>Căn phải slide</MenuItem>
          <MenuItem icon={<IconObjAlignTop size={16} />} onClick={() => { onAlign('top'); close() }}>Căn trên slide</MenuItem>
          <MenuItem icon={<IconObjAlignMiddle size={16} />} onClick={() => { onAlign('middle'); close() }}>Căn giữa dọc</MenuItem>
          <MenuItem icon={<IconObjAlignBottom size={16} />} onClick={() => { onAlign('bottom'); close() }}>Căn dưới slide</MenuItem>
          <div className="slide-ribbon-menu-sep" />
          <div className="slide-ribbon-menu-title">Lật</div>
          <MenuItem icon={<IconObjFlipH size={16} />} onClick={() => { onFlip('x'); close() }}>Lật ngang</MenuItem>
          <MenuItem icon={<IconObjFlipV size={16} />} onClick={() => { onFlip('y'); close() }}>Lật dọc</MenuItem>
        </Anchored>
      </RibbonGroup>
    </>
  )

  const renderInsert = () => (
    <>
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
          minWidth={356}
          trigger={<RibbonButton icon={<><IconShapes size={28} /><Caret /></>} label="Hình dạng" onClick={() => toggle('shape')} active={popup === 'shape'} />}
        >
          <ShapeGallery onPick={insertPreset} />
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
          onClick={() => onInsert({ id: uid(), type: 'text', x: 35, y: 42, w: 30, h: 18, text: 'Nhập văn bản', variant: 'body', fontSize: 3.2 })}
        />
        <Anchored
          open={popup === 'formula'}
          minWidth={220}
          trigger={<RibbonButton icon={<><Sigma size={28} strokeWidth={1.6} /><Caret /></>} label="Công thức" onClick={() => toggle('formula')} active={popup === 'formula'} />}
        >
          <div className="slide-ribbon-menu-title">Chèn công thức (sửa trong hộp chữ, viết giữa $…$)</div>
          {FORMULA_PRESETS.map(([label, tex]) => (
            <MenuItem key={label} onClick={() => { insertFormula(tex); close() }}>{label}</MenuItem>
          ))}
        </Anchored>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Biểu tượng">
        <Anchored
          open={popup === 'symbol'}
          minWidth={300}
          trigger={
            <RibbonButton
              icon={<><IconSymbol size={26} /><Caret /></>}
              label="Ký hiệu"
              title="Chèn ký hiệu đặc biệt (Ω)"
              onClick={() => toggle('symbol')}
              active={popup === 'symbol'}
            />
          }
        >
          <div className="max-h-[320px] overflow-y-auto p-1">
            {SLIDE_SYMBOLS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div className="slide-ribbon-menu-sep" />}
                <div className="slide-ribbon-menu-title">{group.label}</div>
                <div className="slide-sym-grid px-1.5 pb-1">
                  {group.chars.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      className="slide-sym-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertSymbolChar(ch)}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Anchored>
        <RibbonButton icon={<Smile size={28} strokeWidth={1.6} />} label="Icon" onClick={onOpenIcons} />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Liên kết">
        <Anchored
          open={popup === 'link'}
          minWidth={260}
          trigger={
            <RibbonButton
              icon={<IconLink size={26} />}
              label="Liên kết"
              title="Gắn liên kết web (http/https) cho phần tử đang chọn"
              disabled={!selected}
              active={popup === 'link' || Boolean(selected?.href)}
              onClick={() => {
                setHrefInput(selected?.href ?? '')
                setHrefError(null)
                toggle('link')
              }}
            />
          }
        >
          <form
            className="flex flex-col gap-2 p-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              const url = normalizeSlideHref(hrefInput)
              if (!url) {
                setHrefError('Nhập URL http(s):// hợp lệ.')
                return
              }
              onUpdateSelected({ href: url })
              setHrefError(null)
              close()
            }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Địa chỉ liên kết</div>
            <input
              type="text"
              value={hrefInput}
              onChange={(e) => {
                setHrefInput(e.target.value)
                if (hrefError) setHrefError(null)
              }}
              placeholder="https://example.com"
              aria-label="URL liên kết"
              autoFocus
              className="w-full rounded border border-line bg-white px-2 py-1 text-[12px] outline-none focus:border-clay"
            />
            {hrefError && <div className="text-[11px] text-red-600">{hrefError}</div>}
            <div className="flex items-center justify-end gap-1.5">
              {selected?.href ? (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSelected({ href: undefined })
                    setHrefInput('')
                    setHrefError(null)
                    close()
                  }}
                  className="rounded border border-line px-2 py-1 text-[12px] text-ink-2 hover:bg-subtle"
                >
                  Gỡ
                </button>
              ) : null}
              <button
                type="submit"
                className="rounded bg-clay px-2.5 py-1 text-[12px] font-medium text-white hover:opacity-90"
              >
                Áp dụng
              </button>
            </div>
          </form>
        </Anchored>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Đầu trang & chân trang">
        <Anchored
          open={popup === 'footer'}
          minWidth={260}
          trigger={
            <RibbonButton
              icon={<IconFooter size={26} />}
              label="Chân trang"
              title="Bật tắt số trang và nội dung chân trang slide"
              active={popup === 'footer' || Boolean(deck.footer?.slideNumber || deck.footer?.text?.trim())}
              onClick={() => toggle('footer')}
            />
          }
        >
          <div className="flex flex-col gap-2.5 p-2.5 text-[12px] text-ink">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={Boolean(deck.footer?.slideNumber)}
                onChange={(e) => onUpdateFooter({ ...deck.footer, slideNumber: e.target.checked })}
              />
              <span>Số trang</span>
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={deck.footer?.text !== undefined}
                  onChange={(e) =>
                    onUpdateFooter({
                      ...deck.footer,
                      text: e.target.checked ? footerDraft : undefined,
                    })
                  }
                />
                <span>Chân trang</span>
              </label>
              <input
                type="text"
                value={deck.footer?.text ?? ''}
                disabled={deck.footer?.text === undefined}
                onChange={(e) => {
                  setFooterDraft(e.target.value)
                  onUpdateFooter({ ...deck.footer, text: e.target.value })
                }}
                placeholder="Nhập nội dung chân trang…"
                aria-label="Nội dung chân trang"
                className="w-full rounded border border-line bg-white px-2 py-1 text-[12px] outline-none focus:border-clay disabled:bg-subtle disabled:text-ink-3"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={Boolean(deck.footer?.skipTitle)}
                onChange={(e) => onUpdateFooter({ ...deck.footer, skipTitle: e.target.checked })}
              />
              <span>Không hiện ở slide tiêu đề</span>
            </label>
          </div>
        </Anchored>
      </RibbonGroup>
    </>
  )

  const renderDesign = () => {
    const activeTone = slide
      ? isTone(slide.tone)
        ? slide.tone
        : defaultTone(slide.layout ?? 'bullets')
      : 'theme'
    const toneEnabled = Boolean(slide?.layout && isLayoutId(slide.layout))
    return (
    <>
      <RibbonGroup label="Bộ màu">
        <RibbonButton
          icon={<Palette size={26} strokeWidth={1.7} />}
          label="Bộ màu…"
          data-tip="Chọn bộ màu cho cả bài (mở tab Mẫu → Bộ màu)"
          onClick={() => {
            onOpenDesigns()
            if (phoneSheetOpen) setPhoneSheetOpen(false)
          }}
        />
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
            data-tip={toneEnabled ? label : `${label} (áp bố cục trước)`}
            onClick={() => onTone(tone)}
            active={activeTone === tone}
            disabled={!toneEnabled}
          />
        ))}
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Nền slide">
        <Anchored
          open={popup === 'bg'}
          minWidth={252}
          trigger={
            <RibbonButton
              icon={<><IconFillColor size={28} /><Caret /></>}
              label="Màu nền"
              onClick={() => toggle('bg')}
              active={popup === 'bg'}
              disabled={!slide || Boolean(slide.html)}
            />
          }
        >
          <BackgroundMenu
            current={slide?.background ?? ''}
            custom={Boolean(slide?.customBg)}
            onPick={(background, all, image) => {
              onBackground(background, all, image)
              if (!all) close()
            }}
          />
        </Anchored>
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

  const renderAnimations = () => {
    const start = selected ? startOf(selected) : undefined
    const has = start !== undefined
    const multiLine = selected?.type === 'text' && (selected.text ?? '').split('\n').length > 1
    const speed = selected?.animMs ?? 450
    return (
    <>
      <RibbonGroup label={selected ? (has ? `Hiệu ứng · lần bấm ${start}` : 'Hiệu ứng cho đối tượng') : 'Chọn một đối tượng để thêm hiệu ứng'}>
        <div className="slide-anim-gallery">
          <button
            type="button"
            className={cn('slide-anim-chip', selected && !has && 'is-active')}
            onClick={() => onElementAnim({ type: 'none' })}
            disabled={!selected}
            data-tip="Hiện sẵn, không có hiệu ứng"
          >
            <span className="slide-anim-chip__demo" data-anim="none" />
            Không
          </button>
          {ANIM_EFFECTS.map((fx) => (
            <button
              key={fx.id}
              type="button"
              className={cn('slide-anim-chip', has && (selected?.anim ?? 'fade') === fx.id && 'is-active')}
              onClick={() => onElementAnim({ type: 'set', anim: fx.id })}
              disabled={!selected}
              data-tip={`${fx.label} khi bấm chuột lúc trình chiếu`}
            >
              <span className="slide-anim-chip__demo" data-anim={fx.id} />
              {fx.label}
            </button>
          ))}
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Thứ tự & thời gian">
        <div className="rb-row">
          <RibbonIconButton icon={<span className="slide-anim-arrow">↑</span>} title="Hiện sớm hơn (lên một lần bấm)" onClick={() => onElementAnim({ type: 'move', dir: -1 })} disabled={!has || start === 1} />
          <RibbonIconButton icon={<span className="slide-anim-arrow">↓</span>} title="Hiện muộn hơn (lùi một lần bấm)" onClick={() => onElementAnim({ type: 'move', dir: 1 })} disabled={!has} />
          <Dropdown
            width={150}
            ariaLabel="Tốc độ hiệu ứng"
            value={String(speed)}
            disabled={!has}
            options={ANIM_SPEEDS.map((s) => ({ value: String(s.ms), label: s.label }))}
            onPick={(ms) => onElementAnim({ type: 'speed', ms: Number(ms) })}
          />
        </div>
        <div className="rb-row">
          <label className={cn('rb-inline-label slide-anim-byline', (!has || !multiLine) && 'is-disabled')} data-tip="Mỗi lần bấm hiện thêm một dòng của hộp chữ">
            <input
              type="checkbox"
              checked={selected?.lineStep !== undefined}
              disabled={!has || !multiLine}
              onChange={(e) => onElementAnim({ type: 'byLine', on: e.target.checked })}
            />
            Hiện từng dòng
          </label>
        </div>
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Bấm chuột rồi hiện (khi trình chiếu)">
        <RibbonButton icon={<IconTransFade size={28} />} label="Tự thêm: slide này" onClick={() => onAnimate('auto', false)} disabled={!slide} />
        <RibbonButton icon={<IconApplyAll size={28} />} label="Tự thêm: cả bài" onClick={() => onAnimate('auto', true)} />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Xoá hiệu ứng">
        <RibbonButton icon={<IconTransNone size={28} />} label="Slide này" onClick={() => onAnimate('clear', false)} disabled={!slide} />
        <RibbonButton icon={<IconTrash size={28} />} label="Cả bài" onClick={() => onAnimate('clear', true)} />
      </RibbonGroup>
    </>
    )
  }

  const renderSlideShow = () => (
    <RibbonGroup label="Bắt đầu trình chiếu">
      <RibbonButton icon={<IconPlayCurrent size={28} />} label="Từ slide hiện tại" onClick={onPresent} />
      <RibbonButton icon={<IconPlayFromStart size={28} />} label="Từ đầu" onClick={onPresentFromStart} />
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
      <RibbonGroup label="Căn chỉnh">
        <RibbonButton icon={<Grid3x3 size={26} strokeWidth={1.6} />} label="Lưới" onClick={onToggleGrid} active={gridOn} />
        <RibbonButton icon={<Magnet size={26} strokeWidth={1.6} />} label="Đường gióng" onClick={onToggleSnap} active={snapOn} />
      </RibbonGroup>
      <div className="ribbon-sep" />
      <RibbonGroup label="Ngăn">
        <RibbonButton icon={<img src="/brand/ai-static.svg" alt="" className="slide-ribbon-ai-mark" />} label="Trợ lý AI" onClick={onToggleAi} active={aiOpen} />
      </RibbonGroup>
    </>
  )

  /** tab ngữ cảnh "Thành phần": hiện khi chọn hình khối, icon, đồ hoạ hoặc đường nối */
  const renderElementFormat = () => {
    const isShape = selected?.type === 'shape' || selected?.type === 'connector'
    const transparency = Math.round((1 - (selected?.opacity ?? 1)) * 100)
    return (
      <>
        <RibbonGroup label={isShape ? 'Tô' : selected?.type === 'graphic' ? 'Màu nét' : 'Màu'}>
          <Anchored
            open={popup === 'fill'}
            minWidth={190}
            trigger={
              <RibbonButton
                icon={<><IconFillColor size={28} /><Caret /></>}
                label={isShape ? 'Màu tô' : selected?.type === 'graphic' ? 'Màu nét' : 'Màu'}
                onClick={() => toggle('fill')}
                active={popup === 'fill'}
                disabled={!selected}
              />
            }
          >
            <ColorPalette
              value={isShape ? (selected?.fill ?? deck.theme.accent) : (selected?.textColor ?? deck.theme.fg)}
              themeColors={[deck.theme.accent, deck.theme.fg]}
              onPick={(c) => {
                onUpdateSelected(isShape ? { fill: c } : { textColor: c })
                close()
              }}
            />
          </Anchored>
        </RibbonGroup>

        {selected?.type === 'graphic' && (
          <RibbonGroup label="Chủ đạo">
            <Anchored
              open={popup === 'main'}
              minWidth={190}
              trigger={
                <RibbonButton
                  icon={<><IconFillColor size={28} /><Caret /></>}
                  label="Màu chủ đạo"
                  onClick={() => toggle('main')}
                  active={popup === 'main'}
                />
              }
            >
              <ColorPalette
                value={selected.fill ?? graphicMainColor(selected.graphicId)}
                themeColors={[deck.theme.accent, deck.theme.fg]}
                onPick={(c) => onUpdateSelected({ fill: c })}
                onClose={close}
              />
            </Anchored>
          </RibbonGroup>
        )}

        {isShape && (
          <>
            <div className="ribbon-sep" />
            <RibbonGroup label="Viền">
              <div className="rb-col">
                <div className="rb-row">
                  <Anchored
                    open={popup === 'border'}
                    minWidth={190}
                    trigger={
                      <RibbonButton
                        icon={<><IconBorderAll size={28} /><Caret /></>}
                        label="Màu viền"
                        onClick={() => toggle('border')}
                        active={popup === 'border'}
                        disabled={!selected}
                      />
                    }
                  >
                    <ColorPalette
                      value={selected?.borderColor ?? deck.theme.fg}
                      themeColors={[deck.theme.accent, deck.theme.fg]}
                      onPick={(c) => {
                        onUpdateSelected({ borderColor: c })
                        close()
                      }}
                    />
                  </Anchored>
                </div>
                <div className="rb-row">
                  <Dropdown
                    value={String(selected?.border ?? 0)}
                    options={[0, 1, 2, 3, 4, 6, 8].map((w) => ({ value: String(w), label: w === 0 ? 'Không viền' : `${w} px` }))}
                    onPick={(v) => onUpdateSelected({ border: Number(v) })}
                    disabled={!selected}
                    ariaLabel="Độ dày viền"
                    width={96}
                  />
                  <Dropdown
                    value={selected?.borderStyle ?? 'solid'}
                    options={[
                      { value: 'solid', label: 'Liền' },
                      { value: 'dashed', label: 'Đứt' },
                      { value: 'dotted', label: 'Chấm' },
                    ]}
                    onPick={(v) => onUpdateSelected({ borderStyle: v as NonNullable<SlideElement['borderStyle']> })}
                    disabled={!selected}
                    ariaLabel="Kiểu nét viền"
                    width={80}
                  />
                </div>
              </div>
            </RibbonGroup>
          </>
        )}

        <div className="ribbon-sep" />
        <RibbonGroup label="Hiệu ứng">
          <div className="rb-col">
            <div className="rb-row">
              <label className="rb-inline-label">
                Trong suốt
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={transparency}
                  disabled={!selected}
                  onChange={(e) => onUpdateSelected({ opacity: 1 - Number(e.target.value) / 100 })}
                  aria-label="Độ trong suốt"
                  className="w-24"
                />
                <span className="tnum">{transparency}%</span>
              </label>
            </div>
            <div className="rb-row">
              <Dropdown
                value={String(selected?.shadowLevel ?? 0)}
                options={[
                  { value: '0', label: 'Không bóng' },
                  { value: '1', label: 'Bóng nhẹ' },
                  { value: '2', label: 'Bóng vừa' },
                  { value: '3', label: 'Bóng đậm' },
                ]}
                onPick={(v) => onUpdateSelected({ shadowLevel: Number(v) as 0 | 1 | 2 | 3 })}
                disabled={!selected}
                ariaLabel="Bóng đổ"
                width={112}
              />
              {selected?.shape === 'round' && (
                <label className="rb-inline-label">
                  Bo góc
                  <input
                    className="rb-num-input"
                    type="number"
                    min={0}
                    max={80}
                    value={selected.radius ?? 0}
                    onChange={(e) => onUpdateSelected({ radius: Math.max(0, Number(e.target.value)) })}
                    aria-label="Bo góc"
                  />
                </label>
              )}
            </div>
          </div>
        </RibbonGroup>

        <div className="ribbon-sep" />
        <RibbonGroup label="Thứ tự lớp">
          <RibbonButton icon={<BringToFront size={26} strokeWidth={1.6} />} label="Đưa lên trên" onClick={() => onArrange('front')} disabled={!selected} />
          <RibbonButton icon={<SendToBack size={26} strokeWidth={1.6} />} label="Đưa xuống dưới" onClick={() => onArrange('back')} disabled={!selected} />
        </RibbonGroup>
        <div className="ribbon-sep" />
        <RibbonGroup label="Căn vào slide">
          <div className="rb-row">
            <RibbonIconButton icon={<IconObjAlignLeft size={17} />} title="Căn trái slide" onClick={() => onAlign('left')} disabled={!selected} />
            <RibbonIconButton icon={<IconObjAlignCenterH size={17} />} title="Căn giữa ngang" onClick={() => onAlign('center')} disabled={!selected} />
            <RibbonIconButton icon={<IconObjAlignRight size={17} />} title="Căn phải slide" onClick={() => onAlign('right')} disabled={!selected} />
          </div>
          <div className="rb-row">
            <RibbonIconButton icon={<IconObjAlignTop size={17} />} title="Căn trên slide" onClick={() => onAlign('top')} disabled={!selected} />
            <RibbonIconButton icon={<IconObjAlignMiddle size={17} />} title="Căn giữa dọc" onClick={() => onAlign('middle')} disabled={!selected} />
            <RibbonIconButton icon={<IconObjAlignBottom size={17} />} title="Căn dưới slide" onClick={() => onAlign('bottom')} disabled={!selected} />
          </div>
        </RibbonGroup>
        <div className="ribbon-sep" />
        <RibbonGroup label="Lật">
          <div className="rb-row">
            <RibbonIconButton icon={<IconObjFlipH size={17} />} title="Lật ngang" active={!!selected?.flipX} onClick={() => onFlip('x')} disabled={!selected} />
            <RibbonIconButton icon={<IconObjFlipV size={17} />} title="Lật dọc" active={!!selected?.flipY} onClick={() => onFlip('y')} disabled={!selected} />
          </div>
        </RibbonGroup>
        <div className="ribbon-sep" />
        <RibbonGroup label="Xoay">
          <div className="rb-row">
            <label className="rb-inline-label">
              Góc
              <input
                className="rb-num-input"
                type="number"
                min={0}
                max={359}
                value={Math.round(selected?.rotation ?? 0)}
                disabled={!selected}
                onChange={(e) => onUpdateSelected({ rotation: ((Number(e.target.value) % 360) + 360) % 360 })}
                aria-label="Góc xoay"
              />
              °
            </label>
          </div>
        </RibbonGroup>

        <div className="ribbon-sep" />
        <RibbonGroup label="Đối tượng">
          <RibbonButton icon={<IconTrash size={28} />} label="Xóa" onClick={onDeleteSelected} disabled={!selected} />
        </RibbonGroup>
      </>
    )
  }

  const rawBody = activeContext
    ? renderElementFormat()
    : activeTab === 'home'
      ? renderHome()
      : activeTab === 'insert'
        ? renderInsert()
        : activeTab === 'design'
          ? renderDesign()
          : activeTab === 'transitions'
            ? renderTransitions()
            : activeTab === 'animations'
              ? renderAnimations()
            : activeTab === 'slideShow'
              ? renderSlideShow()
              : activeTab === 'view'
                ? renderView()
                : renderHome()

  // Tách các RibbonGroup để ở khổ tablet có thể thu nhóm tràn vào menu "Thêm"
  const rawChildren = isValidElement<{ children?: ReactNode }>(rawBody) && rawBody.type === Fragment
    ? Children.toArray(rawBody.props.children)
    : [rawBody]
  const groups = rawChildren.filter((child) => isValidElement(child) && child.type === RibbonGroup)

  useLayoutEffect(() => {
    if (!isTablet) {
      setVisibleGroups(null)
      return
    }
    const el = bodyRef.current
    if (!el) return
    const measure = () => {
      const avail = el.clientWidth - 24 // padding ngang
      if (avail <= 0) return
      const nodes = [...el.querySelectorAll<HTMLElement>('[data-ribbon-measure]')]
      if (!nodes.length) return
      let used = 0
      let count = 0
      const moreReserve = 78
      for (let i = 0; i < nodes.length; i++) {
        const w = nodes[i].offsetWidth + (i > 0 ? 13 : 0) // + sep
        const needMore = i < nodes.length - 1 ? moreReserve : 0
        if (used + w + needMore <= avail || i === 0) {
          used += w
          count++
        } else {
          break
        }
      }
      setVisibleGroups(count >= nodes.length ? null : count)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isTablet, activeTab, groups.length, selected?.id])

  useLayoutEffect(() => {
    if (!isTablet) {
      setVisibleTabs(null)
      return
    }
    const el = tabsWrapRef.current
    if (!el) return
    const measure = () => {
      const bar = el.querySelector<HTMLElement>('.ribbon-tabs')
      if (!bar) return
      const avail = bar.clientWidth - 16
      const leadingNodes = [...bar.querySelectorAll<HTMLElement>('.file-menu, .qa-btn, .qa-sep')]
      let used = 0
      for (const n of leadingNodes) used += n.offsetWidth + 4
      const tabNodes = [...el.querySelectorAll<HTMLElement>('[data-measure-tab]')]
      let count = 0
      const moreReserve = 76
      for (let i = 0; i < tabNodes.length; i++) {
        const w = tabNodes[i].offsetWidth + 4
        const needMore = i < tabNodes.length - 1 ? moreReserve : 0
        if (used + w + needMore <= avail || i === 0) {
          used += w
          count++
        } else {
          break
        }
      }
      setVisibleTabs(count >= tabs.length ? null : count)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isTablet, tabs.length, activeContext])

  const leadingControls = (
    <>
      {onNewDeck && onImportFile ? (
        <FileMenu
          kind="slide"
          onNew={onNewDeck}
          onImport={onImportFile}
          onDownload={onDownload ?? (() => {})}
          downloadHint=".pptx"
          extra={{ label: 'Xuất PDF', hint: 'Mở hộp thoại in → chọn Lưu thành PDF', onClick: onExportPdf }}
          downloadNote="Do hạn chế kỹ thuật, file .pptx dùng phông Arial thay cho phông của bài giảng. Chúng tôi sẽ cải tiến để giữ đúng phông trong thời gian tới."
        />
      ) : null}
      <span className="qa-sep" aria-hidden="true" />
      {onSave && (
        <button type="button" className="qa-btn" data-tip="Lưu" aria-label="Lưu" onClick={onSave}>
          <IconSave size={16} />
        </button>
      )}
      <button type="button" className="qa-btn" data-tip="Hoàn tác" aria-label="Hoàn tác" onMouseDown={(e) => e.preventDefault()} onClick={onUndo} disabled={!canUndo}>
        <IconUndo size={16} />
      </button>
      <button type="button" className="qa-btn" data-tip="Làm lại" aria-label="Làm lại" onMouseDown={(e) => e.preventDefault()} onClick={onRedo} disabled={!canRedo}>
        <IconRedo size={16} />
      </button>
      <span className="qa-sep" aria-hidden="true" />
    </>
  )

  if (isPhone) {
    return (
      <div className="ribbon slide-ribbon slide-ribbon--phone" ref={rootRef}>
        <div className="slide-ribbon__phone-top">
          <div className="flex min-w-0 flex-1 items-center gap-1 max-[359px]:gap-0.5 overflow-x-auto no-scrollbar">
            {onNewDeck && onImportFile ? (
              <FileMenu
                kind="slide"
                onNew={onNewDeck}
                onImport={onImportFile}
                onDownload={onDownload ?? (() => {})}
                downloadHint=".pptx"
                extra={{ label: 'Xuất PDF', hint: 'Mở hộp thoại in → chọn Lưu thành PDF', onClick: onExportPdf }}
                downloadNote="Do hạn chế kỹ thuật, file .pptx dùng phông Arial thay cho phông của bài giảng. Chúng tôi sẽ cải tiến để giữ đúng phông trong thời gian tới."
              />
            ) : null}
            {onSave && (
              <button type="button" className="qa-btn shrink-0" data-tip="Lưu" aria-label="Lưu" onClick={onSave}>
                <IconSave size={16} />
              </button>
            )}
            <button type="button" className="qa-btn shrink-0" data-tip="Hoàn tác" aria-label="Hoàn tác" onMouseDown={(e) => e.preventDefault()} onClick={onUndo} disabled={!canUndo}>
              <IconUndo size={16} />
            </button>
            <button type="button" className="qa-btn shrink-0" data-tip="Làm lại" aria-label="Làm lại" onMouseDown={(e) => e.preventDefault()} onClick={onRedo} disabled={!canRedo}>
              <IconRedo size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPhoneSheetOpen(true)}
            aria-label="Mở tất cả công cụ"
            className="flex min-h-[36px] shrink-0 whitespace-nowrap items-center gap-1 max-[359px]:gap-0.5 max-[359px]:px-1.5 max-[359px]:text-[11.5px] rounded-md border border-line bg-surface px-2.5 text-[12px] font-medium text-ink hover:bg-paper-2"
          >
            <span>Công cụ</span>
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        <div className="slide-ribbon__phone-quick">
          <button
            type="button"
            className="slide-ribbon__qbtn"
            data-tip="Slide mới"
            aria-label="Slide mới"
            onClick={onAddSlide}
          >
            <IconNewSlide size={20} />
          </button>
          <button
            type="button"
            className={cn('slide-ribbon__qbtn', selected?.fontWeight === 700 && 'active')}
            data-tip="Đậm"
            aria-label="Đậm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateSelected({ fontWeight: selected?.fontWeight === 700 ? 400 : 700 })}
            disabled={!isText}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            className={cn('slide-ribbon__qbtn', selected?.fontStyle === 'italic' && 'active')}
            data-tip="Nghiêng"
            aria-label="Nghiêng"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateSelected({ fontStyle: selected?.fontStyle === 'italic' ? 'normal' : 'italic' })}
            disabled={!isText}
          >
            <i>I</i>
          </button>
          <Anchored
            open={popup === 'phoneColor'}
            minWidth={248}
            trigger={
              <button
                type="button"
                className="slide-ribbon__qbtn slide-ribbon-color-btn"
                data-tip="Màu chữ"
                aria-label="Màu chữ"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggle('phoneColor')}
                disabled={!isText}
              >
                <span className="slide-ribbon-A">A</span>
                <span className="rb-color-bar" style={{ background: selected?.textColor ?? deck.theme.fg }} />
              </button>
            }
          >
            <ColorPalette
              value={selected?.textColor ?? deck.theme.fg}
              themeColors={[deck.theme.fg, deck.theme.accent]}
              onPick={(textColor) => {
                onUpdateSelected({ textColor })
                close()
              }}
            />
          </Anchored>
          <Anchored
            open={popup === 'phoneInsert'}
            minWidth={296}
            trigger={
              <button
                type="button"
                className={cn('slide-ribbon__qbtn slide-ribbon__qbtn--wide', popup === 'phoneInsert' && 'active')}
                data-tip="Chèn"
                aria-label="Chèn"
                onClick={() => {
                  setPhoneInsertSub('menu')
                  toggle('phoneInsert')
                }}
              >
                <IconShapes size={18} />
                <span>Chèn</span>
                <ChevronDown className="size-3.5" />
              </button>
            }
          >
            {phoneInsertSub === 'menu' ? (
              <>
                <MenuItem icon={<IconPicture size={16} />} onClick={() => { onInsert({ id: uid(), type: 'image', x: 25, y: 26, w: 50, h: 38 }); close() }}>
                  Hình ảnh
                </MenuItem>
                <MenuItem icon={<IconShapes size={16} />} onClick={() => setPhoneInsertSub('shape')}>
                  Hình dạng…
                </MenuItem>
                <MenuItem icon={<IconTextBox size={16} />} onClick={() => { onInsert({ id: uid(), type: 'text', x: 35, y: 42, w: 30, h: 18, text: 'Nhập văn bản', variant: 'body', fontSize: 3.2 }); close() }}>
                  Hộp văn bản
                </MenuItem>
                <MenuItem icon={<IconSlideLayout size={16} />} onClick={() => setPhoneInsertSub('layout')} disabled={!slide}>
                  Bố cục slide…
                </MenuItem>
                <MenuItem icon={<IconTable size={16} />} onClick={() => insertTable(3, 3)}>
                  Bảng 3×3
                </MenuItem>
                <MenuItem icon={<IconChart size={16} />} onClick={() => insertChart('bar')}>
                  Biểu đồ cột
                </MenuItem>
              </>
            ) : phoneInsertSub === 'shape' ? (
              <div className="max-w-[calc(100vw-32px)]">
                <button type="button" onClick={() => setPhoneInsertSub('menu')} className="mb-1.5 flex min-h-[36px] items-center gap-1 px-1 text-[12px] font-medium text-clay">
                  ← Quay lại
                </button>
                <ShapeGallery onPick={insertPreset} />
              </div>
            ) : (
              <div className="max-w-[calc(100vw-32px)]">
                <button type="button" onClick={() => setPhoneInsertSub('menu')} className="mb-1.5 flex min-h-[36px] items-center gap-1 px-1 text-[12px] font-medium text-clay">
                  ← Quay lại
                </button>
                <div className="slide-layout-grid">
                  {SLIDE_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      className={cn('slide-layout-card', slide?.layout === layout.id && 'active')}
                      onClick={() => {
                        onApplyLayout(layout.id)
                        close()
                      }}
                    >
                      <span className={cn('slide-layout-thumb', `slide-layout-thumb--${layout.id}`)} aria-hidden>
                        <i />
                        <i />
                        <i />
                      </span>
                      <small>{layout.name}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Anchored>
          <button
            type="button"
            className="slide-ribbon__qbtn slide-ribbon__qbtn--play"
            data-tip="Trình chiếu"
            aria-label="Trình chiếu"
            onClick={onPresent}
          >
            <IconPlayCurrent size={20} />
          </button>
        </div>

        {phoneSheetAnim.mounted && (
          <>
            <div
              className={cn('fixed inset-0 z-50 bg-black/35', phoneSheetAnim.closing ? 'backdrop-out' : 'backdrop-in')}
              aria-hidden="true"
              onClick={() => setPhoneSheetOpen(false)}
            />
            <div
              role="dialog"
              aria-label="Công cụ trình soạn slide"
              className={cn(
                'slide-ribbon__phone-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[78dvh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.4)] pb-[env(safe-area-inset-bottom)]',
                phoneSheetAnim.closing ? 'sheet-out-down' : 'sheet-in-up',
              )}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2">
                <span className="text-[14px] font-semibold text-ink">Công cụ slide</span>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setPhoneSheetOpen(false)}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-ink-2 hover:bg-paper-2"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-line px-3 py-2" role="tablist">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t.id}
                    onClick={() => onTabChange(t.id as SlideRibbonTab)}
                    className={cn(
                      'min-h-[36px] rounded-full px-3 text-[12px] font-medium transition-colors',
                      activeTab === t.id ? 'bg-clay text-white' : 'bg-paper-2 text-ink-2 hover:text-ink',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="slide-ribbon__phone-sheet-body flex-1 overflow-y-auto p-3">
                {rawBody}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  if (isTablet) {
    const tabCut = visibleTabs ?? tabs.length
    const mainTabs = tabs.slice(0, tabCut)
    const overflowTabs = tabs.slice(tabCut)
    const groupCut = visibleGroups ?? groups.length
    const visibleGroupEls = groups.slice(0, groupCut)
    const overflowGroupEls = groups.slice(groupCut)

    return (
      <div className="ribbon slide-ribbon slide-ribbon--tablet" ref={rootRef}>
        <div ref={tabsWrapRef} className="relative">
          <RibbonTabs
            tabs={mainTabs}
            active={activeTab}
            onChange={(id) => onTabChange(id as SlideRibbonTab)}
            leading={leadingControls}
          >
            {overflowTabs.length > 0 && (
              <Anchored
                open={popup === 'moreTabs'}
                minWidth={170}
                trigger={
                  <button
                    type="button"
                    className={cn('ribbon-tab flex items-center gap-1', overflowTabs.some((t) => t.id === activeTab) && 'active')}
                    onClick={() => toggle('moreTabs')}
                    aria-label="Thêm thẻ ribbon"
                  >
                    <span>Thêm</span>
                    <ChevronDown className="size-3.5" />
                  </button>
                }
              >
                {overflowTabs.map((t) => (
                  <MenuItem
                    key={t.id}
                    active={activeTab === t.id}
                    onClick={() => {
                      onTabChange(t.id as SlideRibbonTab)
                      close()
                    }}
                  >
                    {t.label}
                  </MenuItem>
                ))}
              </Anchored>
            )}
          </RibbonTabs>
          {/* Phần tử ẩn để đo chiều rộng tự nhiên của tất cả tab khi resize */}
          <div className="pointer-events-none invisible absolute left-0 top-0 flex whitespace-nowrap" aria-hidden="true">
            {tabs.map((t) => (
              <span key={t.id} data-measure-tab={t.id} className="ribbon-tab">
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div ref={bodyRef} className="ribbon-body">
          <div key={activeTab} className="ribbon-tab-page slide-ribbon__tablet-page">
            {visibleGroupEls.map((g, idx) => (
              <Fragment key={idx}>
                {idx > 0 && <div className="ribbon-sep" />}
                {g}
              </Fragment>
            ))}
            {overflowGroupEls.length > 0 && (
              <>
                <div className="ribbon-sep" />
                <Anchored
                  open={popup === 'moreGroups'}
                  minWidth={260}
                  trigger={
                    <RibbonButton
                      icon={<MoreHorizontal size={22} />}
                      label="Thêm"
                      onClick={() => toggle('moreGroups')}
                      active={popup === 'moreGroups'}
                    />
                  }
                >
                  <div className="slide-ribbon__overflow-groups">
                    {overflowGroupEls}
                  </div>
                </Anchored>
              </>
            )}
            {/* Bản sao ẩn để ResizeObserver đo bề rộng thật của từng nhóm */}
            <div className="slide-ribbon__measure-row" aria-hidden="true">
              {groups.map((g, idx) => (
                <div key={idx} data-ribbon-measure={idx}>
                  {g}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ribbon slide-ribbon" ref={rootRef}>
      <RibbonTabs
        tabs={tabs}
        active={activeTab}
        onChange={(id) => onTabChange(id as SlideRibbonTab)}
        leading={leadingControls}
      />
      <RibbonBody activeKey={activeTab}>{rawBody}</RibbonBody>
    </div>
  )
}
