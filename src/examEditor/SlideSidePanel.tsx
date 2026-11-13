/**
 * Cột trái của trình soạn slide, kiểu Canva: thanh icon hẹp + một panel trượt
 * ra cạnh thanh đó. Panel đẩy sân giấy sang phải chứ không che slide đang sửa.
 *
 * Bốn tab: Mẫu (bố cục slide có sẵn, thêm thành slide mới), Đồ hoạ (hình
 * khối và đồ hoạ vector, chia nhóm theo chủ đề), Icon (biểu tượng đơn sắc, chia
 * nhóm) và Tải lên (ảnh của giáo viên). Ô tìm kiếm ở Đồ hoạ và Icon lọc theo tên.
 */
import { memo, useMemo, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, LayoutTemplate, Plus, Shapes, Smile, Sparkles, Upload, Wrench, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Segmented } from '@/components/Segmented'
import {
  SLIDE_LAYOUTS,
  composeLayout,
  defaultTone,
  toneBackground,
  withPlaceholders,
  type SlideLayoutDef,
  type SlideLayoutId,
} from '@/lib/slideLayouts'
import { DECK_THEMES, normalizeTheme, themeById, type ResolvedTheme } from '@/lib/slideTheme'
import { SLIDE_DESIGNS, buildDesignSlides, type SlideDesign } from '@/lib/slideDesigns'
import { skinById, themeWithSkinFonts } from '@/lib/slideSkins'
import { SlideThumb } from './SlideEditor'
import { NavRailIndicator } from './NavRailIndicator'
import { PanelContentTransition } from './PanelContentTransition'
import { SLIDE_ASSET_IDS, SLIDE_ASSETS } from '@/lib/slideAssets'
import { ICON_LIBRARY } from '@/lib/slideIconLibrary'
import { GRAPHICS } from '@/lib/graphics'
import { GRAPHIC_CATEGORY_LABEL, findGraphics, graphicById, graphicMarkup, matchesWords, searchGraphics, type GraphicCategory } from '@/lib/slideGraphics'
import { PRESET_GROUPS, defaultBox, shapeNameOf } from '@/lib/slidePresets'
import { FRAME_PLACEHOLDER, PHOTO_FRAMES, dragImage } from '@/lib/slideShapes'
import { uid } from '@/data/docTypes'
import { uploadImage } from '@/lib/mediaStore'
import { useUploads } from '@/store/uploads'
import type { DeckTheme, Slide, SlideElement } from '@/store/docs'
import { ShapeGallery, ShapePreview, visibleGroups } from './ShapeGallery'
import { useSlideViewport } from './useSlideViewport'
import { ToolsPanel } from './tools/ToolsPanel'
import { svgDataUrl } from '@/lib/plot'

type PanelId = 'templates' | 'elements' | 'icons' | 'uploads' | 'tools'

const PANELS: Array<{ id: PanelId; label: string; title: string; Icon: typeof Shapes }> = [
  { id: 'templates', label: 'Mẫu', title: 'Mẫu slide', Icon: LayoutTemplate },
  { id: 'elements', label: 'Đồ hoạ', title: 'Đồ hoạ', Icon: Shapes },
  { id: 'icons', label: 'Icon', title: 'Icon', Icon: Smile },
  { id: 'uploads', label: 'Tải lên', title: 'Tải ảnh lên', Icon: Upload },
  { id: 'tools', label: 'Công cụ', title: 'Công cụ', Icon: Wrench },
]

/** ảnh tải lên lớn hơn mức này thì thu nhỏ trước khi đưa vào slide (đỡ nặng bài giảng) */
const MAX_IMAGE_SIDE = 1600
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

interface SlideSidePanelProps {
  theme?: ResolvedTheme | DeckTheme
  accent: string
  /** có slide để chèn vào không (deck HTML hoặc chưa có slide thì tắt chèn) */
  canInsert: boolean
  /** chữ của bài giảng và slide đang mở, để gợi ý đồ hoạ */
  hint?: string
  isBlankDeck?: boolean
  onAddLayoutSlide: (layoutId: SlideLayoutId) => void
  onAddDesign?: (design: SlideDesign, option: 'replace' | 'keep' | 'empty') => void
  onInsert: (el: SlideElement) => void
  /** điện thoại: mục "Trợ lý AI" ở thanh đáy mở AI toàn màn hình */
  onOpenAi?: () => void
}

function SlideSidePanelImpl({
  theme,
  accent,
  canInsert,
  hint = '',
  isBlankDeck = false,
  onAddLayoutSlide,
  onAddDesign,
  onInsert,
  onOpenAi,
}: SlideSidePanelProps) {
  const [active, setActive] = useState<PanelId | null>(null)
  // panel cuối cùng đã mở: giữ nội dung trong lúc trượt đóng (và giữ vị trí cuộn khi mở lại)
  const [last, setLast] = useState<PanelId | null>(null)
  const shown = active ?? last
  const current = PANELS.find((p) => p.id === shown) ?? null
  const { isPhone, isTablet } = useSlideViewport()

  const navRef = useRef<HTMLElement>(null)

  const renderPanelBody = (tabId: PanelId, isMobileSheet: boolean) => (
    <>
      {!canInsert && <p className="px-3 pt-2 text-[12px] text-ink-3">Mở một slide để thêm nội dung vào đó.</p>}
      {/* ô tìm kiếm nằm ngoài vùng cuộn (kiểu Canva): thanh cuộn chỉ chạy qua phần nội dung bên dưới */}
      <div className="flex min-h-0 flex-1 flex-col">
        {tabId === 'templates' && (
          <TemplatesPanel
            theme={theme}
            isBlankDeck={isBlankDeck}
            onPick={isMobileSheet ? (id) => { onAddLayoutSlide(id); setActive(null) } : onAddLayoutSlide}
            onAddDesign={onAddDesign}
            onCloseDrawer={isMobileSheet ? () => setActive(null) : undefined}
          />
        )}
        {tabId === 'elements' && <ElementsPanel accent={accent} canInsert={canInsert} hint={hint} onInsert={isMobileSheet ? insertAndClose : onInsert} />}
        {tabId === 'icons' && <IconsPanel canInsert={canInsert} onInsert={isMobileSheet ? insertAndClose : onInsert} />}
        {tabId === 'tools' && (
          <Scroll>
            <ToolsPanel
              disabled={!canInsert}
              onInsertPlot={(img) => {
                // giữ đúng tỉ lệ ảnh trên khung 16:9 (toạ độ phần trăm)
                const w = 46
                const h = (w * img.height * 16) / (img.width * 9)
                ;(isMobileSheet ? insertAndClose : onInsert)({ id: uid(), type: 'image', src: svgDataUrl(img.svg), x: (100 - w) / 2, y: (100 - h) / 2, w, h })
              }}
            />
          </Scroll>
        )}
        {tabId === 'uploads' && <Scroll><div className="pt-3"><UploadsPanel canInsert={canInsert} onInsert={isMobileSheet ? insertAndClose : onInsert} /></div></Scroll>}
      </div>
    </>
  )
  function insertAndClose(el: SlideElement) {
    onInsert(el)
    setActive(null)
  }

  if (isPhone) {
    return (
      <>
        {active && (
          <div
            className="fixed inset-0 z-30 bg-black/25"
            aria-hidden="true"
            onClick={() => setActive(null)}
          />
        )}
        {/* tấm trượt từ đáy lên, nằm trên thanh tab */}
        <div
          className="fixed inset-x-0 bottom-14 z-40 flex h-[68dvh] max-h-[calc(100dvh-64px)] flex-col rounded-t-2xl border-t border-line bg-surface shadow-[0_-12px_40px_-16px_rgb(0_0_0/0.35)] transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{ transform: active ? 'translateY(0)' : 'translateY(calc(100% + 56px))' }}
          inert={!active}
          aria-label={current?.title}
          role="dialog"
        >
          <div className="flex shrink-0 items-center justify-between px-3 pt-2">
            <span className="text-[14px] font-semibold text-ink">{current?.title}</span>
            <button type="button" aria-label="Đóng" onClick={() => setActive(null)} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md p-1.5 text-ink-2 hover:bg-paper-2">
              <X className="size-5" />
            </button>
          </div>
          {current && renderPanelBody(current.id, true)}
        </div>
        <nav aria-label="Thư viện slide" className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
          {PANELS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActive((cur) => (cur === id ? null : id))
                setLast(id)
              }}
              aria-pressed={active === id}
              className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium', active === id ? 'text-clay' : 'text-ink-3')}
            >
              <Icon className="size-5" strokeWidth={1.7} />
              {label}
            </button>
          ))}
          {onOpenAi && (
            <button
              type="button"
              onClick={() => {
                setActive(null)
                onOpenAi()
              }}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-clay"
            >
              <Sparkles className="size-5" strokeWidth={1.7} />
              Trợ lý AI
            </button>
          )}
        </nav>
      </>
    )
  }

  const railW = isTablet ? 56 : 64

  return (
    <div className="relative flex min-h-0 shrink-0">
      <nav ref={navRef} aria-label="Thư viện slide" className={cn('relative flex flex-col items-center gap-2 overflow-y-auto border-r border-line bg-surface py-3 [scrollbar-width:none]', isTablet ? 'w-[56px]' : 'w-[64px]')}>
        <NavRailIndicator containerRef={navRef} activeId={active} />
        {PANELS.map(({ id, label, Icon }) => (
          <button
            key={id}
            data-tab-id={id}
            type="button"
            onClick={() => {
              setActive((cur) => (cur === id ? null : id))
              setLast(id)
            }}
            aria-pressed={active === id}
            className={cn(
              'relative z-10 flex flex-col items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-0.5 py-2.5 text-[11px] leading-none tracking-[-0.01em] transition-colors duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
              isTablet ? 'w-[48px]' : 'w-[54px]',
              active === id ? 'font-semibold text-clay-deep' : 'font-medium text-ink-3 hover:bg-paper-2 hover:text-ink',
            )}
          >
            <Icon className="size-5 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none" strokeWidth={active === id ? 2.1 : 1.7} />
            {label}
          </button>
        ))}
      </nav>

      {isTablet ? (
        <>
          {active && (
            <div
              className="fixed inset-0 z-30 bg-black/20"
              aria-hidden="true"
              onClick={() => setActive(null)}
            />
          )}
          {active && current && (
            <aside
              className="absolute bottom-0 top-0 z-40 flex w-[280px] max-w-[calc(100vw-64px)] min-h-0 flex-col border-r border-line bg-surface shadow-[8px_0_32px_-8px_rgb(0_0_0/0.25)]"
              style={{ left: railW }}
              aria-label={current.title}
              role="dialog"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2">
                <span className="text-[13px] font-semibold text-ink">{current.title}</span>
                <button
                  type="button"
                  aria-label="Đóng panel"
                  onClick={() => setActive(null)}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-ink-2 hover:bg-paper-2"
                >
                  <X className="size-4" />
                </button>
              </div>
              {renderPanelBody(active, false)}
            </aside>
          )}
        </>
      ) : (
        <>
          {/* nút thu panel kiểu Canva: viên thuốc bám mép phải panel, đi theo khi panel trượt */}
          <button
            type="button"
            aria-label="Đóng panel"
            title="Đóng panel"
            tabIndex={active ? 0 : -1}
            onClick={() => setActive(null)}
            className="absolute top-1/2 z-30 flex h-12 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink-2 shadow-sm transition-[left,opacity] duration-200 ease-out hover:text-clay motion-reduce:transition-none"
            style={{ left: railW + (active ? 280 : 0), opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
          >
            <ChevronLeft className="size-4" />
          </button>
          {/* khung ngoài đổi bề rộng để panel trượt ra/vào; khung trong giữ nguyên 280px nên nội dung không bị bóp */}
          <div
            className="min-h-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: active ? 280 : 0 }}
            inert={!active}
          >
          {current && (
            <aside className="flex h-full w-[280px] min-h-0 flex-col border-r border-line bg-surface" aria-label={current.title}>
              <PanelContentTransition activeTab={active} tabOrder={PANELS.map((p) => p.id)}>
                {(tabId) => renderPanelBody(tabId as PanelId, false)}
              </PanelContentTransition>
            </aside>
          )}
          </div>
        </>
      )}
    </div>
  )
}

export const SlideSidePanel = memo(SlideSidePanelImpl)

/** `keep`: nhớ vị trí cuộn — mở "Xem tất cả" rồi quay lại thì về đúng chỗ đang lướt */
function Scroll({ children, keep }: { children: React.ReactNode; keep?: React.MutableRefObject<number> }) {
  const restore = (node: HTMLDivElement | null) => {
    if (node && keep) node.scrollTop = keep.current
  }
  return (
    <div ref={keep ? restore : undefined} onScroll={keep ? (e) => { keep.current = e.currentTarget.scrollTop } : undefined} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      {children}
    </div>
  )
}

/** bỏ dấu tiếng Việt để tìm bằng chuỗi không dấu */
const norm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-[14px] shadow-sm outline-none focus:border-clay"
    />
  )
}

/** nhóm có tiêu đề, hiện hết (không gập) để nhìn toàn bộ thư viện */
function Section({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-3">
      {title && <h4 className="mb-1.5 px-1 text-[12px] font-semibold text-ink-3">{title}</h4>}
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Mẫu: thanh chuyển Bố cục | Thiết kế
 * ------------------------------------------------------------------ */
type TemplateMode = 'layouts' | 'designs'
const TEMPLATE_MODE_KEY = 'slide-template-mode'

function loadTemplateMode(): TemplateMode {
  try {
    const saved = localStorage.getItem(TEMPLATE_MODE_KEY)
    if (saved === 'designs' || saved === 'layouts') return saved
  } catch {
    /* ignore */
  }
  return 'layouts'
}

const LAYOUT_GROUPS: Array<{ title: string; layouts: SlideLayoutId[] }> = [
  {
    title: 'Mở đầu & kết thúc',
    layouts: ['title', 'section', 'closing', 'agenda', 'hook'],
  },
  {
    title: 'Nội dung chữ',
    layouts: ['statement', 'bullets', 'cards', 'two-column', 'comparison', 'quote'],
  },
  {
    title: 'Hình ảnh',
    layouts: ['image-left', 'image-right', 'image-full'],
  },
  {
    title: 'Số liệu & bảng',
    layouts: ['table', 'stats', 'stat-image'],
  },
  {
    title: 'Sơ đồ',
    layouts: ['timeline', 'cycle', 'mindmap'],
  },
  {
    title: 'Câu hỏi & ví dụ',
    layouts: ['quiz', 'example'],
  },
]

const LAYOUT_MAP = new Map<SlideLayoutId, SlideLayoutDef>(SLIDE_LAYOUTS.map((l) => [l.id, l]))

/**
 * Chỉ vẽ hình xem trước khi ô sắp cuộn tới (cách khung nhìn 300px). Vẽ một slide
 * thu nhỏ khá nặng (mỗi khối chữ đo để tự co cỡ), vẽ hết 40 slide của tab Thiết kế
 * cùng lúc làm panel đứng vài giây. Đã hiện thì giữ luôn, cuộn lại không vẽ lại.
 */
function LazyThumb({ render }: { render: () => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])
  return (
    <div ref={ref} className="absolute inset-0">
      {shown ? render() : null}
    </div>
  )
}

/** slide xem trước của từng bộ thiết kế: dựng một lần cho cả phiên (dữ liệu bộ không đổi) */
const designPreviewCache = new Map<string, { theme: ResolvedTheme; slides: Slide[] }>()
function designPreview(design: SlideDesign) {
  let hit = designPreviewCache.get(design.id)
  if (!hit) {
    const skin = skinById(design.id)
    const base = themeById(design.themeId) ?? DECK_THEMES[0]
    const theme = normalizeTheme(skin ? themeWithSkinFonts(base, skin) : base)
    hit = { theme, slides: buildDesignSlides(design, theme) }
    designPreviewCache.set(design.id, hit)
  }
  return hit
}

function LayoutCard({
  layout,
  theme,
  onPick,
}: {
  layout: SlideLayoutDef
  theme: ResolvedTheme
  onPick: (id: SlideLayoutId) => void
}) {
  const slide = useMemo(() => {
    try {
      const tone = defaultTone(layout.id)
      const content = withPlaceholders(layout.id, {})
      const elements = composeLayout(theme, layout.id, content, tone)
      if (!elements || elements.length === 0) return null
      return {
        id: `thumb-${layout.id}`,
        layout: layout.id,
        tone,
        background: toneBackground(theme, tone),
        elements,
        transition: 'none',
      } as Slide
    } catch {
      return null
    }
  }, [layout.id, theme])

  return (
    <button
      type="button"
      title={layout.description}
      onClick={() => onPick(layout.id)}
      className="group flex flex-col items-center gap-1.5 rounded-lg border border-line bg-surface p-1.5 text-center transition-all duration-150 hover:border-clay hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[4px] border border-line/60 bg-paper transition-transform duration-150 group-hover:-translate-y-[1px] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] pointer-events-none select-none">
        {slide ? (
          <LazyThumb render={() => <SlideThumb slide={slide} theme={theme} />} />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className={cn('slide-layout-thumb', `slide-layout-thumb--${layout.id}`)} aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </div>
      <small className="w-full truncate px-0.5 text-[12px] font-medium text-ink transition-colors group-hover:text-clay">
        {layout.name}
      </small>
    </button>
  )
}

const DesignCard = memo(function DesignCard({
  design,
  onOpen,
}: {
  design: SlideDesign
  onOpen: (design: SlideDesign) => void
}) {
  // dựng slide xem trước lúc ô cuộn tới, không dựng cả 8 bộ khi mở tab
  const cover = () => {
    const { theme, slides } = designPreview(design)
    return slides[0] ? <SlideThumb slide={slides[0]} theme={theme} /> : null
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(design)}
      title={design.description}
      className="group flex w-full min-w-0 flex-col text-left focus-visible:outline-none"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-line bg-paper shadow-sm transition-all duration-150 group-hover:border-clay group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-clay pointer-events-none select-none">
        <LazyThumb render={cover} />
      </div>
      <span className="mt-1 w-full truncate px-0.5 text-[12px] font-medium text-ink transition-colors group-hover:text-clay">
        {design.name}
      </span>
    </button>
  )
})

/** Bấm vào một bộ thiết kế: xem to từng slide, rồi mới thêm vào bài. */
function DesignPreviewModal({
  design,
  onAdd,
  onClose,
}: {
  design: SlideDesign
  onAdd: () => void
  onClose: () => void
}) {
  const { theme, slides } = designPreview(design)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(slides.length - 1, i + 1))
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, slides.length])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-ink/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Xem trước bộ ${design.name}`}
        className="anim-sheet my-auto flex w-full max-w-[880px] flex-col rounded-[14px] border border-line bg-surface p-4 shadow-float sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold text-ink">{design.name}</h3>
            <p className="mt-0.5 text-[13px] text-ink-3">
              {design.description} · {slides.length} slide
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-sunken hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="group/pv relative">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-line bg-paper shadow-sm pointer-events-none select-none">
            {slides[index] && <SlideThumb slide={slides[index]} theme={theme} />}
          </div>
          {[
            { dir: -1, label: 'Slide trước', Icon: ChevronLeft, pos: 'left-2', off: index === 0 },
            { dir: 1, label: 'Slide sau', Icon: ChevronRight, pos: 'right-2', off: index === slides.length - 1 },
          ].map(({ dir, label, Icon, pos, off }) => (
            <button
              key={dir}
              type="button"
              aria-label={label}
              disabled={off}
              onClick={() => setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + dir)))}
              className={cn(
                'absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-md transition hover:border-clay hover:text-clay disabled:pointer-events-none disabled:opacity-0',
                pos,
              )}
            >
              <Icon className="size-5" />
            </button>
          ))}
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-2.5 py-0.5 text-[11.5px] font-medium tabular-nums text-white">
            {index + 1} / {slides.length}
          </span>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'relative aspect-[16/9] w-[104px] shrink-0 overflow-hidden rounded-md border bg-paper transition-all',
                i === index ? 'border-clay ring-2 ring-clay/40' : 'border-line opacity-80 hover:opacity-100 hover:border-clay',
              )}
            >
              <span className="pointer-events-none absolute inset-0 select-none">
                <SlideThumb slide={slide} theme={theme} />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-[13px] font-medium text-ink-3 hover:text-ink"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-clay px-4 text-[13px] font-semibold text-white shadow-soft transition-colors hover:bg-clay-deep active:scale-[0.98]"
          >
            <Plus className="size-4" /> Thêm vào bài
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface DesignPromptModalProps {
  design: SlideDesign
  onConfirm: (option: 'replace' | 'keep') => void
  onCancel: () => void
}

function DesignPromptModal({ design, onConfirm, onCancel }: DesignPromptModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-ink/40 px-5 py-8 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="anim-sheet my-auto w-full max-w-[420px] rounded-[12px] border border-line bg-surface p-6 shadow-float"
      >
        <h3 className="text-[17px] font-semibold text-ink">Thêm bộ thiết kế vào bài</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
          Bộ thiết kế <strong>"{design.name}"</strong> gồm {design.slides.length} slide. Bạn muốn áp dụng giao diện này như thế nào?
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onConfirm('replace')}
            className="flex w-full flex-col items-start rounded-lg bg-clay px-3.5 py-2.5 text-left text-white shadow-soft transition-colors hover:bg-clay-deep active:scale-[0.98]"
          >
            <span className="text-[13.5px] font-semibold">Đổi cả bài sang giao diện này</span>
            <span className="text-[11.5px] text-white/85">
              Đổi theme cả bài sang phong cách của bộ, các slide cũ tự đổi màu & font
            </span>
          </button>

          <button
            type="button"
            onClick={() => onConfirm('keep')}
            className="flex w-full flex-col items-start rounded-lg border border-line bg-paper px-3.5 py-2.5 text-left text-ink transition-colors hover:border-clay hover:text-clay active:scale-[0.98]"
          >
            <span className="text-[13.5px] font-semibold">Giữ giao diện hiện tại, chỉ thêm slide</span>
            <span className="text-[11.5px] text-ink-3">
              Giữ nguyên màu và font bài hiện tại, dựng slide mẫu theo theme hiện có
            </span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="mt-1 flex w-full items-center justify-center rounded-lg py-2 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function TemplatesPanel({
  theme,
  isBlankDeck = false,
  onPick,
  onAddDesign,
  onCloseDrawer,
}: {
  theme?: ResolvedTheme | DeckTheme
  isBlankDeck?: boolean
  onPick: (id: SlideLayoutId) => void
  onAddDesign?: (design: SlideDesign, option: 'replace' | 'keep' | 'empty') => void
  onCloseDrawer?: () => void
}) {
  const resolvedTheme = useMemo(() => normalizeTheme(theme), [theme])
  const [mode, setMode] = useState<TemplateMode>(loadTemplateMode)
  const [promptDesign, setPromptDesign] = useState<SlideDesign | null>(null)
  const [previewDesign, setPreviewDesign] = useState<SlideDesign | null>(null)

  const handleModeChange = (next: TemplateMode) => {
    setMode(next)
    try {
      localStorage.setItem(TEMPLATE_MODE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const handleApplyDesign = (design: SlideDesign) => {
    if (isBlankDeck) {
      onAddDesign?.(design, 'empty')
      onCloseDrawer?.()
      return
    }
    setPromptDesign(design)
  }

  const handleConfirmPrompt = (option: 'replace' | 'keep') => {
    if (promptDesign) {
      onAddDesign?.(promptDesign, option)
      setPromptDesign(null)
      onCloseDrawer?.()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-line bg-surface px-3 pb-2.5 pt-3">
        <Segmented
          value={mode}
          onChange={handleModeChange}
          label="Chế độ mẫu"
          className="w-full flex [&>button]:flex-1 [&>button]:justify-center"
          options={[
            { key: 'layouts', label: 'Bố cục' },
            { key: 'designs', label: 'Thiết kế' },
          ]}
        />
      </div>
      <Scroll>
        <div className="pt-3">
          <div key={mode} className="anim-template-fade">
            {mode === 'layouts' ? (
              <div>
                {LAYOUT_GROUPS.map((group) => (
                  <Section key={group.title} title={group.title}>
                    <div className="grid grid-cols-2 gap-2">
                      {group.layouts.map((id) => {
                        const layout = LAYOUT_MAP.get(id)
                        if (!layout) return null
                        return (
                          <LayoutCard
                            key={id}
                            layout={layout}
                            theme={resolvedTheme}
                            onPick={onPick}
                          />
                        )
                      })}
                    </div>
                  </Section>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 pb-4">
                {SLIDE_DESIGNS.map((design) => (
                  <DesignCard key={design.id} design={design} onOpen={setPreviewDesign} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Scroll>
      {previewDesign && (
        <DesignPreviewModal
          design={previewDesign}
          onClose={() => setPreviewDesign(null)}
          onAdd={() => {
            setPreviewDesign(null)
            handleApplyDesign(previewDesign)
          }}
        />
      )}
      {promptDesign && (
        <DesignPromptModal
          design={promptDesign}
          onConfirm={handleConfirmPrompt}
          onCancel={() => setPromptDesign(null)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Đồ hoạ: hình khối (theo nhóm) và đồ hoạ vector (theo chủ đề)
 * ------------------------------------------------------------------ */
const GRAPHIC_CATEGORIES = (Object.keys(GRAPHIC_CATEGORY_LABEL) as GraphicCategory[])


const PREVIEW_COUNT = 4
/** hình quen thuộc nhất, hiện ở hàng xem trước */
const PREVIEW_SHAPES = ['line', 'rect', 'roundRect', 'ellipse', 'triangle', 'rightArrow']
const RECENT_KEY = 'slide-recent-graphics'
const RECENT_MAX = 8

const loadRecent = (): string[] => {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string' && graphicById(id)) : []
  } catch {
    return []
  }
}

/** đầu mỗi hàng xem trước: tên nhóm + "Xem tất cả" */
function RowHead({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <div className="mb-1 flex items-center justify-between px-1">
      <h4 className="text-[12px] font-semibold text-ink-3">{title}</h4>
      {onMore && (
        <button type="button" onClick={onMore} className="flex items-center text-[12px] text-ink-3 hover:text-clay">
          Xem tất cả <ChevronRight className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function ElementsPanel({ accent, canInsert, hint, onInsert }: { accent: string; canInsert: boolean; hint: string; onInsert: (el: SlideElement) => void }) {
  const [query, setQuery] = useState('')
  /** đang xem trang con của một nhóm đồ hoạ ('shapes' = toàn bộ hình khối) */
  const [open, setOpen] = useState<GraphicCategory | 'shapes' | 'frames' | null>(null)
  const listScroll = useRef(0)
  const [recent, setRecent] = useState(loadRecent)
  const q = query.trim()
  const hits = q ? findGraphics(q) : []
  // gợi ý theo tiêu đề bài giảng và chữ trên slide đang mở
  const suggested = hint.trim() ? searchGraphics(hint, PREVIEW_COUNT) : []

  const pickShape = (prst: string) => {
    if (!canInsert) return
    if (prst.startsWith('line')) {
      const lineArrow = prst === 'line' ? 'none' : prst === 'lineArrow' ? 'end' : 'both'
      onInsert({ id: uid(), type: 'shape', shape: 'line', x: 20, y: 47.5, w: 60, h: 5, fill: accent, border: 4, lineArrow })
      return
    }
    const box = defaultBox(prst)
    onInsert({ id: uid(), type: 'shape', shape: shapeNameOf(prst), x: (100 - box.w) / 2, y: (100 - box.h) / 2, ...box, fill: accent })
  }

  const insertGraphic = (graphicId: string) => {
    if (!canInsert) return
    // hộp theo đúng tỉ lệ đồ hoạ (ratio = rộng/cao), vừa trong ô 20% × 35.6% quanh giữa slide — hộp vuông cố định làm hoạ tiết chữ nhật thừa lề
    const ratio = graphicById(graphicId)?.ratio || 1
    let w = 20
    let h = (w * 16) / (9 * ratio)
    if (h > 35.6) {
      h = 35.6
      w = (h * 9 * ratio) / 16
    }
    onInsert({ id: uid(), type: 'graphic', graphicId, x: 48 - w / 2, y: 45.8 - h / 2, w, h })
    const next = [graphicId, ...recent.filter((id) => id !== graphicId)].slice(0, RECENT_MAX)
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      /* bỏ qua: chỉ là tiện ích "dùng gần đây" */
    }
  }

  const items = (cat: GraphicCategory) => GRAPHICS.filter((g) => g.category === cat)
  const recentItems = recent.map((id) => graphicById(id)).filter((g): g is NonNullable<typeof g> => Boolean(g))

  const header = (
    <div className="shrink-0 border-b border-line bg-surface px-3 pb-2.5 pt-3">
      <SearchBox value={query} onChange={setQuery} placeholder="Tìm hình khối hoặc đồ hoạ" />
    </div>
  )

  // kết quả tìm kiếm: đồ hoạ gom theo nhóm, kèm số lượng
  if (q) {
    // nhóm có kết quả khớp nhất lên trước (hits đã xếp theo độ khớp)
    const byCat = GRAPHIC_CATEGORIES.map((c) => ({ c, list: hits.filter((g) => g.category === c) }))
      .filter((x) => x.list.length > 0)
      .sort((a, b) => hits.indexOf(a.list[0]) - hits.indexOf(b.list[0]))
    const frameHits = PHOTO_FRAMES.filter((f) => matchesWords(`khung anh hinh ${f.label}`, q))
    return (
      <>
        {header}
        <Scroll>
          <div className="pt-3">
            {visibleGroups(q).length > 0 && (
              <Section title="Hình khối">
                <ShapeGallery onPick={pickShape} query={q} scroll={false} />
              </Section>
            )}
            {frameHits.length > 0 && (
              <Section title={`Khung ảnh (${frameHits.length})`}>
                <FrameGrid frames={frameHits} onInsert={onInsert} />
              </Section>
            )}
            {byCat.map(({ c, list }) => (
              <Section key={c} title={`${GRAPHIC_CATEGORY_LABEL[c]} (${list.length})`}>
                <GraphicGrid items={list} onPick={insertGraphic} />
              </Section>
            ))}
            {byCat.length === 0 && frameHits.length === 0 && visibleGroups(q).length === 0 && (
              <p className="text-[12px] text-ink-3">Không có đồ hoạ nào khớp.</p>
            )}
          </div>
        </Scroll>
      </>
    )
  }

  // trang con: toàn bộ một nhóm, có nút quay lại
  if (open) {
    return (
      <>
        <div className="flex shrink-0 items-center gap-1 border-b border-line bg-surface px-2 py-2.5">
          <button type="button" onClick={() => setOpen(null)} aria-label="Quay lại" className="rounded-md p-1 text-ink-2 hover:bg-paper-2 hover:text-clay">
            <ChevronLeft className="size-5" />
          </button>
          <h3 className="text-[14px] font-semibold text-ink">{open === 'shapes' ? 'Hình khối' : open === 'frames' ? 'Khung ảnh' : GRAPHIC_CATEGORY_LABEL[open]}</h3>
        </div>
        <Scroll>
          <div className="pt-3">
            {open === 'shapes' ? <ShapeGallery onPick={pickShape} scroll={false} /> : open === 'frames' ? <FrameGrid frames={PHOTO_FRAMES} onInsert={onInsert} /> : <GraphicGrid items={items(open)} onPick={insertGraphic} />}
          </div>
        </Scroll>
      </>
    )
  }

  const shapePreview = PRESET_GROUPS.flatMap((g) => g.shapes).filter((s) => PREVIEW_SHAPES.includes(s.prst))

  return (
    <>
      {header}
      <Scroll keep={listScroll}>
      <div className="pt-3">
        {recentItems.length > 0 && (
          <Section>
            <RowHead title="Dùng gần đây" />
            <GraphicGrid items={recentItems.slice(0, PREVIEW_COUNT * 2)} onPick={insertGraphic} />
          </Section>
        )}
        {suggested.length > 0 && (
          <Section>
            <RowHead title="Gợi ý cho slide này" />
            <GraphicGrid items={suggested} onPick={insertGraphic} />
          </Section>
        )}
        <Section>
          <RowHead title="Hình khối" onMore={() => setOpen('shapes')} />
          <div className="flex flex-wrap gap-1" onMouseDown={(e) => e.preventDefault()}>
            {shapePreview.map((s) => (
              <button
                key={s.prst}
                type="button"
                title={s.label}
                aria-label={s.label}
                onClick={() => pickShape(s.prst)}
                className="flex size-[40px] items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 hover:text-clay"
              >
                <ShapePreview prst={s.prst} />
              </button>
            ))}
          </div>
        </Section>
        <Section>
          <RowHead title="Khung ảnh" onMore={() => setOpen('frames')} />
          <FrameGrid frames={PHOTO_FRAMES.slice(0, PREVIEW_COUNT)} onInsert={onInsert} />
        </Section>
        {GRAPHIC_CATEGORIES.map((cat) => {
          const list = items(cat)
          if (list.length === 0) return null
          return (
            <Section key={cat}>
              <RowHead title={GRAPHIC_CATEGORY_LABEL[cat]} onMore={() => setOpen(cat)} />
              <GraphicGrid items={list.slice(0, PREVIEW_COUNT)} onPick={insertGraphic} />
            </Section>
          )
        })}
      </div>
      </Scroll>
    </>
  )
}

function FrameGrid({ frames, onInsert }: { frames: typeof PHOTO_FRAMES; onInsert: (el: SlideElement) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2" onMouseDown={(e) => e.preventDefault()}>
      {frames.map((f) => (
        <button
          key={f.id}
          type="button"
          title={`${f.label} · kéo ảnh vào khung`}
          aria-label={f.label}
          onClick={() => onInsert({ id: uid(), type: 'image', shape: f.id, x: 37.5, y: 22.5, w: 25, h: 44.4 })}
          className="flex aspect-square items-center justify-center rounded-md p-1 transition-colors hover:bg-paper-2"
        >
          <img src={FRAME_PLACEHOLDER} alt="" className="size-full object-cover" style={{ clipPath: f.clip }} />
        </button>
      ))}
    </div>
  )
}

/** SVG đồ hoạ mặc định hay được vẽ lại: nhớ chuỗi đã dựng thay vì replace trên SVG vài KB mỗi lần */
const markupCache = new Map<string, string>()
const cachedMarkup = (id: string) => {
  let m = markupCache.get(id)
  if (m === undefined) markupCache.set(id, (m = graphicMarkup(id)))
  return m
}

function GraphicGrid({ items, onPick }: { items: Array<{ id: string; name: string }>; onPick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {items.map((g) => (
        <button
          key={g.id}
          type="button"
          title={g.name}
          aria-label={g.name}
          onClick={() => onPick(g.id)}
          className="flex aspect-square items-center justify-center rounded-md p-1.5 text-ink-2 transition-colors hover:bg-paper-2 hover:text-clay"
        >
          {/* SVG lấy từ registry đồ hoạ của dự án (không phải nội dung người dùng) */}
          <span className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: cachedMarkup(g.id) }} />
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Icon: biểu tượng đơn sắc, chia nhóm theo môn/chủ đề, tìm theo tên và từ khoá
 * ------------------------------------------------------------------ */
function IconsPanel({ canInsert, onInsert }: { canInsert: boolean; onInsert: (el: SlideElement) => void }) {
  const [query, setQuery] = useState('')
  const q = norm(query.trim())

  // bộ 27 icon AI/layout dùng đứng trước, rồi tới thư viện mở rộng
  const all = useMemo(
    () => [
      ...SLIDE_ASSET_IDS.map((id) => ({ id: id as string, ...SLIDE_ASSETS[id] })),
      ...ICON_LIBRARY,
    ],
    [],
  )
  const matches = (i: (typeof all)[number]) => !q || norm([i.id, i.group, ...i.tags].join(' ')).includes(q)
  const hits = all.filter(matches)
  const groups = Array.from(new Set(hits.map((i) => i.group)))

  const insert = (assetId: string) => {
    if (!canInsert) return
    onInsert({ id: uid(), type: 'icon', assetId, x: 44, y: 36, w: 12, h: 21.3 })
  }

  return (
    <>
      <div className="shrink-0 border-b border-line bg-surface px-3 pb-2.5 pt-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Tìm icon, ví dụ: sách, hoá, xe, hoa" />
      </div>
      <Scroll>
        <div className="pt-3">
          {groups.map((group) => (
            <Section key={group} title={group}>
              <div className="grid grid-cols-4 gap-1.5">
                {hits
                  .filter((i) => i.group === group)
                  .map(({ id, icon: Icon, tags }) => (
                    <button
                      key={id}
                      type="button"
                      title={tags[0]}
                      aria-label={tags[0]}
                      onClick={() => insert(id)}
                      className="flex aspect-square items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 hover:text-clay"
                    >
                      <Icon size={24} weight="duotone" />
                    </button>
                  ))}
              </div>
            </Section>
          ))}
          {q && hits.length === 0 && <p className="text-[12px] text-ink-3">Không có icon nào khớp.</p>}
        </div>
      </Scroll>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Tải lên: PNG/JPG/WebP. Ảnh được đẩy lên R2, danh sách giữ theo tài khoản để chèn lại ở máy nào cũng được.
 * ------------------------------------------------------------------ */
interface UploadedImage {
  src: string
  /** tỉ lệ cao/rộng của ảnh gốc, để giữ đúng dáng khi chèn */
  ratio: number
}

function UploadsPanel({ canInsert, onInsert }: { canInsert: boolean; onInsert: (el: SlideElement) => void }) {
  const images = useUploads((s) => s.items)
  const addUpload = useUploads((s) => s.add)
  const removeUpload = useUploads((s) => s.remove)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const insert = (img: UploadedImage) => {
    const w = 40
    onInsert({ id: uid(), type: 'image', src: img.src, x: (100 - w) / 2, y: 26, w, h: Math.min(60, w * img.ratio * (16 / 9)) })
  }

  const onFile = async (file: File) => {
    setError(null)
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError('Chỉ nhận ảnh PNG, JPG hoặc WebP.')
    if (file.size > MAX_UPLOAD_BYTES) return setError('Ảnh quá 8 MB. Hãy thu nhỏ trước khi tải lên.')
    setBusy(true)
    try {
      const img = await readImage(file)
      let src = img.src
      try {
        src = await uploadImage(img.src)
        addUpload({ id: uid(), src, ratio: img.ratio })
      } catch {
        // không đẩy lên được (mất mạng…): vẫn chèn vào slide, ảnh sẽ được chuyển lên R2 khi đồng bộ
        setError('Chưa lưu được ảnh vào tài khoản, ảnh vẫn được chèn vào slide.')
      }
      insert({ src, ratio: img.ratio })
    } catch {
      setError('Không đọc được ảnh này.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-line-2 px-3 py-5 text-center text-[12.5px] text-ink-3 transition-colors hover:border-clay hover:text-clay',
          (!canInsert || busy) && 'pointer-events-none opacity-50',
        )}
      >
        <Upload className="size-5" strokeWidth={1.6} />
        {busy ? 'Đang xử lý ảnh…' : 'Chọn ảnh từ máy để thêm vào slide'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void onFile(file)
          }}
        />
      </label>
      {error && <p role="alert" className="mt-2 text-[12px] text-clay">{error}</p>}

      {images.length > 0 && (
        <>
          <h4 className="mb-1.5 mt-4 text-[11.5px] font-semibold text-ink-3">Ảnh của bạn</h4>
          <div className="grid grid-cols-2 gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative">
                <button
                  type="button"
                  disabled={!canInsert}
                  onClick={() => insert(img)}
                  title="Chèn vào slide"
                  className="block w-full overflow-hidden rounded-md border border-line bg-white p-1 transition-colors hover:border-clay disabled:opacity-40"
                >
                  <img src={img.src} alt="" loading="lazy" className="aspect-video w-full object-contain" onDragStart={(e) => {
                    e.dataTransfer.setData('text/uri-list', img.src)
                    dragImage.src = img.src
                  }}
                  onDragEnd={() => (dragImage.src = '')} />
                </button>
                <button
                  type="button"
                  onClick={() => removeUpload(img.id)}
                  title="Xoá khỏi danh sách (slide đã chèn không đổi)"
                  aria-label="Xoá ảnh khỏi danh sách"
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-white/90 text-ink-3 opacity-0 shadow-soft transition-opacity hover:text-clay focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Đọc ảnh thành data URL; ảnh quá lớn được thu nhỏ xuống MAX_IMAGE_SIDE. */
async function readImage(file: File): Promise<UploadedImage> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('decode'))
    el.src = url
  })
  const { naturalWidth: nw, naturalHeight: nh } = img
  const ratio = nh / nw
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(nw, nh))
  if (scale === 1) return { src: url, ratio }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(nw * scale)
  canvas.height = Math.round(nh * scale)
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
  // PNG giữ độ trong suốt; ảnh khác xuất JPEG cho nhẹ
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  return { src: canvas.toDataURL(type, 0.9), ratio }
}
